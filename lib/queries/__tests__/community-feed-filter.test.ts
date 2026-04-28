import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock db using factory (avoids top-level vi.fn() hoisting issue) ────────

vi.mock('@/lib/db', () => ({
  db: {
    communityUpdate: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { getUpdatesWithAcknowledgements } from '../community'

const mockFindMany = db.communityUpdate.findMany as ReturnType<typeof vi.fn>
const mockCount = db.communityUpdate.count as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockFindMany.mockResolvedValue([])
  mockCount.mockResolvedValue(0)
})

function captureWhere() {
  const call = mockFindMany.mock.calls[0]?.[0] as { where?: unknown } | undefined
  return call?.where
}

describe('getUpdatesWithAcknowledgements — feed filtering', () => {
  it('MASTER_ADMIN receives all updates (empty where clause)', async () => {
    await getUpdatesWithAcknowledgements('admin-1', 'MASTER_ADMIN', [], 1, 20)
    expect(captureWhere()).toEqual({})
  })

  it('ADMIN also receives all updates', async () => {
    await getUpdatesWithAcknowledgements('admin-2', 'ADMIN', [], 1, 20)
    expect(captureWhere()).toEqual({})
  })

  it('RESIDENT receives COMMUNITY_WIDE and ROLE(RESIDENT) filters', async () => {
    await getUpdatesWithAcknowledgements('resident-1', 'RESIDENT', [], 1, 20)
    const where = captureWhere() as { OR: unknown[] }
    expect(where).toHaveProperty('OR')
    expect(where.OR).toContainEqual({ targetType: 'COMMUNITY_WIDE' })
    expect(where.OR).toContainEqual({ targetType: 'ROLE', targetRole: 'RESIDENT' })
  })

  it('VISITOR with groups receives COMMUNITY_WIDE, VISITOR_GROUP(in groups), SPECIFIC_USERS filters', async () => {
    await getUpdatesWithAcknowledgements('visitor-1', 'VISITOR', ['group-A', 'group-B'], 1, 20)
    const where = captureWhere() as { OR: unknown[] }
    expect(where.OR).toContainEqual({ targetType: 'COMMUNITY_WIDE' })
    expect(where.OR).toContainEqual({
      targetType: 'VISITOR_GROUP',
      targetGroupId: { in: ['group-A', 'group-B'] },
    })
    expect(where.OR).toContainEqual({
      targetType: 'SPECIFIC_USERS',
      targetUserIds: { has: 'visitor-1' },
    })
  })

  it('VISITOR without groups does not include VISITOR_GROUP filter', async () => {
    await getUpdatesWithAcknowledgements('visitor-2', 'VISITOR', [], 1, 20)
    const where = captureWhere() as { OR: unknown[] }
    const hasGroupFilter = where.OR.some(
      (c) => (c as { targetType?: string }).targetType === 'VISITOR_GROUP',
    )
    expect(hasGroupFilter).toBe(false)
  })

  it('VENDOR receives COMMUNITY_WIDE and ROLE(VENDOR) filters', async () => {
    await getUpdatesWithAcknowledgements('vendor-1', 'VENDOR', [], 1, 20)
    const where = captureWhere() as { OR: unknown[] }
    expect(where.OR).toContainEqual({ targetType: 'COMMUNITY_WIDE' })
    expect(where.OR).toContainEqual({ targetType: 'ROLE', targetRole: 'VENDOR' })
  })
})
