import { redirect } from 'next/navigation'
import { clerkClient } from '@clerk/nextjs/server'
import { getCurrentUser } from '@/lib/auth'
import { isStaffRole } from '@/lib/mfa'
import { MfaEnrollClient } from './_components/mfa-enroll-client'

export const dynamic = 'force-dynamic'

export default async function MfaEnrollPage() {
  const dbUser = await getCurrentUser()
  if (!dbUser) redirect('/sign-in')

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(dbUser.clerkId)

  if (clerkUser.twoFactorEnabled) {
    redirect(isStaffRole(dbUser.role) ? '/dashboard' : '/profile')
  }

  return (
    <MfaEnrollClient
      isStaff={isStaffRole(dbUser.role)}
      userName={dbUser.fullName}
    />
  )
}
