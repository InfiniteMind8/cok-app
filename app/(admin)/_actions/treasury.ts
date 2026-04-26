'use server'

import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function recordTreasuryAdjustmentAction(input: {
  amount: string
  currency: string
  reason: string
}) {
  const admin = await requireRole(['MASTER_ADMIN'])

  if (!input.reason.trim()) throw new Error('Reason is required')
  const amount = parseFloat(input.amount)
  if (isNaN(amount) || amount === 0) throw new Error('Amount must be a non-zero number')

  await db.treasuryAdjustment.create({
    data: {
      amount: input.amount,
      currency: input.currency,
      reason: input.reason.trim(),
      recordedBy: admin.id,
    },
  })

  revalidatePath('/treasury')
  revalidatePath('/dashboard')
  revalidatePath('/settings')
}
