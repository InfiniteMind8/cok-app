import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  update: vi.fn(),
  createAuditLog: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireRole: mocks.requireRole }))

vi.mock('@/lib/db', () => ({
  db: {
    voucherRequest: {
      updateMany: mocks.updateMany,
      findUnique: mocks.findUnique,
      findUniqueOrThrow: mocks.findUniqueOrThrow,
      update: mocks.update,
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

import { approveVoucherRequestAction, declineVoucherRequestAction } from '../voucher-requests'

const PENDING_REQUEST = {
  id: 'vreq-1',
  recipientId: 'user-1',
  requestedBy: 'admin-1',
  amountKcrd: new Prisma.Decimal('100'),
  description: 'Welcome bonus',
  message: null,
  expiresAt: null,
  status: 'PENDING',
  declinedReason: null,
  voucherCode: null,
}

const ADMIN_USER = { id: 'admin-1', role: 'MASTER_ADMIN', email: 'admin@karis.com', fullName: 'Admin' }

describe('approveVoucherRequestAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRole.mockResolvedValue(ADMIN_USER)
    mocks.findUniqueOrThrow.mockResolvedValue(PENDING_REQUEST)
    mocks.findUnique.mockResolvedValue({ email: 'user@karis.com', fullName: 'Test User' })
    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        voucherRequest: {
          updateMany: mocks.updateMany,
          findUnique: mocks.findUnique,
          findUniqueOrThrow: mocks.findUniqueOrThrow,
        },
        auditLog: { create: mocks.createAuditLog },
      }
      return fn(tx)
    })
    mocks.updateMany.mockResolvedValue({ count: 1 })
    mocks.update.mockResolvedValue({ ...PENDING_REQUEST, status: 'APPROVED' })
    mocks.createAuditLog.mockResolvedValue({})
  })

  it('requires MASTER_ADMIN role', async () => {
    mocks.requireRole.mockRejectedValueOnce(new Error('Forbidden'))
    await expect(approveVoucherRequestAction('vreq-1')).rejects.toThrow('Forbidden')
    expect(mocks.requireRole).toHaveBeenCalledWith(['MASTER_ADMIN'])
  })

  it('throws if request is not PENDING', async () => {
    mocks.updateMany.mockResolvedValueOnce({ count: 0 })
    mocks.findUnique.mockResolvedValueOnce({ status: 'APPROVED' })
    await expect(approveVoucherRequestAction('vreq-1')).rejects.toThrow(
      'Request already processed (status: APPROVED)',
    )
  })

  it('sets a voucherCode matching KCRD-XXXXXXXX format', async () => {
    await approveVoucherRequestAction('vreq-1')
    const updateCall = mocks.updateMany.mock.calls[0][0]
    expect(updateCall.data.voucherCode).toMatch(/^KCRD-[0-9A-F]{8}$/)
  })

  it('runs update and audit log in a transaction', async () => {
    await approveVoucherRequestAction('vreq-1')
    expect(mocks.transaction).toHaveBeenCalled()
    expect(mocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'vreq-1', status: 'PENDING' },
        data: expect.objectContaining({ status: 'APPROVED' }),
      }),
    )
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'VOUCHER_REQUEST_APPROVED',
          entity: 'VoucherRequest',
          entityId: 'vreq-1',
        }),
      }),
    )
  })
})

describe('declineVoucherRequestAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRole.mockResolvedValue(ADMIN_USER)
    mocks.findUniqueOrThrow.mockResolvedValue(PENDING_REQUEST)
    mocks.findUnique.mockResolvedValue(null)
    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        voucherRequest: {
          updateMany: mocks.updateMany,
          findUnique: mocks.findUnique,
          findUniqueOrThrow: mocks.findUniqueOrThrow,
        },
        auditLog: { create: mocks.createAuditLog },
      }
      return fn(tx)
    })
    mocks.updateMany.mockResolvedValue({ count: 1 })
    mocks.createAuditLog.mockResolvedValue({})
  })

  it('requires MASTER_ADMIN or ADMIN role', async () => {
    mocks.requireRole.mockRejectedValueOnce(new Error('Forbidden'))
    await expect(declineVoucherRequestAction('vreq-1', 'reason')).rejects.toThrow('Forbidden')
    expect(mocks.requireRole).toHaveBeenCalledWith(['MASTER_ADMIN', 'ADMIN'])
  })

  it('throws when reason is empty', async () => {
    await expect(declineVoucherRequestAction('vreq-1', '')).rejects.toThrow('required')
    await expect(declineVoucherRequestAction('vreq-1', '   ')).rejects.toThrow('required')
  })

  it('throws if request is not PENDING', async () => {
    mocks.updateMany.mockResolvedValueOnce({ count: 0 })
    mocks.findUnique.mockResolvedValueOnce({ status: 'DECLINED' })
    await expect(declineVoucherRequestAction('vreq-1', 'reason')).rejects.toThrow(
      'Request already processed (status: DECLINED)',
    )
  })

  it('updates request to DECLINED with reason and writes audit log', async () => {
    await declineVoucherRequestAction('vreq-1', 'Not approved')
    expect(mocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'vreq-1', status: 'PENDING' },
        data: expect.objectContaining({ status: 'DECLINED', declinedReason: 'Not approved' }),
      }),
    )
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'VOUCHER_REQUEST_DECLINED',
          entity: 'VoucherRequest',
        }),
      }),
    )
  })
})
