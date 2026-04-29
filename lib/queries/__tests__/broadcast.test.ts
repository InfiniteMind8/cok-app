import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    communityUpdate: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import {
  getActiveEmergencyBroadcasts,
  getEmergencyBroadcastById,
} from '../broadcast'

const mockFindMany = db.communityUpdate.findMany as ReturnType<typeof vi.fn>
const mockFindUnique = db.communityUpdate.findUnique as ReturnType<typeof vi.fn>

const baseBroadcast = {
  id: 'bc-1',
  category: 'emergency',
  headline: 'Test broadcast',
  message: 'This is a test message.',
  isEmergency: true,
  severity: 'URGENT',
  targetType: 'COMMUNITY_WIDE',
  publishedAt: new Date('2026-04-29T12:00:00Z'),
  publishedBy: 'user-admin',
  photoUrl: null,
  targetRole: null,
  targetGroupId: null,
  targetUserIds: [],
}

beforeEach(() => {
  vi.clearAllMocks()
  mockFindMany.mockResolvedValue([])
  mockFindUnique.mockResolvedValue(null)
})

describe('getActiveEmergencyBroadcasts', () => {
  it('returns empty array when no emergency broadcasts exist', async () => {
    mockFindMany.mockResolvedValue([])
    const result = await getActiveEmergencyBroadcasts('user-1')
    expect(result).toEqual([])
  })

  it('returns broadcast when one exists and is unacknowledged by user', async () => {
    mockFindMany.mockResolvedValue([baseBroadcast])
    const result = await getActiveEmergencyBroadcasts('user-1')
    expect(result).toHaveLength(1)
    expect(result[0].headline).toBe('Test broadcast')
  })

  it('passes correct where clause with userId for acknowledgements exclusion', async () => {
    await getActiveEmergencyBroadcasts('user-42')
    const call = mockFindMany.mock.calls[0]?.[0] as { where?: unknown }
    expect(call.where).toMatchObject({
      isEmergency: true,
      acknowledgements: { none: { userId: 'user-42' } },
    })
  })

  it('queries only isEmergency=true records', async () => {
    await getActiveEmergencyBroadcasts('user-1')
    const call = mockFindMany.mock.calls[0]?.[0] as { where?: { isEmergency?: boolean } }
    expect(call.where?.isEmergency).toBe(true)
  })
})

describe('getEmergencyBroadcastById', () => {
  it('returns broadcast when id exists', async () => {
    mockFindUnique.mockResolvedValue(baseBroadcast)
    const result = await getEmergencyBroadcastById('bc-1')
    expect(result?.id).toBe('bc-1')
    expect(result?.headline).toBe('Test broadcast')
  })

  it('returns null when broadcast id does not exist', async () => {
    mockFindUnique.mockResolvedValue(null)
    const result = await getEmergencyBroadcastById('unknown-id')
    expect(result).toBeNull()
  })
})
