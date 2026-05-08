import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  findUnique: vi.fn(),
  requestUpdateMany: vi.fn(),
  ownershipUpdateMany: vi.fn(),
  update: vi.fn(),
  createAuditLog: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireRole: mocks.requireRole }))

vi.mock('@/lib/db', () => ({
  db: {
    propertyTransferRequest: {
      updateMany: mocks.requestUpdateMany,
      findUnique: mocks.findUnique,
      findUniqueOrThrow: mocks.findUniqueOrThrow,
      update: mocks.update,
    },
    propertyOwnership: {
      updateMany: mocks.ownershipUpdateMany,
    },
    auditLog: {
      create: mocks.createAuditLog,
    },
    user: {
      findUnique: mocks.findUnique,
    },
    $transaction: mocks.transaction,
  },
}))

vi.mock('@/lib/email/service', () => ({ sendEmail: vi.fn().mockResolvedValue({ ok: true, messageId: 'x' }) }))
vi.mock('@/lib/notifications/service', () => ({ notify: vi.fn().mockResolvedValue(undefined) }))

// ─── Tests ────────────────────────────────────────────────────────────────────

import { approveTransferAction, declineTransferAction } from '../property-transfers'

const PENDING_REQUEST = {
  id: 'req-1',
  propertyId: 'prop-1',
  fromUserId: 'user-from',
  toUserId: 'user-to',
  requestedBy: 'admin-1',
  status: 'PENDING',
  notes: null,
  declinedReason: null,
  property: { code: 'PROP-001', address: '1 Karis Way' },
}

const ADMIN_USER = { id: 'admin-1', role: 'MASTER_ADMIN', email: 'admin@karis.com', fullName: 'Admin' }

describe('approveTransferAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRole.mockResolvedValue(ADMIN_USER)
    mocks.findUniqueOrThrow.mockResolvedValue(PENDING_REQUEST)
    mocks.findUnique.mockResolvedValue({ email: 'user@karis.com', fullName: 'Test User' })
    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        propertyOwnership: { updateMany: mocks.ownershipUpdateMany },
        propertyTransferRequest: {
          updateMany: mocks.requestUpdateMany,
          findUnique: mocks.findUnique,
          findUniqueOrThrow: mocks.findUniqueOrThrow,
        },
        auditLog: { create: mocks.createAuditLog },
      }
      return fn(tx)
    })
    mocks.requestUpdateMany.mockResolvedValue({ count: 1 })
    mocks.ownershipUpdateMany.mockResolvedValue({ count: 1 })
    mocks.update.mockResolvedValue({ ...PENDING_REQUEST, status: 'APPROVED' })
    mocks.createAuditLog.mockResolvedValue({})
  })

  it('requires MASTER_ADMIN role', async () => {
    mocks.requireRole.mockRejectedValueOnce(new Error('Forbidden'))
    await expect(approveTransferAction('req-1')).rejects.toThrow('Forbidden')
    expect(mocks.requireRole).toHaveBeenCalledWith(['MASTER_ADMIN'])
  })

  it('throws if request is not PENDING', async () => {
    mocks.requestUpdateMany.mockResolvedValueOnce({ count: 0 })
    mocks.findUnique.mockResolvedValueOnce({ status: 'APPROVED' })
    await expect(approveTransferAction('req-1')).rejects.toThrow(
      'Request already processed (status: APPROVED)',
    )
  })

  it('runs ownership transfer and approval update in a transaction', async () => {
    await approveTransferAction('req-1')
    expect(mocks.transaction).toHaveBeenCalled()
    expect(mocks.requestUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'req-1', status: 'PENDING' },
        data: expect.objectContaining({ status: 'APPROVED' }),
      }),
    )
    expect(mocks.ownershipUpdateMany).toHaveBeenCalledWith({
      where: { propertyId: 'prop-1', userId: 'user-from' },
      data: { userId: 'user-to' },
    })
  })

  it('writes audit log entry inside the transaction', async () => {
    await approveTransferAction('req-1')
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'PROPERTY_TRANSFER_APPROVED',
          entity: 'PropertyTransferRequest',
          entityId: 'req-1',
        }),
      }),
    )
  })
})

describe('declineTransferAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRole.mockResolvedValue(ADMIN_USER)
    mocks.findUniqueOrThrow.mockResolvedValue(PENDING_REQUEST)
    mocks.findUnique.mockResolvedValue({ email: 'admin@karis.com', fullName: 'Admin', id: 'admin-1' })
    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        propertyTransferRequest: {
          updateMany: mocks.requestUpdateMany,
          findUnique: mocks.findUnique,
          findUniqueOrThrow: mocks.findUniqueOrThrow,
        },
        auditLog: { create: mocks.createAuditLog },
      }
      return fn(tx)
    })
    mocks.requestUpdateMany.mockResolvedValue({ count: 1 })
    mocks.createAuditLog.mockResolvedValue({})
  })

  it('requires MASTER_ADMIN or ADMIN role', async () => {
    mocks.requireRole.mockRejectedValueOnce(new Error('Forbidden'))
    await expect(declineTransferAction('req-1', 'reason')).rejects.toThrow('Forbidden')
    expect(mocks.requireRole).toHaveBeenCalledWith(['MASTER_ADMIN', 'ADMIN'])
  })

  it('throws when reason is empty', async () => {
    await expect(declineTransferAction('req-1', '')).rejects.toThrow('required')
    await expect(declineTransferAction('req-1', '   ')).rejects.toThrow('required')
  })

  it('throws if request is not PENDING', async () => {
    mocks.requestUpdateMany.mockResolvedValueOnce({ count: 0 })
    mocks.findUnique.mockResolvedValueOnce({ status: 'DECLINED' })
    await expect(declineTransferAction('req-1', 'already done')).rejects.toThrow(
      'Request already processed (status: DECLINED)',
    )
  })

  it('updates request to DECLINED with reason and writes audit log', async () => {
    await declineTransferAction('req-1', 'Not eligible')
    expect(mocks.requestUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'req-1', status: 'PENDING' },
        data: expect.objectContaining({ status: 'DECLINED', declinedReason: 'Not eligible' }),
      }),
    )
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'PROPERTY_TRANSFER_DECLINED',
          entity: 'PropertyTransferRequest',
        }),
      }),
    )
  })
})
