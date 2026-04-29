import 'server-only'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getActiveFeeSchedule, calculateFee } from './fee-engine'
import { reconcileTreasury } from './reconciliation'
import { FloorBreachError } from './types'
import type { TransferRequest, TransferResult, FeeScheduleRules } from './types'

export async function transferCredits(req: TransferRequest): Promise<TransferResult> {
  if (req.amount.lte(0)) {
    throw new Error(`Amount must be positive, got ${req.amount}`)
  }

  // Fetch fee schedule outside the transaction (read-only, idempotent)
  const schedule = await getActiveFeeSchedule()
  const rules = ((schedule?.rules ?? {}) as FeeScheduleRules)
  const feeSplit = calculateFee(req.type, req.amount, rules)

  const transactionId = await db.$transaction(async (tx) => {
    const [fromWallet, toWallet] = await Promise.all([
      tx.wallet.findUnique({
        where: { id: req.fromWalletId },
        select: { id: true, isSystem: true, systemKey: true, floor_kcrd: true },
      }),
      tx.wallet.findUnique({ where: { id: req.toWalletId }, select: { id: true } }),
    ])
    if (!fromWallet) throw new Error(`Wallet not found: ${req.fromWalletId}`)
    if (!toWallet) throw new Error(`Wallet not found: ${req.toWalletId}`)

    // Check sender balance
    const balanceAgg = await tx.ledgerEntry.aggregate({
      where: { walletId: req.fromWalletId },
      _sum: { amount: true },
    })
    const senderBalance = new Prisma.Decimal(balanceAgg._sum.amount ?? 0)
    if (senderBalance.lt(req.amount)) {
      throw new Error(
        `Insufficient balance: wallet ${req.fromWalletId} has ${senderBalance}, needs ${req.amount}`
      )
    }

    // Floor protection: abort if this system wallet would drop below its configured floor
    if (fromWallet.isSystem && fromWallet.floor_kcrd !== null) {
      const floor = new Prisma.Decimal(fromWallet.floor_kcrd)
      const postTransferBalance = senderBalance.sub(req.amount)
      if (postTransferBalance.lt(floor)) {
        const headroom = postTransferBalance.sub(floor)
        throw new FloorBreachError(
          fromWallet.systemKey ?? fromWallet.id,
          postTransferBalance,
          floor,
          headroom,
        )
      }
    }

    // Get system wallet IDs
    const systemWallets = await tx.wallet.findMany({
      where: { isSystem: true },
      select: { id: true, systemKey: true },
    })
    const sysMap = new Map(systemWallets.map((w) => [w.systemKey, w.id]))

    // Build ledger entries
    const entries: Array<{ walletId: string; amount: Prisma.Decimal; description?: string }> = [
      { walletId: req.fromWalletId, amount: req.amount.neg(), description: req.description },
      { walletId: req.toWalletId, amount: feeSplit.netAmount, description: req.description },
    ]

    if (feeSplit.communityFund.gt(0)) {
      const id = sysMap.get('community_fund')
      if (!id) throw new Error('System wallet community_fund not found')
      entries.push({ walletId: id, amount: feeSplit.communityFund, description: 'Fee: community fund' })
    }
    if (feeSplit.operationsFund.gt(0)) {
      const id = sysMap.get('operations_fund')
      if (!id) throw new Error('System wallet operations_fund not found')
      entries.push({ walletId: id, amount: feeSplit.operationsFund, description: 'Fee: operations fund' })
    }
    if (feeSplit.developerShare.gt(0)) {
      const id = sysMap.get('developer_share')
      if (!id) throw new Error('System wallet developer_share not found')
      entries.push({ walletId: id, amount: feeSplit.developerShare, description: 'Fee: developer share' })
    }

    // Zero-sum invariant check — throws inside tx, triggers automatic rollback
    const sum = entries.reduce((acc, e) => acc.add(e.amount), new Prisma.Decimal(0))
    if (!sum.eq(0)) {
      throw new Error(`Ledger entries do not sum to zero: ${sum.toFixed(8)}`)
    }

    const txRow = await tx.transaction.create({
      data: {
        type: req.type,
        description: req.description,
        reference: req.reference,
        feeScheduleId: schedule?.id ?? null,
        initiatedBy: req.initiatedBy,
        metadata: req.metadata !== undefined ? (req.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        entries: {
          createMany: {
            data: entries.map((e) => ({
              walletId: e.walletId,
              amount: e.amount,
              description: e.description,
            })),
          },
        },
      },
    })

    return txRow.id
  })

  if (process.env.NODE_ENV === 'development') {
    const check = await reconcileTreasury()
    if (!check.isBalanced) {
      throw new Error(
        `RECONCILIATION FAILED after transaction ${transactionId}: discrepancy ${check.discrepancy}`
      )
    }
  }

  return {
    transactionId,
    grossAmount: req.amount,
    netAmount: feeSplit.netAmount,
    feeSplit,
    feeScheduleId: schedule?.id ?? null,
  }
}
