import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  createVoucher: vi.fn(),
  createAttachment: vi.fn(),
  createAuditLog: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireRole: mocks.requireRole }))

vi.mock('@/lib/db', () => ({
  db: {
    voucherRequest: { create: mocks.createVoucher },
    attachment: { create: mocks.createAttachment },
    auditLog: { create: mocks.createAuditLog },
    $transaction: mocks.transaction,
  },
}))

import { createVoucherAction } from '../vouchers'

const CREATED_VOUCHER = { id: 'vreq-new', status: 'PENDING' }
const MASTER_ADMIN = { id: 'admin-1', role: 'MASTER_ADMIN' }

describe('createVoucherAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRole.mockResolvedValue(MASTER_ADMIN)
    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        voucherRequest: { create: mocks.createVoucher },
        attachment: { create: mocks.createAttachment },
        auditLog: { create: mocks.createAuditLog },
      }
      return fn(tx)
    })
    mocks.createVoucher.mockResolvedValue(CREATED_VOUCHER)
    mocks.createAttachment.mockResolvedValue({})
    mocks.createAuditLog.mockResolvedValue({})
  })

  it('requires MASTER_ADMIN role', async () => {
    mocks.requireRole.mockRejectedValueOnce(new Error('Forbidden'))
    await expect(
      createVoucherAction({ recipientId: 'user-1', amountKcrd: '100' }),
    ).rejects.toThrow('Forbidden')
    expect(mocks.requireRole).toHaveBeenCalledWith(['MASTER_ADMIN'])
  })

  it('throws a Zod validation error when recipientId is empty', async () => {
    await expect(
      createVoucherAction({ recipientId: '', amountKcrd: '100' }),
    ).rejects.toThrow()
  })

  it('throws a Zod validation error when amountKcrd is empty', async () => {
    await expect(
      createVoucherAction({ recipientId: 'user-1', amountKcrd: '' }),
    ).rejects.toThrow()
  })

  it('throws when amount is zero or negative', async () => {
    await expect(
      createVoucherAction({ recipientId: 'user-1', amountKcrd: '0' }),
    ).rejects.toThrow('positive')
    await expect(
      createVoucherAction({ recipientId: 'user-1', amountKcrd: '-50' }),
    ).rejects.toThrow('positive')
  })

  it('creates a VoucherRequest with PENDING status inside a transaction', async () => {
    const result = await createVoucherAction({ recipientId: 'user-1', amountKcrd: '250.50' })
    expect(result).toEqual({ voucherRequestId: 'vreq-new' })
    expect(mocks.transaction).toHaveBeenCalled()
    expect(mocks.createVoucher).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recipientId: 'user-1',
          amountKcrd: '250.50',
          status: 'PENDING',
          requestedBy: 'admin-1',
        }),
      }),
    )
  })

  it('writes an audit log entry', async () => {
    await createVoucherAction({ recipientId: 'user-1', amountKcrd: '100' })
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'CREATE_VOUCHER_REQUEST',
          entity: 'VoucherRequest',
          actorId: 'admin-1',
        }),
      }),
    )
  })

  it('does not create an Attachment row when no file is provided', async () => {
    await createVoucherAction({ recipientId: 'user-1', amountKcrd: '100' })
    expect(mocks.createAttachment).not.toHaveBeenCalled()
  })

  it('creates an Attachment row when a file is provided', async () => {
    await createVoucherAction({
      recipientId: 'user-1',
      amountKcrd: '100',
      attachmentKey: 'https://cdn.uploadthing.com/attachment.pdf',
      attachmentName: 'receipt.pdf',
      attachmentSize: 4096,
      attachmentMime: 'application/pdf',
    })
    expect(mocks.createAttachment).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          storageKey: 'https://cdn.uploadthing.com/attachment.pdf',
          name: 'receipt.pdf',
          entityId: CREATED_VOUCHER.id,
        }),
      }),
    )
  })

  it('stores the optional message and expiresAt when provided', async () => {
    await createVoucherAction({
      recipientId: 'user-1',
      amountKcrd: '50',
      message: 'Welcome bonus',
      expiresAt: '2026-12-31',
    })
    expect(mocks.createVoucher).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          message: 'Welcome bonus',
          expiresAt: new Date('2026-12-31'),
        }),
      }),
    )
  })
})
