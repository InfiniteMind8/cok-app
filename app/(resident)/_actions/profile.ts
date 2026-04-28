'use server'

import { z } from 'zod/v4'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

const DisplayCurrencySchema = z.enum(['KCRD', 'USD', 'GYD'])

export async function updateDisplayCurrencyAction(currency: unknown) {
  const user = await requireRole(['RESIDENT', 'VISITOR'])
  const parsed = DisplayCurrencySchema.safeParse(currency)
  if (!parsed.success) return { ok: false, error: 'Invalid currency.' }

  await db.user.update({
    where: { id: user.id },
    data: { displayCurrency: parsed.data },
  })

  revalidatePath('/profile')
  revalidatePath('/wallet')
  return { ok: true }
}

export async function updateIntroductionAction(introduction: string) {
  const user = await requireRole(['RESIDENT'])

  await db.user.update({
    where: { id: user.id },
    data: { introduction: introduction.trim() },
  })

  revalidatePath('/profile')
}

export async function updateProfilePhotoAction(url: string) {
  const user = await requireRole(['RESIDENT', 'VISITOR'])

  await db.user.update({
    where: { id: user.id },
    data: { profilePhotoUrl: url },
  })

  revalidatePath('/profile')
}
