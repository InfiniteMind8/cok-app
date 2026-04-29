'use server'

import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function completeTourAction(): Promise<void> {
  const user = await getCurrentUser()
  if (!user) return
  await db.user.update({
    where: { id: user.id },
    data: { onboardingTourCompletedAt: new Date() },
  })
}

export async function dismissTourAction(): Promise<void> {
  const user = await getCurrentUser()
  if (!user) return
  await db.user.update({
    where: { id: user.id },
    data: { onboardingTourDismissedAt: new Date() },
  })
}
