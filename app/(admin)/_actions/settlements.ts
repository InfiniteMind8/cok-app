'use server'

import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email/service'
import {
  approveSettlement,
  declineSettlement,
  executeSettlement,
} from '@/lib/ledger/settlements'
import { notify } from '@/lib/notifications/service'
import { revalidatePath } from 'next/cache'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function approveSettlementAction(settlementId: string) {
  const admin = await requireRole(['MASTER_ADMIN', 'ADMIN'])

  const settlement = await approveSettlement({ settlementId, approvedBy: admin.id })

  const user = await db.user.findUnique({
    where: { id: settlement.userId },
    select: { email: true, fullName: true },
  })

  try {
    await notify({
      userId: settlement.userId,
      type: 'SETTLEMENT_APPROVED',
      title: 'Settlement request approved',
      body: 'Your request has been approved and will be processed shortly.',
      link: '/wallet/settlements',
      priority: 'yellow',
    })
  } catch {
    // Notification failure must not fail the business action
  }

  if (user) {
    sendEmail({
      to: user.email,
      subject: 'Your settlement request has been approved',
      template: 'settlement-confirmation',
      data: {
        recipientName: user.fullName,
        amountKcrd: settlement.amount.toString(),
        status: 'approved',
        settlementId,
        historyUrl: `${APP_URL}/wallet/settlements`,
      },
      idempotencyKey: `settlement-approved:${settlementId}`,
    }).catch(() => {
      // EmailLog captures failure; non-fatal
    })
  }

  revalidatePath('/approvals')
  revalidatePath('/treasury')
}

export async function declineSettlementAction(settlementId: string, reason: string) {
  await requireRole(['MASTER_ADMIN', 'ADMIN'])

  if (!reason.trim()) throw new Error('Decline reason is required')

  const settlement = await db.settlementRequest.findUniqueOrThrow({
    where: { id: settlementId },
    select: { userId: true, amount: true },
  })

  const user = await db.user.findUnique({
    where: { id: settlement.userId },
    select: { email: true, fullName: true },
  })

  await declineSettlement({ settlementId, declinedBy: '', reason })

  if (user) {
    sendEmail({
      to: user.email,
      subject: 'Your settlement request was declined',
      template: 'settlement-confirmation',
      data: {
        recipientName: user.fullName,
        amountKcrd: settlement.amount.toString(),
        status: 'declined',
        declineReason: reason,
        settlementId,
        historyUrl: `${APP_URL}/wallet/settlements`,
      },
      idempotencyKey: `settlement-declined:${settlementId}`,
    }).catch(() => {
      // EmailLog captures failure; non-fatal
    })
  }

  revalidatePath('/approvals')
}

export async function executeSettlementAction(settlementId: string, proofUrl?: string) {
  const admin = await requireRole(['MASTER_ADMIN'])

  const { userId, amount } = await db.settlementRequest.findUniqueOrThrow({
    where: { id: settlementId },
    select: { userId: true, amount: true },
  })

  await executeSettlement({ settlementId, settledBy: admin.id, proofUrl, idempotencyKey: settlementId })

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, fullName: true },
  })

  try {
    await notify({
      userId,
      type: 'SETTLEMENT_SETTLED',
      title: 'Settlement completed',
      body: proofUrl
        ? 'Payment processed. View proof in your settlement history.'
        : 'Your settlement has been processed.',
      link: '/wallet/settlements',
      priority: 'yellow',
    })
  } catch {
    // Notification failure must not fail the business action
  }

  if (user) {
    sendEmail({
      to: user.email,
      subject: 'Your settlement has been processed',
      template: 'settlement-confirmation',
      data: {
        recipientName: user.fullName,
        amountKcrd: amount.toString(),
        status: 'settled',
        settlementId,
        historyUrl: `${APP_URL}/wallet/settlements`,
      },
      idempotencyKey: `settlement-settled:${settlementId}`,
    }).catch(() => {
      // EmailLog captures failure; non-fatal
    })
  }

  revalidatePath('/treasury')
  revalidatePath('/approvals')
}
