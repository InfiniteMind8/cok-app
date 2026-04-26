import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

vi.mock('@/lib/db', () => ({
  db: {
    ledgerEntry: { aggregate: vi.fn() },
    wallet: { findMany: vi.fn() },
  },
}))

import { formatKCredit, getWalletBalance } from '../balance'
import { db } from '@/lib/db'

describe('formatKCredit', () => {
  it('formats with K prefix and comma separator', () => {
    expect(formatKCredit(new Prisma.Decimal('1000'))).toBe('K 1,000.00')
  })

  it('formats zero', () => {
    expect(formatKCredit(new Prisma.Decimal('0'))).toBe('K 0.00')
  })

  it('rounds 50000.125 using default rounding', () => {
    // decimal.js default ROUND_HALF_UP: 50000.125 → 50000.13
    expect(formatKCredit(new Prisma.Decimal('50000.125'))).toBe('K 50,000.13')
  })

  it('accepts string input', () => {
    expect(formatKCredit('2500.5')).toBe('K 2,500.50')
  })

  it('accepts number input', () => {
    expect(formatKCredit(1234567.89)).toBe('K 1,234,567.89')
  })
})

describe('getWalletBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns Decimal(0) when aggregate returns null', async () => {
    vi.mocked(db.ledgerEntry.aggregate).mockResolvedValueOnce({
      _sum: { amount: null },
    } as any)

    const balance = await getWalletBalance('wallet-1')
    expect(balance.eq(0)).toBe(true)
  })

  it('returns correct Decimal from aggregate', async () => {
    vi.mocked(db.ledgerEntry.aggregate).mockResolvedValueOnce({
      _sum: { amount: new Prisma.Decimal('1500.00') },
    } as any)

    const balance = await getWalletBalance('wallet-1')
    expect(balance.toFixed(2)).toBe('1500.00')
  })

  it('calls aggregate with correct walletId filter', async () => {
    vi.mocked(db.ledgerEntry.aggregate).mockResolvedValueOnce({
      _sum: { amount: new Prisma.Decimal('0') },
    } as any)

    await getWalletBalance('specific-wallet-id')
    expect(vi.mocked(db.ledgerEntry.aggregate)).toHaveBeenCalledWith({
      where: { walletId: 'specific-wallet-id' },
      _sum: { amount: true },
    })
  })
})
