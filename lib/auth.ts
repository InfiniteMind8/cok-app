import 'server-only'
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { meApi, ApiClientError } from '@/lib/api'
import { getServerApi } from '@/lib/api/server'
import type { Role, MeResponse } from '@/lib/api/types'

export type { Role }

// D.4: server-side auth helpers now resolve the user through the backend
// `/v1/me` endpoint instead of touching Prisma. The backend's `requireAuth`
// middleware is the single source of truth for status / deactivation rejects
// (returns 403 with code 'FORBIDDEN'). Missing/expired Clerk session returns
// 401 with code 'UNAUTHORIZED'.
export async function getCurrentUser(): Promise<MeResponse | null> {
  const { userId } = await auth()
  if (!userId) return null
  try {
    return await meApi.get(getServerApi())
  } catch (err) {
    if (
      err instanceof ApiClientError &&
      (err.code === 'UNAUTHORIZED' || err.code === 'FORBIDDEN')
    ) {
      return null
    }
    throw err
  }
}

export async function requireRole(role: Role | Role[]): Promise<MeResponse> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  let user: MeResponse
  try {
    user = await meApi.get(getServerApi())
  } catch (err) {
    if (err instanceof ApiClientError) {
      if (err.code === 'UNAUTHORIZED') redirect('/sign-in')
      if (err.code === 'FORBIDDEN') redirect('/sign-in?reason=account-inactive')
    }
    throw err
  }

  const allowed = Array.isArray(role) ? role : [role]
  if (!allowed.includes(user.role)) redirect('/')
  return user
}

export async function getClerkUser() {
  return currentUser()
}

export { requireMfaEnrolled as requireStaffMfa } from '@/lib/mfa'

export async function denyIfVisitor() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')
  if (user.role === 'VISITOR') {
    throw new Error('Visitors do not have access to this feature.')
  }
}
