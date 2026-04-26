'use server'

import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateUniqueMemberId } from '@/lib/member-id'
import { clerkClient } from '@clerk/nextjs/server'
import { Role } from '@prisma/client'
import { revalidatePath } from 'next/cache'

interface CreateAccountInput {
  fullName: string
  email: string
  role: Role
  dob?: string
  govId?: string
  country?: string
  phone?: string
}

export async function createAccountAction(input: CreateAccountInput) {
  await requireRole(['MASTER_ADMIN'])

  const memberId = await generateUniqueMemberId()

  const user = await db.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        memberId,
        email: input.email,
        fullName: input.fullName,
        role: input.role,
        status: 'PENDING_KYC',
        kyc: {
          dob: input.dob ?? null,
          govId: input.govId ?? null,
          country: input.country ?? null,
          phone: input.phone ?? null,
        },
      },
    })
    await tx.wallet.create({ data: { userId: newUser.id } })
    return newUser
  })

  // Send Clerk invitation
  const clerk = await clerkClient()
  const invitation = await clerk.invitations.createInvitation({
    emailAddress: input.email,
    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/sign-up`,
    ignoreExisting: true,
  })

  revalidatePath('/accounts')
  return { memberId: user.memberId, invitationId: invitation.id }
}

export async function suspendAccountAction(userId: string, reason: string) {
  await requireRole(['MASTER_ADMIN'])
  if (!reason.trim()) throw new Error('Suspension reason is required')

  await db.user.update({
    where: { id: userId },
    data: { status: 'SUSPENDED' },
  })
  revalidatePath('/accounts')
}

export async function restoreAccountAction(userId: string) {
  await requireRole(['MASTER_ADMIN'])

  await db.user.update({
    where: { id: userId },
    data: { status: 'ACTIVE' },
  })
  revalidatePath('/accounts')
}

export async function upgradeRoleAction(userId: string, targetRole: Role) {
  await requireRole(['MASTER_ADMIN'])

  await db.user.update({
    where: { id: userId },
    data: { role: targetRole },
  })
  revalidatePath('/accounts')
}
