import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

const mocks = vi.hoisted(() => ({
  createAttachment: vi.fn(),
  findMany: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    attachment: {
      create: mocks.createAttachment,
      findMany: mocks.findMany,
    },
  },
}))

import { createAttachment, getAttachmentsByEntity, getAttachmentsByEntityAndField } from '../attachments'
import { AttachmentEntityType } from '@prisma/client'

const ATTACHMENT_INPUT = {
  storageKey: 'https://cdn.uploadthing.com/file-abc.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 12345,
  name: 'title-deed.pdf',
  entityType: AttachmentEntityType.PROPERTY,
  entityId: 'prop-1',
  fieldName: 'titleDeed',
  uploadedBy: 'user-1',
}

describe('createAttachment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a row with the correct entityType and entityId', async () => {
    mocks.createAttachment.mockResolvedValue({ id: 'att-1', ...ATTACHMENT_INPUT, sizeBytes: BigInt(12345) })
    await createAttachment(ATTACHMENT_INPUT)
    expect(mocks.createAttachment).toHaveBeenCalledWith({
      data: expect.objectContaining({
        entityType: AttachmentEntityType.PROPERTY,
        entityId: 'prop-1',
        fieldName: 'titleDeed',
      }),
    })
  })

  it('stores sizeBytes as BigInt', async () => {
    mocks.createAttachment.mockResolvedValue({ id: 'att-1' })
    await createAttachment(ATTACHMENT_INPUT)
    const callData = mocks.createAttachment.mock.calls[0][0].data
    expect(typeof callData.sizeBytes).toBe('bigint')
    expect(callData.sizeBytes).toBe(BigInt(12345))
  })

  it('stores the storageKey and mimeType correctly', async () => {
    mocks.createAttachment.mockResolvedValue({ id: 'att-1' })
    await createAttachment(ATTACHMENT_INPUT)
    const callData = mocks.createAttachment.mock.calls[0][0].data
    expect(callData.storageKey).toBe(ATTACHMENT_INPUT.storageKey)
    expect(callData.mimeType).toBe(ATTACHMENT_INPUT.mimeType)
  })
})

describe('getAttachmentsByEntity', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries by entityType and entityId ordered by createdAt asc', async () => {
    mocks.findMany.mockResolvedValue([])
    await getAttachmentsByEntity(AttachmentEntityType.ISSUE, 'issue-1')
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { entityType: AttachmentEntityType.ISSUE, entityId: 'issue-1' },
      orderBy: { createdAt: 'asc' },
    })
  })
})

describe('getAttachmentsByEntityAndField', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries by entityType, entityId, and fieldName', async () => {
    mocks.findMany.mockResolvedValue([])
    await getAttachmentsByEntityAndField(AttachmentEntityType.USER, 'user-1', 'idScan')
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { entityType: AttachmentEntityType.USER, entityId: 'user-1', fieldName: 'idScan' },
      orderBy: { createdAt: 'asc' },
    })
  })
})
