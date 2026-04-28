import { describe, it, expect } from 'vitest'
import { formatAmount } from '../format-amount'

const rates = {
  KCRD_KCRD: '1',
  USD_USD: '1',
  GYD_GYD: '1',
  KCRD_USD: '1.00000000',
  KCRD_GYD: '210.00000000',
  USD_GYD: '210.00000000',
}

describe('formatAmount', () => {
  it('KCRD display shows K prefix and no tooltip conversion', () => {
    const r = formatAmount('1000', 'KCRD', rates)
    expect(r.display).toBe('K 1,000.00')
    expect(r.isSameAsKcrd).toBe(true)
  })

  it('USD display applies rate and shows $ symbol', () => {
    const r = formatAmount('500', 'USD', rates)
    expect(r.symbol).toBe('$')
    expect(r.display).toBe('$ 500.00')
    expect(r.isSameAsKcrd).toBe(false)
  })

  it('GYD display rounds to 0 decimals', () => {
    const r = formatAmount('1', 'GYD', rates)
    expect(r.display).toBe('G$ 210')
    expect(r.symbol).toBe('G$')
  })

  it('tooltip contains KCRD equivalent', () => {
    const r = formatAmount('100', 'USD', rates)
    expect(r.tooltipText).toContain('100.00 KCRD')
  })

  it('returns KCRD fallback when rate unavailable', () => {
    const r = formatAmount('100', 'USD', {})
    expect(r.display).toContain('K')
    expect(r.tooltipText).toContain('unavailable')
  })

  it('handles NaN input gracefully', () => {
    const r = formatAmount('not-a-number', 'KCRD', rates)
    expect(r.display).toBe('K 0.00')
  })
})
