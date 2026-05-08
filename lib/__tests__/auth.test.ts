import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
  userFindUnique: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`)
  }),
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: mocks.auth,
  currentUser: mocks.currentUser,
}))

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}))

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}))

vi.mock('@/lib/mfa', () => ({
  requireMfaEnrolled: vi.fn(),
}))

import { requireRole } from '../auth'

const baseUser = {
  id: 'user_1',
  clerkId: 'clerk_1',
  memberId: 'KM-0001',
  email: 'admin@cityofkaris.test',
  fullName: 'Admin User',
  role: 'MASTER_ADMIN',
  status: 'ACTIVE',
  deactivatedAt: null,
  profilePhotoUrl: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue({ userId: 'clerk_1' })
})

describe('requireRole', () => {
  it('denies suspended user', async () => {
    mocks.userFindUnique.mockResolvedValue({
      ...baseUser,
      status: 'SUSPENDED',
    })

    await expect(requireRole('MASTER_ADMIN')).rejects.toThrow(
      'NEXT_REDIRECT:/sign-in?reason=account-inactive',
    )
    expect(mocks.redirect).toHaveBeenCalledWith('/sign-in?reason=account-inactive')
  })

  it('denies deactivated user', async () => {
    mocks.userFindUnique.mockResolvedValue({
      ...baseUser,
      deactivatedAt: new Date('2026-05-01T00:00:00.000Z'),
    })

    await expect(requireRole('MASTER_ADMIN')).rejects.toThrow(
      'NEXT_REDIRECT:/sign-in?reason=account-inactive',
    )
    expect(mocks.redirect).toHaveBeenCalledWith('/sign-in?reason=account-inactive')
  })

  it('allows active user', async () => {
    mocks.userFindUnique.mockResolvedValue(baseUser)

    const user = await requireRole('MASTER_ADMIN')

    expect(user).toBe(baseUser)
    expect(mocks.redirect).not.toHaveBeenCalled()
  })
})
