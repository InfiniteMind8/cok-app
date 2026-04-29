import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted ensures these are available inside vi.mock factories (which are hoisted)
const mockGetUser = vi.hoisted(() => vi.fn())
const mockRedirect = vi.hoisted(() => vi.fn())

vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: () => Promise.resolve({ users: { getUser: mockGetUser } }),
}))

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}))

import { isStaffRole, STAFF_ROLES, requireMfaEnrolled } from '../index'

describe('STAFF_ROLES', () => {
  it('includes MASTER_ADMIN and ADMIN', () => {
    expect(STAFF_ROLES).toContain('MASTER_ADMIN')
    expect(STAFF_ROLES).toContain('ADMIN')
  })

  it('does not include non-staff roles', () => {
    expect(STAFF_ROLES).not.toContain('RESIDENT')
    expect(STAFF_ROLES).not.toContain('VISITOR')
    expect(STAFF_ROLES).not.toContain('VENDOR')
  })
})

describe('isStaffRole', () => {
  it('returns true for MASTER_ADMIN', () => {
    expect(isStaffRole('MASTER_ADMIN')).toBe(true)
  })

  it('returns true for ADMIN', () => {
    expect(isStaffRole('ADMIN')).toBe(true)
  })

  it('returns false for RESIDENT', () => {
    expect(isStaffRole('RESIDENT')).toBe(false)
  })

  it('returns false for VISITOR', () => {
    expect(isStaffRole('VISITOR')).toBe(false)
  })

  it('returns false for VENDOR', () => {
    expect(isStaffRole('VENDOR')).toBe(false)
  })
})

describe('requireMfaEnrolled', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('skips Clerk check for RESIDENT (non-staff)', async () => {
    await requireMfaEnrolled({ clerkId: 'user_resident', role: 'RESIDENT' })
    expect(mockGetUser).not.toHaveBeenCalled()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('skips Clerk check for VISITOR (non-staff)', async () => {
    await requireMfaEnrolled({ clerkId: 'user_visitor', role: 'VISITOR' })
    expect(mockGetUser).not.toHaveBeenCalled()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('skips Clerk check for VENDOR (non-staff)', async () => {
    await requireMfaEnrolled({ clerkId: 'user_vendor', role: 'VENDOR' })
    expect(mockGetUser).not.toHaveBeenCalled()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('does not redirect MASTER_ADMIN with MFA enrolled', async () => {
    mockGetUser.mockResolvedValue({ twoFactorEnabled: true })
    await requireMfaEnrolled({ clerkId: 'user_admin', role: 'MASTER_ADMIN' })
    expect(mockGetUser).toHaveBeenCalledWith('user_admin')
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('does not redirect ADMIN with MFA enrolled', async () => {
    mockGetUser.mockResolvedValue({ twoFactorEnabled: true })
    await requireMfaEnrolled({ clerkId: 'user_admin2', role: 'ADMIN' })
    expect(mockGetUser).toHaveBeenCalledWith('user_admin2')
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('redirects MASTER_ADMIN without MFA enrolled', async () => {
    mockGetUser.mockResolvedValue({ twoFactorEnabled: false })
    await requireMfaEnrolled({ clerkId: 'user_no_mfa', role: 'MASTER_ADMIN' })
    expect(mockRedirect).toHaveBeenCalledWith('/account/mfa-enroll')
  })

  it('redirects ADMIN without MFA enrolled', async () => {
    mockGetUser.mockResolvedValue({ twoFactorEnabled: false })
    await requireMfaEnrolled({ clerkId: 'user_no_mfa2', role: 'ADMIN' })
    expect(mockRedirect).toHaveBeenCalledWith('/account/mfa-enroll')
  })
})
