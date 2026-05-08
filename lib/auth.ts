import 'server-only'
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Role } from '@prisma/client'

export type { Role }

export async function getCurrentUser() {
  const { userId } = await auth()
  if (!userId) return null

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      clerkId: true,
      memberId: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      deactivatedAt: true,
      profilePhotoUrl: true,
      createdAt: true,
    },
  })

  return user
}

export async function requireRole(role: Role | Role[]) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  if (user.status !== 'ACTIVE' || user.deactivatedAt !== null) {
    redirect('/sign-in?reason=account-inactive')
  }

  const allowed = Array.isArray(role) ? role : [role]
  if (!allowed.includes(user.role)) {
    redirect('/')
  }

  return user
}

export async function getClerkUser() {
  return currentUser()
}

export { requireMfaEnrolled as requireStaffMfa } from '@/lib/mfa'

// C.2: enforce visitor permission boundary at Server Action layer
export async function denyIfVisitor() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')
  if (user.role === 'VISITOR') {
    throw new Error('Visitors do not have access to this feature.')
  }
}
