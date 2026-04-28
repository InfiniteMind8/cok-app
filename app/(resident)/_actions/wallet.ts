'use server'

import { requireRole, denyIfVisitor } from '@/lib/auth'
import { requestSettlement } from '@/lib/ledger/settlements'
import { getWalletBalance } from '@/lib/ledger/balance'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function requestSettlementAction(amount: string, purpose: string) {
  await denyIfVisitor()
  const user = await requireRole(['RESIDENT'])

  const parsedAmount = new Prisma.Decimal(amount)
  if (parsedAmount.lte(0)) throw new Error('Amount must be greater than zero')

  const wallet = await db.wallet.findUnique({ where: { userId: user.id } })
  if (!wallet) throw new Error('Wallet not found')

  const balance = await getWalletBalance(wallet.id)
  if (parsedAmount.gt(balance)) throw new Error('Amount exceeds your current balance')

  await requestSettlement({ userId: user.id, amount: parsedAmount, purpose: purpose.trim() || undefined })

  revalidatePath('/wallet')
  revalidatePath('/wallet/settlements')
}

export async function cancelSettlementRequestAction(requestId: string) {
  await denyIfVisitor()
  const user = await requireRole(['RESIDENT'])

  const request = await db.settlementRequest.findUnique({ where: { id: requestId } })
  if (!request) throw new Error('Settlement request not found')
  if (request.userId !== user.id) throw new Error('Not authorised')
  if (request.status !== 'PENDING_APPROVAL') throw new Error('Only pending requests can be cancelled')

  await db.settlementRequest.update({
    where: { id: requestId },
    data: { status: 'CANCELLED' },
  })

  revalidatePath('/wallet/settlements')
}

export async function loadMoreTransactionsAction(walletId: string, cursor: string) {
  const user = await requireRole(['RESIDENT', 'VISITOR'])

  const wallet = await db.wallet.findUnique({ where: { id: walletId } })
  if (!wallet || wallet.userId !== user.id) throw new Error('Not authorised')

  const { getTransactionPage } = await import('@/lib/queries/wallet')
  return getTransactionPage(walletId, cursor)
}
