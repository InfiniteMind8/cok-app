import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  getCurrentUser: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  findUnique: vi.fn(),
  createRequest: vi.fn(),
  updateRequest: vi.fn(),
  updateTenancy: vi.fn(),
  createAuditLog: vi.fn(),
  transaction: vi.fn(),
  notifyAllOfRole: vi.fn(),
  sendEmail: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  requireRole: mocks.requireRole,
  getCurrentUser: mocks.getCurrentUser,
}))

vi.mock('@/lib/db', () => ({
  db: {
    propertyTenancy: {
      findUniqueOrThrow: mocks.findUniqueOrThrow,
      update: mocks.updateTenancy,
    },
    rentalExtensionRequest: {
      findUniqueOrThrow: mocks.findUniqueOrThrow,
      create: mocks.createRequest,
      update: mocks.updateRequest,
    },
    auditLog: {
      create: mocks.createAuditLog,
    },
    $transaction: mocks.transaction,
  },
}))

vi.mock('@/lib/notifications/service', () => ({ notifyAllOfRole: mocks.notifyAllOfRole }))
vi.mock('@/lib/email/service', () => ({ sendEmail: mocks.sendEmail }))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

import {
  requestExtensionAction,
  approveExtensionAction,
  declineExtensionAction,
} from '../rental-extensions'

const RESIDENT = { id: 'user-1', role: 'RESIDENT', fullName: 'Jane Doe', email: 'jane@test.com' }
const ADMIN    = { id: 'admin-1', role: 'MASTER_ADMIN', fullName: 'Admin', email: 'admin@test.com' }

const TENANCY = {
  id: 'tenancy-1',
  propertyId: 'prop-1',
  userId: 'user-1',
  cycle: 'monthly',
  cycleUnit: 'MONTHLY',
  cyclePayment: '500.00',
  contractDate: new Date('2025-01-01'),
  contractUrl: null,
  startDate: new Date('2025-01-01'),
  endDate: new Date('2026-06-30'),
  depositAmount: null,
  leaseStatus: 'ACTIVE',
  nextPaymentDue: null,
  property: { code: 'PROP-001' },
}

const PENDING_REQUEST = {
  id: 'req-1',
  tenancyId: 'tenancy-1',
  requestedById: 'user-1',
  requestedNewEndDate: new Date('2027-01-01'),
  reason: 'Need more time',
  status: 'PENDING',
  reviewedById: null,
  reviewedAt: null,
  decisionNote: null,
  tenancy: { ...TENANCY, property: { code: 'PROP-001' } },
  requestedBy: { id: 'user-1', email: 'jane@test.com', fullName: 'Jane Doe' },
}

// ─── requestExtensionAction ───────────────────────────────────────────────────

describe('requestExtensionAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRole.mockResolvedValue(RESIDENT)
    mocks.notifyAllOfRole.mockResolvedValue(undefined)
    mocks.sendEmail.mockResolvedValue({ ok: true, messageId: 'x' })
    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const mockTx = {
        rentalExtensionRequest: { create: mocks.createRequest },
        auditLog: { create: mocks.createAuditLog },
      }
      return fn(mockTx)
    })
    mocks.createRequest.mockResolvedValue({ id: 'req-1' })
    mocks.createAuditLog.mockResolvedValue({})
  })

  it('creates PENDING request for RESIDENT', async () => {
    mocks.findUniqueOrThrow.mockResolvedValue(TENANCY)
    const result = await requestExtensionAction({
      tenancyId: 'tenancy-1',
      requestedNewEndDate: '2027-01-01',
      reason: 'Need more time',
    })
    expect(result).toEqual({ ok: true, requestId: 'req-1' })
    expect(mocks.createRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PENDING', tenancyId: 'tenancy-1' }),
      }),
    )
  })

  it('writes audit log on creation', async () => {
    mocks.findUniqueOrThrow.mockResolvedValue(TENANCY)
    await requestExtensionAction({
      tenancyId: 'tenancy-1',
      requestedNewEndDate: '2027-01-01',
    })
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'EXTENSION_REQUEST' }),
      }),
    )
  })

  it('rejects if user does not own tenancy', async () => {
    mocks.findUniqueOrThrow.mockResolvedValue({ ...TENANCY, userId: 'other-user' })
    await expect(
      requestExtensionAction({ tenancyId: 'tenancy-1', requestedNewEndDate: '2027-01-01' }),
    ).rejects.toThrow('Forbidden')
  })

  it('rejects if new end date is not after current end date', async () => {
    mocks.findUniqueOrThrow.mockResolvedValue(TENANCY)
    await expect(
      requestExtensionAction({ tenancyId: 'tenancy-1', requestedNewEndDate: '2026-05-01' }),
    ).rejects.toThrow('must be after')
  })

  it('notifies Master Admins after creation', async () => {
    mocks.findUniqueOrThrow.mockResolvedValue(TENANCY)
    await requestExtensionAction({ tenancyId: 'tenancy-1', requestedNewEndDate: '2027-01-01' })
    expect(mocks.notifyAllOfRole).toHaveBeenCalledWith(
      ['MASTER_ADMIN'],
      expect.objectContaining({ type: 'RENTAL_EXTENSION_REQUEST' }),
    )
  })
})

// ─── approveExtensionAction ───────────────────────────────────────────────────

describe('approveExtensionAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRole.mockResolvedValue(ADMIN)
    mocks.sendEmail.mockResolvedValue({ ok: true, messageId: 'x' })
    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const mockTx = {
        rentalExtensionRequest: { update: mocks.updateRequest },
        propertyTenancy: { update: mocks.updateTenancy },
        auditLog: { create: mocks.createAuditLog },
      }
      return fn(mockTx)
    })
    mocks.updateRequest.mockResolvedValue({})
    mocks.updateTenancy.mockResolvedValue({})
    mocks.createAuditLog.mockResolvedValue({})
  })

  it('requires MASTER_ADMIN role', async () => {
    mocks.requireRole.mockRejectedValue(new Error('Forbidden'))
    await expect(approveExtensionAction({ requestId: 'req-1' })).rejects.toThrow('Forbidden')
  })

  it('approves request and updates tenancy in a transaction', async () => {
    mocks.findUniqueOrThrow.mockResolvedValue(PENDING_REQUEST)
    await approveExtensionAction({ requestId: 'req-1', note: 'Approved.' })
    expect(mocks.updateRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'APPROVED', reviewedById: ADMIN.id }),
      }),
    )
    expect(mocks.updateTenancy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ endDate: PENDING_REQUEST.requestedNewEndDate }),
      }),
    )
  })

  it('writes EXTENSION_APPROVED audit log', async () => {
    mocks.findUniqueOrThrow.mockResolvedValue(PENDING_REQUEST)
    await approveExtensionAction({ requestId: 'req-1' })
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'EXTENSION_APPROVED' }),
      }),
    )
  })

  it('sends rental-extension-decision email to resident', async () => {
    mocks.findUniqueOrThrow.mockResolvedValue(PENDING_REQUEST)
    await approveExtensionAction({ requestId: 'req-1' })
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'rental-extension-decision',
        to: 'jane@test.com',
        data: expect.objectContaining({ decision: 'approved' }),
      }),
    )
  })

  it('throws if request is not PENDING', async () => {
    mocks.findUniqueOrThrow.mockResolvedValue({ ...PENDING_REQUEST, status: 'APPROVED' })
    await expect(approveExtensionAction({ requestId: 'req-1' })).rejects.toThrow('not pending')
  })
})

// ─── declineExtensionAction ───────────────────────────────────────────────────

describe('declineExtensionAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRole.mockResolvedValue(ADMIN)
    mocks.sendEmail.mockResolvedValue({ ok: true, messageId: 'x' })
    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const mockTx = {
        rentalExtensionRequest: { update: mocks.updateRequest },
        auditLog: { create: mocks.createAuditLog },
      }
      return fn(mockTx)
    })
    mocks.updateRequest.mockResolvedValue({})
    mocks.createAuditLog.mockResolvedValue({})
  })

  it('requires MASTER_ADMIN role', async () => {
    mocks.requireRole.mockRejectedValue(new Error('Forbidden'))
    await expect(
      declineExtensionAction({ requestId: 'req-1', note: 'Not approved.' }),
    ).rejects.toThrow('Forbidden')
  })

  it('declines request with required note', async () => {
    mocks.findUniqueOrThrow.mockResolvedValue(PENDING_REQUEST)
    await declineExtensionAction({ requestId: 'req-1', note: 'End date too far.' })
    expect(mocks.updateRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'DECLINED', decisionNote: 'End date too far.' }),
      }),
    )
  })

  it('throws Zod error when note is empty', async () => {
    await expect(
      declineExtensionAction({ requestId: 'req-1', note: '' }),
    ).rejects.toThrow()
  })

  it('writes EXTENSION_DECLINED audit log', async () => {
    mocks.findUniqueOrThrow.mockResolvedValue(PENDING_REQUEST)
    await declineExtensionAction({ requestId: 'req-1', note: 'Denied.' })
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'EXTENSION_DECLINED' }),
      }),
    )
  })

  it('sends rental-extension-decision email to resident with declined variant', async () => {
    mocks.findUniqueOrThrow.mockResolvedValue(PENDING_REQUEST)
    await declineExtensionAction({ requestId: 'req-1', note: 'Denied.' })
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'rental-extension-decision',
        to: 'jane@test.com',
        data: expect.objectContaining({ decision: 'declined', decisionNote: 'Denied.' }),
      }),
    )
  })

  it('throws if request is not PENDING', async () => {
    mocks.findUniqueOrThrow.mockResolvedValue({ ...PENDING_REQUEST, status: 'DECLINED' })
    await expect(
      declineExtensionAction({ requestId: 'req-1', note: 'Already done.' }),
    ).rejects.toThrow('not pending')
  })
})
