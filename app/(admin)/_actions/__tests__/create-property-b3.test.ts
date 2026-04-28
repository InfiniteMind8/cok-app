import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  createProperty: vi.fn(),
  createAttachment: vi.fn(),
  createAuditLog: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireRole: mocks.requireRole }))

vi.mock('@/lib/db', () => ({
  db: {
    property: { create: mocks.createProperty },
    attachment: { create: mocks.createAttachment },
    auditLog: { create: mocks.createAuditLog },
    $transaction: mocks.transaction,
  },
}))

vi.mock('@/lib/storage/attachments', () => ({
  createAttachment: vi.fn(),
}))

import { createPropertyAction } from '../properties'

const MASTER_ADMIN = { id: 'admin-1', role: 'MASTER_ADMIN' }
const CREATED_PROPERTY = { id: 'prop-1', code: 'KRS-001' }

describe('createPropertyAction — B.3 fields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRole.mockResolvedValue(MASTER_ADMIN)
    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        property: { create: mocks.createProperty },
        attachment: { create: mocks.createAttachment },
        auditLog: { create: mocks.createAuditLog },
      }
      return fn(tx)
    })
    mocks.createProperty.mockResolvedValue(CREATED_PROPERTY)
    mocks.createAttachment.mockResolvedValue({})
    mocks.createAuditLog.mockResolvedValue({})
  })

  it('requires MASTER_ADMIN role', async () => {
    mocks.requireRole.mockRejectedValueOnce(new Error('Forbidden'))
    await expect(
      createPropertyAction({ code: 'KRS-001', type: 'OWNERSHIP', category: 'RESIDENTIAL' }),
    ).rejects.toThrow('Forbidden')
    expect(mocks.requireRole).toHaveBeenCalledWith(['MASTER_ADMIN'])
  })

  it('creates a property with all B.3 spec fields persisted', async () => {
    await createPropertyAction({
      code: 'krs-001',
      type: 'OWNERSHIP',
      category: 'RESIDENTIAL',
      propertyStatus: 'VACANT',
      lotNumber: 'LOT-42',
      sizeSqm: '120.5',
      bedrooms: '3',
      bathrooms: '2',
      parkingSpots: '1',
      yearBuilt: '2024',
      notes: 'Luxury unit',
    })
    expect(mocks.createProperty).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          code: 'KRS-001',
          propertyStatus: 'VACANT',
          lotNumber: 'LOT-42',
          bedrooms: 3,
          bathrooms: 2,
          parkingSpots: 1,
          yearBuilt: 2024,
          notes: 'Luxury unit',
        }),
      }),
    )
  })

  it('uppercases the property code', async () => {
    await createPropertyAction({ code: 'krs-abc', type: 'RENTAL', category: 'COMMERCIAL' })
    const callData = mocks.createProperty.mock.calls[0][0].data
    expect(callData.code).toBe('KRS-ABC')
  })

  it('defaults propertyStatus to VACANT when not provided', async () => {
    await createPropertyAction({ code: 'KRS-002', type: 'OWNERSHIP', category: 'RESIDENTIAL' })
    const callData = mocks.createProperty.mock.calls[0][0].data
    expect(callData.propertyStatus).toBe('VACANT')
  })

  it('writes an audit log with CREATE_PROPERTY action', async () => {
    await createPropertyAction({ code: 'KRS-003', type: 'OWNERSHIP', category: 'MIXED' })
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'CREATE_PROPERTY',
          entity: 'Property',
          actorId: 'admin-1',
        }),
      }),
    )
  })

  it('does not create Attachment rows when no attachments provided', async () => {
    await createPropertyAction({ code: 'KRS-004', type: 'RENTAL', category: 'RESIDENTIAL' })
    expect(mocks.createAttachment).not.toHaveBeenCalled()
  })

  it('creates Attachment rows for each uploaded file', async () => {
    await createPropertyAction({
      code: 'KRS-005',
      type: 'OWNERSHIP',
      category: 'RESIDENTIAL',
      attachments: [
        { storageKey: 'https://cdn.ut.io/deed.pdf', mimeType: 'application/pdf', sizeBytes: 5000, name: 'deed.pdf', fieldName: 'titleDeed' },
        { storageKey: 'https://cdn.ut.io/permit.pdf', mimeType: 'application/pdf', sizeBytes: 3000, name: 'permit.pdf', fieldName: 'occupancyPermit' },
      ],
    })
    expect(mocks.createAttachment).toHaveBeenCalledTimes(2)
    expect(mocks.createAttachment).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ fieldName: 'titleDeed', entityId: CREATED_PROPERTY.id }) }),
    )
    expect(mocks.createAttachment).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ fieldName: 'occupancyPermit', entityId: CREATED_PROPERTY.id }) }),
    )
  })
})
