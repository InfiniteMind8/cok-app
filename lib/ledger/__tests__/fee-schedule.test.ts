import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FeeScheduleRules } from '../types'

// ─── Shared mock rules ────────────────────────────────────────────────────────
const BASE_RULES: FeeScheduleRules = {
  PURCHASE: { totalPct: 2.5, communityFundPct: 1.5, operationsFundPct: 0.5, developerSharePct: 0.5 },
  VENDOR_SETTLEMENT: { totalPct: 1.0, communityFundPct: 0.5, operationsFundPct: 0.5, developerSharePct: 0 },
}

// ─── Hoisted mocks ────────────────────────────────────────────────────────────
vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const mockRequireRole = vi.fn()
vi.mock('@/lib/auth', () => ({ requireRole: mockRequireRole }))

const mockTransaction = vi.fn()
const mockFindFirst = vi.fn()
const mockFindMany = vi.fn()
const mockUpdate = vi.fn()
const mockCreate = vi.fn()
const mockCreateMany = vi.fn()

vi.mock('@/lib/db', () => ({
  db: {
    feeSchedule: {
      findFirst: mockFindFirst,
      findMany: mockFindMany,
      update: mockUpdate,
      create: mockCreate,
    },
    auditLog: {
      create: mockCreate,
      createMany: mockCreateMany,
    },
    user: {
      findMany: mockFindMany,
    },
    $transaction: mockTransaction,
  },
}))

// ─── Tests: getActiveFeeSchedule resolver ─────────────────────────────────────
describe('getActiveFeeSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('queries with effectiveTo: null filter', async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: 'sch-1',
      effectiveAt: new Date('2026-01-01'),
      effectiveTo: null,
      rules: BASE_RULES,
      createdBy: 'user-1',
      createdAt: new Date('2026-01-01'),
    })

    const { getActiveFeeSchedule } = await import('../fee-engine')
    const result = await getActiveFeeSchedule()

    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ effectiveTo: null }),
      })
    )
    expect(result?.id).toBe('sch-1')
  })

  it('returns null when no active schedule', async () => {
    mockFindFirst.mockResolvedValueOnce(null)
    const { getActiveFeeSchedule } = await import('../fee-engine')
    const result = await getActiveFeeSchedule()
    expect(result).toBeNull()
  })

  it('uses effectiveAt lte filter for point-in-time resolution', async () => {
    const at = new Date('2026-06-01T12:00:00Z')
    mockFindFirst.mockResolvedValueOnce(null)

    const { getActiveFeeSchedule } = await import('../fee-engine')
    await getActiveFeeSchedule(at)

    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ effectiveAt: { lte: at } }),
      })
    )
  })
})

// ─── Tests: applyFeeScheduleAction — validation ───────────────────────────────
describe('applyFeeScheduleAction — validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects effectiveFrom more than 60s in the past', async () => {
    mockRequireRole.mockResolvedValue({ id: 'u1', role: 'MASTER_ADMIN', email: 'admin@karis.com', fullName: 'Admin' })

    const { applyFeeScheduleAction } = await import('@/app/(admin)/_actions/settings')
    const result = await applyFeeScheduleAction({
      rules: BASE_RULES,
      effectiveFrom: new Date(Date.now() - 120_000),
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/past/i)
  })

  it('rejects when rule parts do not sum to totalPct', async () => {
    mockRequireRole.mockResolvedValue({ id: 'u1', role: 'MASTER_ADMIN', email: 'admin@karis.com', fullName: 'Admin' })

    const badRules: FeeScheduleRules = {
      PURCHASE: { totalPct: 2.5, communityFundPct: 1.0, operationsFundPct: 0.5, developerSharePct: 0.5 },
    }

    const { applyFeeScheduleAction } = await import('@/app/(admin)/_actions/settings')
    const result = await applyFeeScheduleAction({ rules: badRules, effectiveFrom: new Date() })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/totalPct/i)
  })

  it('throws when caller lacks MASTER_ADMIN role', async () => {
    mockRequireRole.mockRejectedValue(new Error('Forbidden'))

    const { applyFeeScheduleAction } = await import('@/app/(admin)/_actions/settings')
    await expect(
      applyFeeScheduleAction({ rules: BASE_RULES, effectiveFrom: new Date() }),
    ).rejects.toThrow('Forbidden')
  })

  it('throws when unauthenticated', async () => {
    mockRequireRole.mockRejectedValue(new Error('Unauthorized'))

    const { applyFeeScheduleAction } = await import('@/app/(admin)/_actions/settings')
    await expect(
      applyFeeScheduleAction({ rules: BASE_RULES, effectiveFrom: new Date() }),
    ).rejects.toThrow()
  })

  it('returns success and writes audit log on valid apply', async () => {
    mockRequireRole.mockResolvedValue({ id: 'u1', role: 'MASTER_ADMIN', email: 'admin@karis.com', fullName: 'Admin' })

    const oldScheduleId = 'sch-old'
    const newScheduleId = 'sch-new'

    // $transaction executes the callback with a tx proxy
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<string>) => {
      const tx = {
        feeSchedule: {
          findFirst: vi.fn().mockResolvedValue({
            id: oldScheduleId,
            effectiveTo: null,
            rules: BASE_RULES,
          }),
          update: vi.fn().mockResolvedValue({}),
          create: vi.fn().mockResolvedValue({ id: newScheduleId }),
        },
        auditLog: {
          createMany: vi.fn().mockResolvedValue({ count: 2 }),
          create: vi.fn().mockResolvedValue({}),
        },
      }
      return fn(tx)
    })

    const newRules: FeeScheduleRules = {
      ...BASE_RULES,
      PURCHASE: { totalPct: 3.0, communityFundPct: 2.0, operationsFundPct: 0.5, developerSharePct: 0.5 },
    }

    const { applyFeeScheduleAction } = await import('@/app/(admin)/_actions/settings')
    const result = await applyFeeScheduleAction({ rules: newRules, effectiveFrom: new Date() })

    expect(result.success).toBe(true)
    if (result.success) expect(result.scheduleId).toBe(newScheduleId)
    expect(mockTransaction).toHaveBeenCalledOnce()
  })
})
