import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

vi.mock('@/lib/db', () => ({
  db: {
    ledgerEntry: { aggregate: vi.fn() },
  },
}))

import { reconcileTreasury } from '../reconciliation'
import { db } from '@/lib/db'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('reconcileTreasury', () => {
  it('balanced: sum of all entries equals total issued', async () => {
    vi.mocked(db.ledgerEntry.aggregate)
      .mockResolvedValueOnce({ _sum: { amount: new Prisma.Decimal('50000') } } as any) // all entries
      .mockResolvedValueOnce({ _sum: { amount: new Prisma.Decimal('50000') } } as any) // issued

    const result = await reconcileTreasury()
    expect(result.isBalanced).toBe(true)
    expect(result.discrepancy.eq(0)).toBe(true)
    expect(result.totalIssued.toFixed(2)).toBe('50000.00')
    expect(result.sumAllEntries.toFixed(2)).toBe('50000.00')
  })

  it('not balanced: discrepancy = totalIssued - sumAllEntries', async () => {
    vi.mocked(db.ledgerEntry.aggregate)
      .mockResolvedValueOnce({ _sum: { amount: new Prisma.Decimal('49990') } } as any) // all entries
      .mockResolvedValueOnce({ _sum: { amount: new Prisma.Decimal('50000') } } as any) // issued

    const result = await reconcileTreasury()
    expect(result.isBalanced).toBe(false)
    expect(result.discrepancy.toFixed(2)).toBe('10.00') // 50000 - 49990
  })

  it('empty database: balanced with all zeros', async () => {
    vi.mocked(db.ledgerEntry.aggregate)
      .mockResolvedValueOnce({ _sum: { amount: null } } as any)
      .mockResolvedValueOnce({ _sum: { amount: null } } as any)

    const result = await reconcileTreasury()
    expect(result.isBalanced).toBe(true)
    expect(result.totalIssued.eq(0)).toBe(true)
    expect(result.sumAllEntries.eq(0)).toBe(true)
    expect(result.discrepancy.eq(0)).toBe(true)
  })

  it('discrepancy is signed correctly (negative when over-issued)', async () => {
    vi.mocked(db.ledgerEntry.aggregate)
      .mockResolvedValueOnce({ _sum: { amount: new Prisma.Decimal('51000') } } as any) // more in entries than issued
      .mockResolvedValueOnce({ _sum: { amount: new Prisma.Decimal('50000') } } as any)

    const result = await reconcileTreasury()
    expect(result.isBalanced).toBe(false)
    expect(result.discrepancy.toFixed(2)).toBe('-1000.00') // 50000 - 51000
  })
})
