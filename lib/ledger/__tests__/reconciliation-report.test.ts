import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

// Mock db and email service
vi.mock('@/lib/db', () => ({
  db: {
    ledgerEntry: { aggregate: vi.fn() },
    wallet: { count: vi.fn() },
    reconciliationReport: { create: vi.fn(), findFirst: vi.fn() },
    user: { findMany: vi.fn() },
  },
}))

// Prevent email sending in unit tests
vi.mock('@/lib/email/service', () => ({
  sendEmail: vi.fn().mockResolvedValue({ ok: true, messageId: 'test-msg' }),
}))

import { runAndSaveReconciliation, getActiveAlert } from '../reconciliation-report'
import { db } from '@/lib/db'

beforeEach(() => {
  vi.clearAllMocks()
})

function mockAggregates(creditAmount: string, debitAmount: string, walletCount = 5) {
  vi.mocked(db.ledgerEntry.aggregate)
    .mockResolvedValueOnce({ _sum: { amount: new Prisma.Decimal(creditAmount) } } as any)
    .mockResolvedValueOnce({ _sum: { amount: new Prisma.Decimal(debitAmount) } } as any)
  vi.mocked(db.wallet.count).mockResolvedValue(walletCount)
}

describe('runAndSaveReconciliation', () => {
  it('balanced ledger: status OK, discrepancy is zero', async () => {
    mockAggregates('50000', '-50000')
    vi.mocked(db.reconciliationReport.create).mockResolvedValue({
      id: 'report-1',
      status: 'OK',
      details: {},
      runAt: new Date(),
      acknowledgedById: null,
      acknowledgedAt: null,
    } as any)

    const result = await runAndSaveReconciliation()

    expect(result.status).toBe('OK')
    expect(result.details.discrepancy).toBe('0.00000000')
    expect(result.details.netSum).toBe('0.00000000')
    expect(db.reconciliationReport.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'OK' }) }),
    )
    // No email sent for OK
    const emailModule = await import('@/lib/email/service')
    expect(emailModule.sendEmail).not.toHaveBeenCalled()
  })

  it('imbalanced ledger: status MISMATCH, emails Master Admins', async () => {
    mockAggregates('50000', '-49990')
    vi.mocked(db.reconciliationReport.create).mockResolvedValue({
      id: 'report-2',
      status: 'MISMATCH',
      details: {},
      runAt: new Date(),
      acknowledgedById: null,
      acknowledgedAt: null,
    } as any)
    vi.mocked(db.user.findMany).mockResolvedValue([
      { email: 'admin@cok.org', fullName: 'Master Admin' } as any,
    ])

    const result = await runAndSaveReconciliation()

    expect(result.status).toBe('MISMATCH')
    expect(new Prisma.Decimal(result.details.discrepancy).gt(0)).toBe(true)
    expect(db.reconciliationReport.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'MISMATCH' }) }),
    )
    expect(db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: 'MASTER_ADMIN', status: 'ACTIVE' } }),
    )
    const emailModule = await import('@/lib/email/service')
    expect(emailModule.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ template: 'treasury-alert', to: 'admin@cok.org' }),
    )
  })

  it('empty ledger (all nulls): balanced with zeros', async () => {
    vi.mocked(db.ledgerEntry.aggregate)
      .mockResolvedValueOnce({ _sum: { amount: null } } as any)
      .mockResolvedValueOnce({ _sum: { amount: null } } as any)
    vi.mocked(db.wallet.count).mockResolvedValue(0)
    vi.mocked(db.reconciliationReport.create).mockResolvedValue({
      id: 'report-3',
      status: 'OK',
      details: {},
      runAt: new Date(),
      acknowledgedById: null,
      acknowledgedAt: null,
    } as any)

    const result = await runAndSaveReconciliation()

    expect(result.status).toBe('OK')
    expect(result.details.netSum).toBe('0.00000000')
    expect(result.details.discrepancy).toBe('0.00000000')
    expect(result.details.walletCount).toBe(0)
  })

  it('negative net sum still produces MISMATCH (over-credited)', async () => {
    mockAggregates('50000', '-51000')
    vi.mocked(db.reconciliationReport.create).mockResolvedValue({
      id: 'report-4',
      status: 'MISMATCH',
      details: {},
      runAt: new Date(),
      acknowledgedById: null,
      acknowledgedAt: null,
    } as any)
    vi.mocked(db.user.findMany).mockResolvedValue([])

    const result = await runAndSaveReconciliation()

    expect(result.status).toBe('MISMATCH')
    // discrepancy is always positive (abs value)
    expect(new Prisma.Decimal(result.details.discrepancy).gte(0)).toBe(true)
    expect(result.details.discrepancy).toBe('1000.00000000')
  })

  it('details includes walletCount', async () => {
    mockAggregates('100', '-100', 7)
    vi.mocked(db.reconciliationReport.create).mockResolvedValue({
      id: 'report-5',
      status: 'OK',
      details: {},
      runAt: new Date(),
      acknowledgedById: null,
      acknowledgedAt: null,
    } as any)

    const result = await runAndSaveReconciliation()

    expect(result.details.walletCount).toBe(7)
  })
})

describe('getActiveAlert', () => {
  it('returns null when no MISMATCH report exists', async () => {
    vi.mocked(db.reconciliationReport.findFirst).mockResolvedValue(null)
    const result = await getActiveAlert()
    expect(result).toBeNull()
    expect(db.reconciliationReport.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'MISMATCH', acknowledgedAt: null },
      }),
    )
  })

  it('returns report when unacknowledged MISMATCH exists', async () => {
    const fakeReport = {
      id: 'alert-1',
      status: 'MISMATCH',
      acknowledgedAt: null,
      runAt: new Date(),
    } as any
    vi.mocked(db.reconciliationReport.findFirst).mockResolvedValue(fakeReport)

    const result = await getActiveAlert()
    expect(result).toEqual(fakeReport)
  })

  it('returns null when MISMATCH is acknowledged', async () => {
    vi.mocked(db.reconciliationReport.findFirst).mockResolvedValue(null)

    const result = await getActiveAlert()
    expect(result).toBeNull()
  })
})
