import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

vi.mock('@/lib/db', () => ({
  db: {
    conversionRate: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { getActiveRate, getCurrentRates } from '../rate-resolver'

const mockFindFirst = db.conversionRate.findFirst as ReturnType<typeof vi.fn>
const mockFindMany = db.conversionRate.findMany as ReturnType<typeof vi.fn>

beforeEach(() => vi.clearAllMocks())

describe('getActiveRate', () => {
  it('returns 1 when base === quote', async () => {
    const result = await getActiveRate('KCRD', 'KCRD')
    expect(result).toBe('1')
    expect(mockFindFirst).not.toHaveBeenCalled()
  })

  it('returns active rate for KCRD → USD', async () => {
    mockFindFirst.mockResolvedValue({ rate: new Prisma.Decimal('1.00000000') })
    const result = await getActiveRate('KCRD', 'USD')
    // Decimal.toString() strips trailing zeros: '1.00000000' → '1'
    expect(result).toBe('1')
  })

  it('returns null when no active rate found', async () => {
    mockFindFirst.mockResolvedValue(null)
    const result = await getActiveRate('KCRD', 'GYD')
    expect(result).toBeNull()
  })

  it('queries with correct effectiveFrom filter', async () => {
    const at = new Date('2026-01-15T12:00:00Z')
    mockFindFirst.mockResolvedValue({ rate: new Prisma.Decimal('210.00000000') })
    await getActiveRate('KCRD', 'GYD', at)
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ effectiveFrom: { lte: at } }),
      })
    )
  })
})

describe('getCurrentRates', () => {
  it('includes identity pairs (KCRD_KCRD = 1)', async () => {
    mockFindMany.mockResolvedValue([])
    const rates = await getCurrentRates()
    expect(rates['KCRD_KCRD']).toBe('1')
    expect(rates['USD_USD']).toBe('1')
    expect(rates['GYD_GYD']).toBe('1')
  })

  it('maps rows into rate key pairs', async () => {
    mockFindMany.mockResolvedValue([
      { baseCurrency: 'KCRD', quoteCurrency: 'USD', rate: new Prisma.Decimal('1.00000000') },
      { baseCurrency: 'KCRD', quoteCurrency: 'GYD', rate: new Prisma.Decimal('210.00000000') },
    ])
    const rates = await getCurrentRates()
    // Decimal.toString() strips trailing zeros
    expect(rates['KCRD_USD']).toBe('1')
    expect(rates['KCRD_GYD']).toBe('210')
  })
})
