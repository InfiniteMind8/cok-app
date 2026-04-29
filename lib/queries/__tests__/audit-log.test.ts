import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    auditLog: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { getAuditLogs, getEntityAuditLogs } from '../audit-log'

const mockFindMany = db.auditLog.findMany as ReturnType<typeof vi.fn>
const mockCount = db.auditLog.count as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockFindMany.mockResolvedValue([])
  mockCount.mockResolvedValue(0)
})

function captureWhere() {
  const call = mockFindMany.mock.calls[0]?.[0] as { where?: unknown } | undefined
  return call?.where
}

describe('getAuditLogs — filter building', () => {
  it('returns empty where clause when no filters provided', async () => {
    await getAuditLogs()
    expect(captureWhere()).toEqual({})
  })

  it('filters by actorId exactly', async () => {
    await getAuditLogs({ actorId: 'user-1' })
    expect(captureWhere()).toMatchObject({ actorId: 'user-1' })
  })

  it('filters action as case-insensitive contains', async () => {
    await getAuditLogs({ action: 'create' })
    expect(captureWhere()).toMatchObject({
      action: { contains: 'create', mode: 'insensitive' },
    })
  })

  it('filters by entity', async () => {
    await getAuditLogs({ entity: 'User' })
    expect(captureWhere()).toMatchObject({ entity: 'User' })
  })

  it('filters by dateFrom and dateTo', async () => {
    await getAuditLogs({ dateFrom: '2026-01-01', dateTo: '2026-12-31' })
    const where = captureWhere() as { createdAt?: { gte?: Date; lte?: Date } }
    expect(where?.createdAt?.gte).toEqual(new Date('2026-01-01'))
    expect(where?.createdAt?.lte).toEqual(new Date('2026-12-31T23:59:59.999Z'))
  })

  it('paginates correctly — page 2 skip = 50', async () => {
    await getAuditLogs({ page: 2, pageSize: 50 })
    const call = mockFindMany.mock.calls[0]?.[0] as { skip?: number; take?: number }
    expect(call?.skip).toBe(50)
    expect(call?.take).toBe(50)
  })
})

describe('getEntityAuditLogs', () => {
  it('queries by entity and entityId', async () => {
    await getEntityAuditLogs('User', 'user-abc')
    const call = mockFindMany.mock.calls[0]?.[0] as { where?: unknown }
    expect(call?.where).toEqual({ entity: 'User', entityId: 'user-abc' })
  })
})
