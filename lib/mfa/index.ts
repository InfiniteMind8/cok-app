import 'server-only'
import { clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Role } from '@prisma/client'

export const STAFF_ROLES: Role[] = ['MASTER_ADMIN', 'ADMIN']

export function isStaffRole(role: Role): boolean {
  return STAFF_ROLES.includes(role)
}

export async function requireMfaEnrolled(user: {
  clerkId: string
  role: Role
}): Promise<void> {
  if (!isStaffRole(user.role)) return

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(user.clerkId)

  if (!clerkUser.twoFactorEnabled) {
    redirect('/account/mfa-enroll')
  }
}
