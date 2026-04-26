import 'server-only'
import { Prisma, Role } from '@prisma/client'
import { TransactionType } from '@prisma/client'
import { db } from '@/lib/db'
import { transferCredits } from './service'

interface RequestSettlementArgs {
  userId: string
  amount: Prisma.Decimal | number | string
  purpose?: string
}

interface ApproveSettlementArgs {
  settlementId: string
  approvedBy: string
}

interface DeclineSettlementArgs {
  settlementId: string
  declinedBy: string
  reason: string
}

interface ExecuteSettlementArgs {
  settlementId: string
  settledBy: string
  proofUrl?: string
}

function settlementTypeForRole(role: Role): TransactionType {
  switch (role) {
    case 'VENDOR':
      return 'VENDOR_SETTLEMENT'
    case 'VISITOR':
      return 'VISITOR_SETTLEMENT'
    default:
      return 'RESIDENT_SETTLEMENT'
  }
}

export async function requestSettlement(args: RequestSettlementArgs) {
  const amount = new Prisma.Decimal(args.amount)
  if (amount.lte(0)) throw new Error('Settlement amount must be positive')

  return db.settlementRequest.create({
    data: {
      userId: args.userId,
      amount,
      status: 'PENDING_APPROVAL',
      purpose: args.purpose,
    },
  })
}

export async function approveSettlement(args: ApproveSettlementArgs) {
  const request = await db.settlementRequest.findUnique({
    where: { id: args.settlementId },
  })
  if (!request) throw new Error(`Settlement ${args.settlementId} not found`)
  if (request.status !== 'PENDING_APPROVAL') {
    throw new Error(`Cannot approve settlement in status ${request.status}`)
  }

  return db.settlementRequest.update({
    where: { id: args.settlementId },
    data: {
      status: 'APPROVED',
      approvedBy: args.approvedBy,
      approvedAt: new Date(),
    },
  })
}

export async function declineSettlement(args: DeclineSettlementArgs) {
  const request = await db.settlementRequest.findUnique({
    where: { id: args.settlementId },
  })
  if (!request) throw new Error(`Settlement ${args.settlementId} not found`)
  if (request.status !== 'PENDING_APPROVAL') {
    throw new Error(`Cannot decline settlement in status ${request.status}`)
  }

  return db.settlementRequest.update({
    where: { id: args.settlementId },
    data: {
      status: 'DECLINED',
      declinedReason: args.reason,
    },
  })
}

export async function executeSettlement(args: ExecuteSettlementArgs) {
  const request = await db.settlementRequest.findUnique({
    where: { id: args.settlementId },
  })
  if (!request) throw new Error(`Settlement ${args.settlementId} not found`)
  if (request.status !== 'APPROVED') {
    throw new Error(`Cannot execute settlement in status ${request.status}`)
  }

  const user = await db.user.findUnique({
    where: { id: request.userId },
    select: { role: true },
  })
  if (!user) throw new Error(`User ${request.userId} not found`)

  const userWallet = await db.wallet.findUnique({ where: { userId: request.userId } })
  if (!userWallet) throw new Error(`No wallet found for user ${request.userId}`)

  const burnWallet = await db.wallet.findUnique({ where: { systemKey: 'settlement_burn' } })
  if (!burnWallet) throw new Error('settlement_burn system wallet not found')

  const txType = settlementTypeForRole(user.role)
  const amount = new Prisma.Decimal(request.amount)

  const result = await transferCredits({
    fromWalletId: userWallet.id,
    toWalletId: burnWallet.id,
    amount,
    type: txType,
    description: `Settlement execution — ${txType}`,
    initiatedBy: args.settledBy,
  })

  await db.settlementRequest.update({
    where: { id: args.settlementId },
    data: {
      status: 'SETTLED',
      settledBy: args.settledBy,
      settledAt: new Date(),
      proofUrl: args.proofUrl,
      transactionId: result.transactionId,
    },
  })

  return result
}
