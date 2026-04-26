import { describe, it, expect } from 'vitest'
import { Prisma } from '@prisma/client'
import { calculateFee } from '../fee-engine'
import type { FeeScheduleRules } from '../types'

const rules: FeeScheduleRules = {
  PURCHASE: { totalPct: 2.5, communityFundPct: 1.5, operationsFundPct: 0.5, developerSharePct: 0.5 },
  VENDOR_SETTLEMENT: { totalPct: 1.0, communityFundPct: 0.5, operationsFundPct: 0.5, developerSharePct: 0 },
  RESIDENT_SETTLEMENT: { totalPct: 1.0, communityFundPct: 0.5, operationsFundPct: 0.5, developerSharePct: 0 },
  VISITOR_SETTLEMENT: { totalPct: 1.0, communityFundPct: 0.5, operationsFundPct: 0.5, developerSharePct: 0 },
  BARTER: { totalPct: 0, communityFundPct: 0, operationsFundPct: 0, developerSharePct: 0 },
  PAYROLL: { totalPct: 0, communityFundPct: 0, operationsFundPct: 0, developerSharePct: 0 },
  DEPOSIT: { totalPct: 0, communityFundPct: 0, operationsFundPct: 0, developerSharePct: 0 },
  TRANSFER: { totalPct: 0, communityFundPct: 0, operationsFundPct: 0, developerSharePct: 0 },
}

describe('calculateFee', () => {
  it('PURCHASE K 100: net 97.50, correct fee splits', () => {
    const fee = calculateFee('PURCHASE', new Prisma.Decimal('100'), rules)
    expect(fee.netAmount.toFixed(2)).toBe('97.50')
    expect(fee.communityFund.toFixed(2)).toBe('1.50')
    expect(fee.operationsFund.toFixed(2)).toBe('0.50')
    expect(fee.developerShare.toFixed(2)).toBe('0.50')
    expect(fee.totalFee.toFixed(2)).toBe('2.50')
  })

  it('PURCHASE K 100: entries sum to zero', () => {
    const gross = new Prisma.Decimal('100')
    const fee = calculateFee('PURCHASE', gross, rules)
    const sum = gross.neg().add(fee.netAmount).add(fee.communityFund).add(fee.operationsFund).add(fee.developerShare)
    expect(sum.eq(0)).toBe(true)
  })

  it('DEPOSIT K 500: zero fee, full amount to recipient', () => {
    const fee = calculateFee('DEPOSIT', new Prisma.Decimal('500'), rules)
    expect(fee.totalFee.toFixed(2)).toBe('0.00')
    expect(fee.netAmount.toFixed(2)).toBe('500.00')
  })

  it('VENDOR_SETTLEMENT K 200: no developer share', () => {
    const fee = calculateFee('VENDOR_SETTLEMENT', new Prisma.Decimal('200'), rules)
    expect(fee.developerShare.toFixed(2)).toBe('0.00')
    expect(fee.communityFund.toFixed(2)).toBe('1.00')
    expect(fee.operationsFund.toFixed(2)).toBe('1.00')
    expect(fee.totalFee.toFixed(2)).toBe('2.00')
  })

  it('BARTER K 50: zero fee', () => {
    const fee = calculateFee('BARTER', new Prisma.Decimal('50'), rules)
    expect(fee.totalFee.eq(0)).toBe(true)
    expect(fee.netAmount.eq(new Prisma.Decimal('50'))).toBe(true)
  })

  it('fractional K 33.33 at 2.5%: no float errors, zero-sum holds', () => {
    const gross = new Prisma.Decimal('33.33')
    const fee = calculateFee('PURCHASE', gross, rules)
    const sum = gross.neg()
      .add(fee.netAmount)
      .add(fee.communityFund)
      .add(fee.operationsFund)
      .add(fee.developerShare)
    expect(sum.eq(0)).toBe(true)
  })

  it('unknown type (TREASURY_ADJUSTMENT not in rules): zero fee', () => {
    const fee = calculateFee('TREASURY_ADJUSTMENT', new Prisma.Decimal('100'), rules)
    expect(fee.totalFee.eq(0)).toBe(true)
    expect(fee.netAmount.toFixed(2)).toBe('100.00')
  })

  it('zero amount: returns all-zero split', () => {
    const fee = calculateFee('PURCHASE', new Prisma.Decimal('0'), rules)
    expect(fee.totalFee.eq(0)).toBe(true)
    expect(fee.netAmount.eq(0)).toBe(true)
  })

  it('large amount K 1,000,000: zero-sum holds', () => {
    const gross = new Prisma.Decimal('1000000')
    const fee = calculateFee('PURCHASE', gross, rules)
    const sum = gross.neg().add(fee.netAmount).add(fee.communityFund).add(fee.operationsFund).add(fee.developerShare)
    expect(sum.eq(0)).toBe(true)
  })
})
