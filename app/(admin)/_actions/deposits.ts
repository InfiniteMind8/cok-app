'use server'

import { requireRole } from '@/lib/auth'
import { recordDeposit } from '@/lib/ledger/deposits'
import { revalidatePath } from 'next/cache'

interface RecordDepositInput {
  userId: string
  fiatAmount: string
  currency: string
  paymentMethod: string
  proofUrl?: string
  notes?: string
}

export async function recordDepositAction(input: RecordDepositInput) {
  const admin = await requireRole(['MASTER_ADMIN'])

  const result = await recordDeposit({
    userId: input.userId,
    fiatAmount: input.fiatAmount,
    currency: input.currency,
    paymentMethod: input.paymentMethod,
    proofUrl: input.proofUrl,
    recordedBy: admin.id,
  })

  revalidatePath('/treasury')
  revalidatePath('/dashboard')
  return { transactionId: result.transactionId, kAmount: result.kAmount.toFixed(2) }
}
