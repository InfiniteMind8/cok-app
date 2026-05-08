'use server'

import { z } from 'zod/v4'
import { withResidentAction, type AuthUser } from '@/lib/action'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getStorage } from '@/lib/storage/driver'

const DisplayCurrencySchema = z.enum(['KCRD', 'USD', 'GYD'])

async function _updateDisplayCurrencyAction(user: AuthUser, currency: unknown) {
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

export const updateDisplayCurrencyAction = withResidentAction(_updateDisplayCurrencyAction, {
  roles: ['RESIDENT', 'VISITOR'],
})

async function _updateIntroductionAction(user: AuthUser, introduction: string) {
  await db.user.update({
    where: { id: user.id },
    data: { introduction: introduction.trim() },
  })

  revalidatePath('/profile')
}

export const updateIntroductionAction = withResidentAction(_updateIntroductionAction, {
  roles: ['RESIDENT'],
})

async function _updateProfilePhotoAction(user: AuthUser, url: string) {
  await db.user.update({
    where: { id: user.id },
    data: { profilePhotoUrl: url },
  })

  revalidatePath('/profile')
}

export const updateProfilePhotoAction = withResidentAction(_updateProfilePhotoAction, {
  roles: ['RESIDENT', 'VISITOR'],
})

async function _uploadProfilePhotoAction(
  user: AuthUser,
  storageKey: string,
): Promise<{ signedUrl: string }> {
  await db.user.update({
    where: { id: user.id },
    data: { profilePhotoUrl: storageKey },
  })

  revalidatePath('/profile')
  const signedUrl = await getStorage().getSignedUrl(storageKey, 300)
  return { signedUrl }
}

export const uploadProfilePhotoAction = withResidentAction(_uploadProfilePhotoAction, {
  roles: ['RESIDENT', 'VISITOR'],
})
