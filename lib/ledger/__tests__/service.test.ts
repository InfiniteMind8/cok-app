import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

// Hoisted mock state for the transaction client
const txWalletFindUnique = vi.fn()
const txWalletFindMany = vi.fn()
const txLedgerEntryAggregate = vi.fn()
const txTransactionCreate = vi.fn()

const txClient = {
  wallet: { findUnique: txWalletFindUnique, findMany: txWalletFindMany },
  ledgerEntry: { aggregate: txLedgerEntryAggregate },
  transaction: { create: txTransactionCreate },
}

vi.mock('@/lib/db', () => ({
  db: {
    $transaction: vi.fn((fn: (tx: typeof txClient) => unknown) => fn(txClient)),
  },
}))

vi.mock('../fee-engine', async () => {
  const actual = await vi.importActual<typeof import('../fee-engine')>('../fee-engine')
  return {
    ...actual,
    getActiveFeeSchedule: vi.fn().mockResolvedValue({
      id: 'test-fee-schedule',
      rules: {
        PURCHASE: { totalPct: 2.5, communityFundPct: 1.5, operationsFundPct: 0.5, developerSharePct: 0.5 },
        TRANSFER: { totalPct: 0, communityFundPct: 0, operationsFundPct: 0, developerSharePct: 0 },
        BARTER: { totalPct: 0, communityFundPct: 0, operationsFundPct: 0, developerSharePct: 0 },
      },
    }),
  }
})

vi.mock('../reconciliation', () => ({
  reconcileTreasury: vi.fn().mockResolvedValue({ isBalanced: true, discrepancy: new Prisma.Decimal(0) }),
}))

import { transferCredits } from '../service'

const systemWallets = [
  { id: 'sys-community', systemKey: 'community_fund' },
  { id: 'sys-operations', systemKey: 'operations_fund' },
  { id: 'sys-developer', systemKey: 'developer_share' },
  { id: 'sys-treasury', systemKey: 'treasury_reserve' },
  { id: 'sys-burn', systemKey: 'settlement_burn' },
]

function setupSuccessfulTransfer(senderBalance = '200') {
  txWalletFindUnique
    .mockResolvedValueOnce({ id: 'from-wallet', isSystem: false, systemKey: null, floor_kcrd: null })
    .mockResolvedValueOnce({ id: 'to-wallet' })
  txLedgerEntryAggregate.mockResolvedValueOnce({
    _sum: { amount: new Prisma.Decimal(senderBalance) },
  })
  txWalletFindMany.mockResolvedValueOnce(systemWallets)
  txTransactionCreate.mockResolvedValueOnce({ id: 'tx-123' })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('transferCredits', () => {
  it('PURCHASE: creates 5 entries, sum is zero', async () => {
    let capturedData: { entries: { createMany: { data: Array<{ walletId: string; amount: Prisma.Decimal }> } } } | undefined

    txWalletFindUnique
      .mockResolvedValueOnce({ id: 'from-wallet', isSystem: false, systemKey: null, floor_kcrd: null })
      .mockResolvedValueOnce({ id: 'to-wallet' })
    txLedgerEntryAggregate.mockResolvedValueOnce({
      _sum: { amount: new Prisma.Decimal('200') },
    })
    txWalletFindMany.mockResolvedValueOnce(systemWallets)
    txTransactionCreate.mockImplementation(async ({ data }: { data: typeof capturedData }) => {
      capturedData = data as any
      return { id: 'tx-purchase' }
    })

    await transferCredits({
      fromWalletId: 'from-wallet',
      toWalletId: 'to-wallet',
      amount: new Prisma.Decimal('100'),
      type: 'PURCHASE',
      description: 'Test purchase',
    })

    const entries = (capturedData as any).entries.createMany.data
    expect(entries).toHaveLength(5)

    const sum = entries.reduce(
      (acc: Prisma.Decimal, e: { amount: Prisma.Decimal }) => acc.add(new Prisma.Decimal(e.amount)),
      new Prisma.Decimal(0)
    )
    expect(sum.eq(0)).toBe(true)
  })

  it('TRANSFER: creates 2 entries, no fee entries', async () => {
    let capturedData: any

    txWalletFindUnique
      .mockResolvedValueOnce({ id: 'from-wallet', isSystem: false, systemKey: null, floor_kcrd: null })
      .mockResolvedValueOnce({ id: 'to-wallet' })
    txLedgerEntryAggregate.mockResolvedValueOnce({
      _sum: { amount: new Prisma.Decimal('200') },
    })
    txWalletFindMany.mockResolvedValueOnce(systemWallets)
    txTransactionCreate.mockImplementation(async ({ data }: any) => {
      capturedData = data
      return { id: 'tx-transfer' }
    })

    await transferCredits({
      fromWalletId: 'from-wallet',
      toWalletId: 'to-wallet',
      amount: new Prisma.Decimal('50'),
      type: 'TRANSFER',
      description: 'Test transfer',
    })

    const entries = capturedData.entries.createMany.data
    expect(entries).toHaveLength(2)
    const sum = entries.reduce(
      (acc: Prisma.Decimal, e: any) => acc.add(new Prisma.Decimal(e.amount)),
      new Prisma.Decimal(0)
    )
    expect(sum.eq(0)).toBe(true)
  })

  it('throws when amount is zero', async () => {
    await expect(
      transferCredits({
        fromWalletId: 'a',
        toWalletId: 'b',
        amount: new Prisma.Decimal('0'),
        type: 'TRANSFER',
        description: 'bad',
      })
    ).rejects.toThrow('Amount must be positive')
  })

  it('throws when amount is negative', async () => {
    await expect(
      transferCredits({
        fromWalletId: 'a',
        toWalletId: 'b',
        amount: new Prisma.Decimal('-10'),
        type: 'TRANSFER',
        description: 'bad',
      })
    ).rejects.toThrow('Amount must be positive')
  })

  it('throws on insufficient balance', async () => {
    txWalletFindUnique
      .mockResolvedValueOnce({ id: 'from-wallet', isSystem: false, systemKey: null, floor_kcrd: null })
      .mockResolvedValueOnce({ id: 'to-wallet' })
    txLedgerEntryAggregate.mockResolvedValueOnce({
      _sum: { amount: new Prisma.Decimal('10') }, // balance = 10, need 100
    })

    await expect(
      transferCredits({
        fromWalletId: 'from-wallet',
        toWalletId: 'to-wallet',
        amount: new Prisma.Decimal('100'),
        type: 'TRANSFER',
        description: 'overdraft test',
      })
    ).rejects.toThrow('Insufficient balance')
  })

  it('returns correct TransferResult for PURCHASE', async () => {
    setupSuccessfulTransfer()

    const result = await transferCredits({
      fromWalletId: 'from-wallet',
      toWalletId: 'to-wallet',
      amount: new Prisma.Decimal('100'),
      type: 'PURCHASE',
      description: 'Test',
    })

    expect(result.transactionId).toBe('tx-123')
    expect(result.grossAmount.toFixed(2)).toBe('100.00')
    expect(result.netAmount.toFixed(2)).toBe('97.50')
    expect(result.feeScheduleId).toBe('test-fee-schedule')
  })

  it('no fee schedule: falls back to zero fees, 2 entries', async () => {
    const { getActiveFeeSchedule } = await import('../fee-engine')
    vi.mocked(getActiveFeeSchedule).mockResolvedValueOnce(null)

    let capturedData: any
    txWalletFindUnique
      .mockResolvedValueOnce({ id: 'from-wallet', isSystem: false, systemKey: null, floor_kcrd: null })
      .mockResolvedValueOnce({ id: 'to-wallet' })
    txLedgerEntryAggregate.mockResolvedValueOnce({
      _sum: { amount: new Prisma.Decimal('200') },
    })
    txWalletFindMany.mockResolvedValueOnce(systemWallets)
    txTransactionCreate.mockImplementation(async ({ data }: any) => {
      capturedData = data
      return { id: 'tx-no-fee' }
    })

    await transferCredits({
      fromWalletId: 'from-wallet',
      toWalletId: 'to-wallet',
      amount: new Prisma.Decimal('100'),
      type: 'PURCHASE',
      description: 'No fee test',
    })

    expect(capturedData.entries.createMany.data).toHaveLength(2)
    expect(capturedData.feeScheduleId).toBeNull()
  })

  it('floor breach: throws FloorBreachError when post-transfer balance < floor', async () => {
    // Sender: system wallet, balance 60, floor 50 → transfer 20 → post = 40 < 50 → breach
    txWalletFindUnique
      .mockResolvedValueOnce({
        id: 'sys-treasury',
        isSystem: true,
        systemKey: 'treasury_reserve',
        floor_kcrd: new Prisma.Decimal('50'),
      })
      .mockResolvedValueOnce({ id: 'to-wallet' })
    txLedgerEntryAggregate.mockResolvedValueOnce({
      _sum: { amount: new Prisma.Decimal('60') },
    })

    const { FloorBreachError } = await import('../types')
    await expect(
      transferCredits({
        fromWalletId: 'sys-treasury',
        toWalletId: 'to-wallet',
        amount: new Prisma.Decimal('20'),
        type: 'TRANSFER',
        description: 'Floor breach test',
      })
    ).rejects.toThrow(FloorBreachError)

    // Transaction.create must NOT have been called (ledger unchanged)
    expect(txTransactionCreate).not.toHaveBeenCalled()
  })

  it('floor=null: transfer succeeds even when balance is minimal', async () => {
    // Sender: system wallet, balance 5, floor=null (unlimited) → transfer 5 → ok
    txWalletFindUnique
      .mockResolvedValueOnce({
        id: 'sys-treasury',
        isSystem: true,
        systemKey: 'treasury_reserve',
        floor_kcrd: null,
      })
      .mockResolvedValueOnce({ id: 'to-wallet' })
    txLedgerEntryAggregate.mockResolvedValueOnce({
      _sum: { amount: new Prisma.Decimal('5') },
    })
    txWalletFindMany.mockResolvedValueOnce(systemWallets)
    txTransactionCreate.mockResolvedValueOnce({ id: 'tx-unlimited' })

    const result = await transferCredits({
      fromWalletId: 'sys-treasury',
      toWalletId: 'to-wallet',
      amount: new Prisma.Decimal('5'),
      type: 'TRANSFER',
      description: 'Unlimited floor test',
    })

    expect(result.transactionId).toBe('tx-unlimited')
  })
})
