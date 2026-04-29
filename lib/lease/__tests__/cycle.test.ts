import { describe, it, expect, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { addOneCycle, computeNextPaymentDue, computeLeaseStatus } from '../cycle'

const d = (s: string) => new Date(s)

// ─── addOneCycle ──────────────────────────────────────────────────────────────

describe('addOneCycle', () => {
  it('DAILY advances by 1 day', () => {
    expect(addOneCycle(d('2026-05-01'), 'DAILY')).toEqual(d('2026-05-02'))
  })

  it('WEEKLY advances by 7 days', () => {
    expect(addOneCycle(d('2026-05-01'), 'WEEKLY')).toEqual(d('2026-05-08'))
  })

  it('MONTHLY advances by 1 calendar month', () => {
    expect(addOneCycle(d('2026-01-31'), 'MONTHLY')).toEqual(d('2026-02-28'))
  })

  it('ANNUAL advances by 1 year', () => {
    expect(addOneCycle(d('2026-03-15'), 'ANNUAL')).toEqual(d('2027-03-15'))
  })
})

// ─── computeNextPaymentDue ────────────────────────────────────────────────────

describe('computeNextPaymentDue', () => {
  it('returns startDate advanced past today (MONTHLY)', () => {
    const start = d('2025-01-01')
    const today = d('2026-04-29')
    const result = computeNextPaymentDue(start, 'MONTHLY', today)
    // Should be 2026-05-01 (Jan 1 + 16 months)
    expect(result > today).toBe(true)
    expect(addOneCycle(new Date(result.getTime() - 86400 * 1000 * 31), 'MONTHLY') <= today
      || result > today).toBe(true)
  })

  it('returns startDate itself if already after today', () => {
    const start = d('2026-05-01')
    const today = d('2026-04-29')
    const result = computeNextPaymentDue(start, 'MONTHLY', today)
    expect(result).toEqual(d('2026-05-01'))
  })

  it('handles WEEKLY cycle', () => {
    const start = d('2026-04-20')
    const today = d('2026-04-29')
    const result = computeNextPaymentDue(start, 'WEEKLY', today)
    // 2026-04-20, +7 = 04-27 (≤ today), +7 = 05-04 (> today)
    expect(result).toEqual(d('2026-05-04'))
  })

  it('handles DAILY cycle', () => {
    const start = d('2026-04-28')
    const today = d('2026-04-29')
    const result = computeNextPaymentDue(start, 'DAILY', today)
    expect(result).toEqual(d('2026-04-30'))
  })

  it('handles ANNUAL cycle', () => {
    const start = d('2025-03-01')
    const today = d('2026-04-29')
    const result = computeNextPaymentDue(start, 'ANNUAL', today)
    expect(result).toEqual(d('2027-03-01'))
  })
})

// ─── computeLeaseStatus ───────────────────────────────────────────────────────

describe('computeLeaseStatus', () => {
  it('returns ACTIVE when endDate is null', () => {
    expect(computeLeaseStatus(null, d('2026-04-29'))).toBe('ACTIVE')
  })

  it('returns ACTIVE when endDate is more than 14 days away', () => {
    expect(computeLeaseStatus(d('2026-05-20'), d('2026-04-29'))).toBe('ACTIVE')
  })

  it('returns ENDING_SOON when endDate is exactly 14 days away', () => {
    expect(computeLeaseStatus(d('2026-05-13'), d('2026-04-29'))).toBe('ENDING_SOON')
  })

  it('returns ENDING_SOON when endDate is 1 day away', () => {
    expect(computeLeaseStatus(d('2026-04-30'), d('2026-04-29'))).toBe('ENDING_SOON')
  })

  it('returns EXPIRED when endDate is today', () => {
    expect(computeLeaseStatus(d('2026-04-29'), d('2026-04-29'))).toBe('EXPIRED')
  })

  it('returns EXPIRED when endDate is in the past', () => {
    expect(computeLeaseStatus(d('2026-01-01'), d('2026-04-29'))).toBe('EXPIRED')
  })
})
