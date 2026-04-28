import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  createUser: vi.fn(),
  createWallet: vi.fn(),
  createVisitorProfile: vi.fn(),
  createVendorProfile: vi.fn(),
  createAttachment: vi.fn(),
  createAuditLog: vi.fn(),
  transaction: vi.fn(),
  generateUniqueMemberId: vi.fn(),
  invitations: { createInvitation: vi.fn() },
  clerkInstance: null as unknown,
  sendEmail: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireRole: mocks.requireRole }))

vi.mock('@/lib/db', () => ({
  db: {
    user: { create: mocks.createUser },
    wallet: { create: mocks.createWallet },
    visitorProfile: { create: mocks.createVisitorProfile },
    vendorProfile: { create: mocks.createVendorProfile },
    attachment: { create: mocks.createAttachment },
    auditLog: { create: mocks.createAuditLog },
    $transaction: mocks.transaction,
  },
}))

vi.mock('@/lib/member-id', () => ({
  generateUniqueMemberId: () => mocks.generateUniqueMemberId(),
}))

vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: () => Promise.resolve({ invitations: mocks.invitations }),
}))

vi.mock('@/lib/email/service', () => ({
  sendEmail: (...args: unknown[]) => mocks.sendEmail(...args),
}))

import { createAccountAction } from '../accounts'

const ADMIN = { id: 'admin-1', role: 'MASTER_ADMIN' }
const CREATED_USER = { id: 'user-new', memberId: 'KRS-00123', email: 'test@karis.com', fullName: 'Test User', role: 'RESIDENT' }

describe('createAccountAction — B.3 fields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRole.mockResolvedValue(ADMIN)
    mocks.generateUniqueMemberId.mockResolvedValue('KRS-00123')
    mocks.invitations.createInvitation.mockResolvedValue({})
    mocks.sendEmail.mockReturnValue(Promise.resolve({ ok: true }))
    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        user: { create: mocks.createUser },
        wallet: { create: mocks.createWallet },
        visitorProfile: { create: mocks.createVisitorProfile },
        vendorProfile: { create: mocks.createVendorProfile },
        attachment: { create: mocks.createAttachment },
        auditLog: { create: mocks.createAuditLog },
      }
      return fn(tx)
    })
    mocks.createUser.mockResolvedValue(CREATED_USER)
    mocks.createWallet.mockResolvedValue({})
    mocks.createVisitorProfile.mockResolvedValue({})
    mocks.createVendorProfile.mockResolvedValue({})
    mocks.createAttachment.mockResolvedValue({})
    mocks.createAuditLog.mockResolvedValue({})
  })

  it('requires MASTER_ADMIN or ADMIN role', async () => {
    mocks.requireRole.mockRejectedValueOnce(new Error('Forbidden'))
    await expect(
      createAccountAction({ fullName: 'Test', email: 'test@karis.com', role: 'RESIDENT' }),
    ).rejects.toThrow('Forbidden')
    expect(mocks.requireRole).toHaveBeenCalledWith(['MASTER_ADMIN', 'ADMIN'])
  })

  it('persists B.3 resident fields (nationalId, emergency contact, household, vehiclePlates)', async () => {
    await createAccountAction({
      fullName: 'Jane Doe',
      email: 'jane@karis.com',
      role: 'RESIDENT',
      residentFields: {
        nationalIdType: 'PASSPORT',
        nationalIdNumber: 'A12345678',
        emergencyContactName: 'John Doe',
        emergencyContactPhone: '+971501234567',
        householdSize: 3,
        vehiclePlates: ['ABC-123', 'XYZ-789'],
        notes: 'Long-term resident',
      },
    })
    expect(mocks.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nationalIdType: 'PASSPORT',
          nationalIdNumber: 'A12345678',
          emergencyContactName: 'John Doe',
          emergencyContactPhone: '+971501234567',
          householdSize: 3,
          vehiclePlates: ['ABC-123', 'XYZ-789'],
        }),
      }),
    )
  })

  it('creates a VisitorProfile when role is VISITOR', async () => {
    await createAccountAction({
      fullName: 'Visit User',
      email: 'visitor@karis.com',
      role: 'VISITOR',
      visitorFields: {
        visitPurpose: 'Business',
        expectedArrival: '2026-05-01',
        expectedDeparture: '2026-05-10',
        hostId: 'host-user-1',
      },
    })
    expect(mocks.createVisitorProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          visitPurpose: 'Business',
          hostId: 'host-user-1',
        }),
      }),
    )
    expect(mocks.createVendorProfile).not.toHaveBeenCalled()
  })

  it('creates a VendorProfile when role is VENDOR', async () => {
    await createAccountAction({
      fullName: 'Vendor Co',
      email: 'vendor@karis.com',
      role: 'VENDOR',
      vendorFields: {
        businessName: 'Karis Supplies Ltd',
        businessCategory: 'Construction',
        payoutMethod: 'BankTransfer',
        kcrdWalletPreference: true,
      },
    })
    expect(mocks.createVendorProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          businessName: 'Karis Supplies Ltd',
          businessCategory: 'Construction',
          kcrdWalletPreference: true,
        }),
      }),
    )
    expect(mocks.createVisitorProfile).not.toHaveBeenCalled()
  })

  it('creates Attachment rows for uploaded ID/profile documents', async () => {
    await createAccountAction({
      fullName: 'Doc User',
      email: 'doc@karis.com',
      role: 'RESIDENT',
      attachments: [
        { storageKey: 'https://cdn.ut.io/id.pdf', mimeType: 'application/pdf', sizeBytes: 1024, name: 'id.pdf', fieldName: 'idScan' },
        { storageKey: 'https://cdn.ut.io/photo.jpg', mimeType: 'image/jpeg', sizeBytes: 512, name: 'photo.jpg', fieldName: 'profilePhoto' },
      ],
    })
    expect(mocks.createAttachment).toHaveBeenCalledTimes(2)
    expect(mocks.createAttachment).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ fieldName: 'idScan', entityId: CREATED_USER.id }) }),
    )
  })

  it('writes a CREATE_ACCOUNT audit log entry', async () => {
    await createAccountAction({ fullName: 'Audit User', email: 'audit@karis.com', role: 'RESIDENT' })
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'CREATE_ACCOUNT',
          entity: 'User',
          actorId: 'admin-1',
        }),
      }),
    )
  })

  it('returns the memberId on success', async () => {
    const result = await createAccountAction({ fullName: 'Return User', email: 'ret@karis.com', role: 'RESIDENT' })
    expect(result).toEqual({ memberId: 'KRS-00123' })
  })
})
