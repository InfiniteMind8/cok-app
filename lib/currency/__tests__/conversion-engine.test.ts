import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

vi.mock('@/lib/db', () => ({
  db: {
    wallet: { findUnique: vi.fn() },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        transaction: { create: vi.fn().mockResolvedValue({ id: 'tx-1' }) },
        ledgerEntry: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
        auditLog: { create: vi.fn().mockResolvedValue({}) },
      }
      return fn(tx)
    }),
  },
}))

vi.mock('../rate-resolver', () => ({
  getActiveRate: vi.fn(),
}))

vi.mock('../promotion-resolver', () => ({
  getApplicablePromotion: vi.fn(),
}))

import { db } from '@/lib/db'
import { getActiveRate } from '../rate-resolver'
import { getApplicablePromotion } from '../promotion-resolver'
import { convertFiatToKcrd } from '../conversion-engine'

const mockWalletFind = db.wallet.findUnique as ReturnType<typeof vi.fn>
const mockGetRate = getActiveRate as ReturnType<typeof vi.fn>
const mockGetPromo = getApplicablePromotion as ReturnType<typeof vi.fn>

const userWallet = { id: 'wallet-user' }
const fiatWallet = { id: 'wallet-fiat' }
const promoWallet = { id: 'wallet-promo' }

function setupWallets() {
  mockWalletFind.mockImplementation(({ where }: { where: { userId?: string; systemKey?: string } }) => {
    if (where.userId) return Promise.resolve(userWallet)
    if (where.systemKey === 'fiat_settlement') return Promise.resolve(fiatWallet)
    if (where.systemKey === 'promotions') return Promise.resolve(promoWallet)
    return Promise.resolve(null)
  })
}

beforeEach(() => vi.clearAllMocks())

describe('convertFiatToKcrd', () => {
  it('returns error when amount <= 0', async () => {
    const result = await convertFiatToKcrd({ userId: 'u1', fiatAmount: '0', fiatCurrency: 'USD', recordedBy: 'admin' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('greater than zero')
  })

  it('returns error when fiatCurrency is KCRD', async () => {
    const result = await convertFiatToKcrd({ userId: 'u1', fiatAmount: '100', fiatCurrency: 'KCRD', recordedBy: 'admin' })
    expect(result.ok).toBe(false)
  })

  it('returns error when no active rate found', async () => {
    mockGetRate.mockResolvedValue(null)
    const result = await convertFiatToKcrd({ userId: 'u1', fiatAmount: '100', fiatCurrency: 'USD', recordedBy: 'admin' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('No active rate')
  })

  it('base-only: no promo — correct KCRD amount, no bonus', async () => {
    mockGetRate.mockResolvedValue('1.00000000')
    mockGetPromo.mockResolvedValue(null)
    setupWallets()
    const result = await convertFiatToKcrd({ userId: 'u1', fiatAmount: '100', fiatCurrency: 'USD', recordedBy: 'admin' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.baseKcrd).toBe('100.00000000')
      expect(result.bonusKcrd).toBe('0.00000000')
      expect(result.promotionId).toBeNull()
    }
  })

  it('base + bonus: founding member with +20% promo', async () => {
    mockGetRate.mockResolvedValue('1.00000000')
    mockGetPromo.mockResolvedValue({ id: 'p1', name: 'Founding Bonus', bonusPercent: '20.00' })
    setupWallets()
    const result = await convertFiatToKcrd({ userId: 'u1', fiatAmount: '100', fiatCurrency: 'USD', recordedBy: 'admin' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.baseKcrd).toBe('100.00000000')
      expect(new Prisma.Decimal(result.bonusKcrd).toFixed(2)).toBe('20.00')
      expect(new Prisma.Decimal(result.totalKcrd).toFixed(2)).toBe('120.00')
      expect(result.promotionId).toBe('p1')
    }
  })
})
