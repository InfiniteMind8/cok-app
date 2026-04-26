'use server'

import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  approveSettlement,
  declineSettlement,
  executeSettlement,
} from '@/lib/ledger/settlements'
import { notify } from '@/lib/notifications/service'
import { revalidatePath } from 'next/cache'

export async function approveSettlementAction(settlementId: string) {
  const admin = await requireRole(['MASTER_ADMIN', 'ADMIN'])

  const settlement = await approveSettlement({ settlementId, approvedBy: admin.id })

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

  revalidatePath('/approvals')
  revalidatePath('/treasury')
}

export async function declineSettlementAction(settlementId: string, reason: string) {
  await requireRole(['MASTER_ADMIN', 'ADMIN'])

  if (!reason.trim()) throw new Error('Decline reason is required')

  await declineSettlement({ settlementId, declinedBy: '', reason })
  revalidatePath('/approvals')
}

export async function executeSettlementAction(settlementId: string, proofUrl?: string) {
  const admin = await requireRole(['MASTER_ADMIN'])

  const { userId } = await db.settlementRequest.findUniqueOrThrow({
    where: { id: settlementId },
    select: { userId: true },
  })

  await executeSettlement({ settlementId, settledBy: admin.id, proofUrl })

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

  revalidatePath('/treasury')
  revalidatePath('/approvals')
}
