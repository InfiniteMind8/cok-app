'use server'

import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

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
