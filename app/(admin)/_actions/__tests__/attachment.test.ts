import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  createAuditLog: vi.fn(),
  deleteAttachment: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireRole: mocks.requireRole }))

vi.mock('@/lib/db', () => ({
  db: {
    attachment: {
      findUniqueOrThrow: mocks.findUniqueOrThrow,
      delete: mocks.deleteAttachment,
    },
    auditLog: { create: mocks.createAuditLog },
    $transaction: mocks.transaction,
  },
}))

import { getAttachmentUrlAction, deleteAttachmentAction } from '../attachment'

const ATTACHMENT = {
  id: 'att-1',
  storageKey: 'https://cdn.uploadthing.com/doc.pdf',
  uploadedBy: 'user-1',
  entityType: 'USER',
  entityId: 'user-1',
  name: 'id-scan.pdf',
}

describe('getAttachmentUrlAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.findUniqueOrThrow.mockResolvedValue(ATTACHMENT)
    mocks.createAuditLog.mockResolvedValue({})
  })

  it('rejects users without any recognised role', async () => {
    mocks.requireRole.mockRejectedValueOnce(new Error('Forbidden'))
    await expect(getAttachmentUrlAction('att-1')).rejects.toThrow('Forbidden')
  })

  it('returns the storageKey when the caller is the uploader', async () => {
    mocks.requireRole.mockResolvedValue({ id: 'user-1', role: 'RESIDENT' })
    const url = await getAttachmentUrlAction('att-1')
    expect(url).toBe(ATTACHMENT.storageKey)
    expect(mocks.createAuditLog).not.toHaveBeenCalled()
  })

  it('returns the storageKey when the caller is an admin accessing another user\'s doc', async () => {
    mocks.requireRole.mockResolvedValue({ id: 'admin-1', role: 'MASTER_ADMIN' })
    const url = await getAttachmentUrlAction('att-1')
    expect(url).toBe(ATTACHMENT.storageKey)
  })

  it('writes an audit log when admin accesses another user\'s document', async () => {
    mocks.requireRole.mockResolvedValue({ id: 'admin-1', role: 'MASTER_ADMIN' })
    await getAttachmentUrlAction('att-1')
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'RETRIEVE_ATTACHMENT',
          entity: 'Attachment',
          entityId: 'att-1',
          actorId: 'admin-1',
        }),
      }),
    )
  })

  it('throws Forbidden when caller is not uploader and not admin', async () => {
    mocks.requireRole.mockResolvedValue({ id: 'other-user', role: 'RESIDENT' })
    await expect(getAttachmentUrlAction('att-1')).rejects.toThrow('Forbidden')
    expect(mocks.createAuditLog).not.toHaveBeenCalled()
  })
})

describe('deleteAttachmentAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.findUniqueOrThrow.mockResolvedValue(ATTACHMENT)
    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        attachment: { delete: mocks.deleteAttachment },
        auditLog: { create: mocks.createAuditLog },
      }
      return fn(tx)
    })
    mocks.deleteAttachment.mockResolvedValue({})
    mocks.createAuditLog.mockResolvedValue({})
  })

  it('requires MASTER_ADMIN or ADMIN role', async () => {
    mocks.requireRole.mockRejectedValueOnce(new Error('Forbidden'))
    await expect(deleteAttachmentAction('att-1')).rejects.toThrow('Forbidden')
    expect(mocks.requireRole).toHaveBeenCalledWith(['MASTER_ADMIN', 'ADMIN'])
  })

  it('deletes the attachment and writes audit log in a transaction', async () => {
    mocks.requireRole.mockResolvedValue({ id: 'admin-1', role: 'MASTER_ADMIN' })
    await deleteAttachmentAction('att-1')
    expect(mocks.transaction).toHaveBeenCalled()
    expect(mocks.deleteAttachment).toHaveBeenCalledWith({ where: { id: 'att-1' } })
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'DELETE_ATTACHMENT',
          entity: 'Attachment',
          entityId: 'att-1',
        }),
      }),
    )
  })
})
