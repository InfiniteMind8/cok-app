'use server'

import { withAdminAction, type AuthUser } from '@/lib/action'
import { db } from '@/lib/db'
import { createAuditEntry } from '@/lib/audit'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

async function _recordTreasuryAdjustmentAction(
  admin: AuthUser,
  input: { amount: string; currency: string; reason: string },
) {
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

export const recordTreasuryAdjustmentAction = withAdminAction(_recordTreasuryAdjustmentAction, {
  roles: ['MASTER_ADMIN'],
})

async function _updateWalletFloorAction(
  admin: AuthUser,
  input: { walletId: string; floor: string | null },
) {
  if (input.floor !== null) {
    const parsed = new Prisma.Decimal(input.floor)
    if (parsed.lt(0)) throw new Error('Floor must be zero or a positive value, or null for unlimited.')
  }

  const wallet = await db.wallet.findUnique({
    where: { id: input.walletId },
    select: { id: true, isSystem: true, systemKey: true, floor_kcrd: true },
  })
  if (!wallet) throw new Error(`Wallet not found: ${input.walletId}`)
  if (!wallet.isSystem) throw new Error('Floor protection applies to system wallets only.')

  const newFloor = input.floor !== null ? new Prisma.Decimal(input.floor) : null

  await db.wallet.update({
    where: { id: input.walletId },
    data: { floor_kcrd: newFloor },
  })

  await createAuditEntry({
    action: 'wallet.floor.updated',
    entity: 'Wallet',
    entityId: input.walletId,
    actorId: admin.id,
    before: { floor_kcrd: wallet.floor_kcrd?.toString() ?? null },
    after: { floor_kcrd: newFloor?.toString() ?? null, systemKey: wallet.systemKey },
  })

  revalidatePath('/admin/treasury')
  revalidatePath('/admin/settings')
}

export const updateWalletFloorAction = withAdminAction(_updateWalletFloorAction, {
  roles: ['MASTER_ADMIN'],
})
