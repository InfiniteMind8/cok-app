'use server'

import { withAdminAction, type AuthUser } from '@/lib/action'
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

async function _recordDepositAction(admin: AuthUser, input: RecordDepositInput) {
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

export const recordDepositAction = withAdminAction(_recordDepositAction, { roles: ['MASTER_ADMIN'] })
