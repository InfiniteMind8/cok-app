import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

vi.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: vi.fn() },
    conversionPromotion: { findMany: vi.fn() },
  },
}))

import { db } from '@/lib/db'
import { getApplicablePromotion } from '../promotion-resolver'

const mockUserFind = db.user.findUnique as ReturnType<typeof vi.fn>
const mockPromoFind = db.conversionPromotion.findMany as ReturnType<typeof vi.fn>

const basePromo = {
  id: 'promo-1',
  name: 'Founding Bonus',
  bonusPercent: new Prisma.Decimal('20.00'),
  direction: 'FIAT_TO_KCRD',
  eligibility: 'FOUNDING_MEMBERS',
  eligibleUserIds: [] as string[],
}

beforeEach(() => vi.clearAllMocks())

describe('getApplicablePromotion', () => {
  it('returns null when user not found', async () => {
    mockUserFind.mockResolvedValue(null)
    const result = await getApplicablePromotion('user-x', 'FIAT_TO_KCRD', 'USD')
    expect(result).toBeNull()
  })

  it('returns promotion for founding member when eligibility=FOUNDING_MEMBERS', async () => {
    mockUserFind.mockResolvedValue({ role: 'RESIDENT', foundingMember: true })
    mockPromoFind.mockResolvedValue([basePromo])
    const result = await getApplicablePromotion('user-1', 'FIAT_TO_KCRD', 'USD')
    expect(result?.id).toBe('promo-1')
    // Decimal.toString() strips trailing zeros: '20.00' → '20'
    expect(result?.bonusPercent).toBe('20')
  })

  it('returns null for non-founding member when eligibility=FOUNDING_MEMBERS', async () => {
    mockUserFind.mockResolvedValue({ role: 'RESIDENT', foundingMember: false })
    mockPromoFind.mockResolvedValue([basePromo])
    const result = await getApplicablePromotion('user-2', 'FIAT_TO_KCRD', 'USD')
    expect(result).toBeNull()
  })

  it('returns promotion for ALL eligibility regardless of role', async () => {
    mockUserFind.mockResolvedValue({ role: 'VISITOR', foundingMember: false })
    mockPromoFind.mockResolvedValue([{ ...basePromo, eligibility: 'ALL' }])
    const result = await getApplicablePromotion('user-3', 'FIAT_TO_KCRD', 'USD')
    expect(result?.id).toBe('promo-1')
  })

  it('RESIDENTS_ONLY: resident gets promo, visitor does not', async () => {
    const promo = { ...basePromo, eligibility: 'RESIDENTS_ONLY' }
    mockPromoFind.mockResolvedValue([promo])

    mockUserFind.mockResolvedValue({ role: 'RESIDENT', foundingMember: false })
    const forResident = await getApplicablePromotion('user-r', 'FIAT_TO_KCRD', 'USD')
    expect(forResident?.id).toBe('promo-1')

    mockUserFind.mockResolvedValue({ role: 'VISITOR', foundingMember: false })
    const forVisitor = await getApplicablePromotion('user-v', 'FIAT_TO_KCRD', 'USD')
    expect(forVisitor).toBeNull()
  })

  it('SPECIFIC_USERS: only listed user gets promo', async () => {
    const promo = { ...basePromo, eligibility: 'SPECIFIC_USERS', eligibleUserIds: ['user-exact'] }
    mockPromoFind.mockResolvedValue([promo])

    mockUserFind.mockResolvedValue({ role: 'RESIDENT', foundingMember: false })
    const forListed = await getApplicablePromotion('user-exact', 'FIAT_TO_KCRD', 'USD')
    expect(forListed?.id).toBe('promo-1')

    const forOther = await getApplicablePromotion('user-other', 'FIAT_TO_KCRD', 'USD')
    expect(forOther).toBeNull()
  })

  it('returns null when no active promotions', async () => {
    mockUserFind.mockResolvedValue({ role: 'RESIDENT', foundingMember: true })
    mockPromoFind.mockResolvedValue([])
    const result = await getApplicablePromotion('user-1', 'FIAT_TO_KCRD', 'USD')
    expect(result).toBeNull()
  })
})
