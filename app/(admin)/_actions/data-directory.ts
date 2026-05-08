'use server'

import { withAdminAction, type AuthUser } from '@/lib/action'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email/service'
import { clerkClient } from '@clerk/nextjs/server'
import { format } from 'date-fns'
import { revalidatePath } from 'next/cache'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

async function _resetUserMfaAction(
  actor: AuthUser,
  targetUserId: string,
): Promise<{ ok: boolean; error?: string }> {
  const targetUser = await db.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, clerkId: true, fullName: true, email: true, role: true },
  })

  if (!targetUser) {
    return { ok: false, error: 'User not found.' }
  }

  if (!targetUser.clerkId) {
    return { ok: false, error: 'User has no linked Clerk account.' }
  }

  try {
    const clerk = await clerkClient()
    await clerk.users.disableUserMFA(targetUser.clerkId)
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Clerk MFA reset failed: ${error}` }
  }

  const resetAt = format(new Date(), 'yyyy-MM-dd HH:mm:ss zzz')

  await db.auditLog.create({
    data: {
      action: 'RESET_MFA',
      entity: 'User',
      entityId: targetUser.id,
      actorId: actor.id,
      after: {
        targetUserId: targetUser.id,
        targetEmail: targetUser.email,
        actorId: actor.id,
        resetAt,
      },
    },
  })

  await sendEmail({
    to: targetUser.email,
    subject: 'Your two-factor authentication has been reset',
    template: 'mfa-reset',
    data: {
      recipientName: targetUser.fullName,
      resetByAdminName: actor.fullName,
      resetAt,
      enrollUrl: `${APP_URL}/account/mfa-enroll`,
    },
    idempotencyKey: `mfa-reset-${targetUser.id}-${Date.now()}`,
  })

  revalidatePath('/admin/data-directory')
  return { ok: true }
}

export const resetUserMfaAction = withAdminAction(_resetUserMfaAction, { roles: ['MASTER_ADMIN'] })
