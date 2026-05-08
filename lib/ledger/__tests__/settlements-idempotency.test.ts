import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

type SettlementRow = {
  id: string
  userId: string
  amount: Prisma.Decimal
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'SETTLED'
  transactionId: string | null
  settledBy?: string | null
  settledAt?: Date | null
  proofUrl?: string | null
}

type WalletRow = {
  id: string
  userId: string | null
  isSystem: boolean
  systemKey: string | null
  floor_kcrd: Prisma.Decimal | null
}

const settlements = new Map<string, SettlementRow>()
const wallets = new Map<string, WalletRow>()
const balances = new Map<string, Prisma.Decimal>()
let failTransferCreate = false
let transactionSeq = 0

function seedBaseState(status: SettlementRow['status'] = 'APPROVED') {
  settlements.set('sr-1', {
    id: 'sr-1',
    userId: 'user-1',
    amount: new Prisma.Decimal('25'),
    status,
    transactionId: null,
  })
  wallets.set('wallet-user', {
    id: 'wallet-user',
    userId: 'user-1',
    isSystem: false,
    systemKey: null,
    floor_kcrd: null,
  })
  wallets.set('wallet-burn', {
    id: 'wallet-burn',
    userId: null,
    isSystem: true,
    systemKey: 'settlement_burn',
    floor_kcrd: null,
  })
  balances.set('wallet-user', new Prisma.Decimal('100'))
  balances.set('wallet-burn', new Prisma.Decimal('0'))
}

function cloneSettlements() {
  return new Map([...settlements].map(([key, value]) => [key, { ...value }]))
}

function cloneBalances() {
  return new Map([...balances].map(([key, value]) => [key, new Prisma.Decimal(value)]))
}

function restoreState(snapshot: { settlements: Map<string, SettlementRow>; balances: Map<string, Prisma.Decimal> }) {
  settlements.clear()
  for (const [key, value] of snapshot.settlements) settlements.set(key, value)
  balances.clear()
  for (const [key, value] of snapshot.balances) balances.set(key, value)
}

function findSettlement(id: string) {
  const row = settlements.get(id)
  return row ? { ...row } : null
}

function findWallet(where: { id?: string; userId?: string; systemKey?: string }) {
  if (where.id) return wallets.get(where.id) ?? null
  return [...wallets.values()].find((wallet) => (
    (where.userId && wallet.userId === where.userId) ||
    (where.systemKey && wallet.systemKey === where.systemKey)
  )) ?? null
}

const transactionCreate = vi.fn(async ({ data }: { data: { entries: { createMany: { data: Array<{ walletId: string; amount: Prisma.Decimal }> } } } }) => {
  if (failTransferCreate) throw new Error('simulated ledger write failure')

  for (const entry of data.entries.createMany.data) {
    const current = balances.get(entry.walletId) ?? new Prisma.Decimal(0)
    balances.set(entry.walletId, current.add(new Prisma.Decimal(entry.amount)))
  }
  transactionSeq += 1
  return { id: `tx-settle-${transactionSeq}` }
})

function createTxClient() {
  return {
    $queryRaw: vi.fn(),
    settlementRequest: {
      updateMany: vi.fn(async ({ where, data }: { where: { id: string; status?: string }; data: Partial<SettlementRow> }) => {
        const current = settlements.get(where.id)
        if (!current || (where.status && current.status !== where.status)) return { count: 0 }
        settlements.set(where.id, { ...current, ...data })
        return { count: 1 }
      }),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => findSettlement(where.id)),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<SettlementRow> }) => {
        const current = settlements.get(where.id)
        if (!current) throw new Error(`Settlement ${where.id} not found`)
        const updated = { ...current, ...data }
        settlements.set(where.id, updated)
        return updated
      }),
    },
    user: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => (
        where.id === 'user-1' ? { role: 'RESIDENT' } : null
      )),
    },
    wallet: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string; userId?: string; systemKey?: string } }) => findWallet(where)),
      findMany: vi.fn(async () => [...wallets.values()].filter((wallet) => wallet.isSystem)),
    },
    ledgerEntry: {
      aggregate: vi.fn(async ({ where }: { where: { walletId: string } }) => ({
        _sum: { amount: balances.get(where.walletId) ?? new Prisma.Decimal(0) },
      })),
    },
    transaction: { create: transactionCreate },
  }
}

vi.mock('@/lib/db', () => ({
  db: {
    settlementRequest: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => findSettlement(where.id)),
    },
    $transaction: vi.fn(async (fn: (tx: ReturnType<typeof createTxClient>) => Promise<unknown>) => {
      const snapshot = { settlements: cloneSettlements(), balances: cloneBalances() }
      try {
        return await fn(createTxClient())
      } catch (error) {
        restoreState(snapshot)
        throw error
      }
    }),
  },
}))

vi.mock('../fee-engine', async () => {
  const actual = await vi.importActual<typeof import('../fee-engine')>('../fee-engine')
  return {
    ...actual,
    getActiveFeeSchedule: vi.fn().mockResolvedValue({
      id: 'zero-fee-schedule',
      rules: {
        RESIDENT_SETTLEMENT: { totalPct: 0, communityFundPct: 0, operationsFundPct: 0, developerSharePct: 0 },
      },
    }),
  }
})

vi.mock('../reconciliation', () => ({
  reconcileTreasury: vi.fn().mockResolvedValue({ isBalanced: true, discrepancy: new Prisma.Decimal(0) }),
}))

import { executeSettlement } from '../settlements'

beforeEach(() => {
  vi.clearAllMocks()
  settlements.clear()
  wallets.clear()
  balances.clear()
  failTransferCreate = false
  transactionSeq = 0
  seedBaseState()
})

describe('executeSettlement atomicity and idempotency', () => {
  it('rolls settlement status back if the ledger write fails inside the transaction', async () => {
    failTransferCreate = true

    await expect(
      executeSettlement({ settlementId: 'sr-1', settledBy: 'admin-1', idempotencyKey: 'sr-1' }),
    ).rejects.toThrow('simulated ledger write failure')

    expect(settlements.get('sr-1')?.status).toBe('APPROVED')
    expect(settlements.get('sr-1')?.transactionId).toBeNull()
    expect(balances.get('wallet-user')!.toFixed(8)).toBe('100.00000000')
  })

  it('returns the existing transaction on retry with the same idempotency key', async () => {
    const first = await executeSettlement({
      settlementId: 'sr-1',
      settledBy: 'admin-1',
      idempotencyKey: 'sr-1',
    })
    const second = await executeSettlement({
      settlementId: 'sr-1',
      settledBy: 'admin-1',
      idempotencyKey: 'sr-1',
    })

    expect(second.transactionId).toBe(first.transactionId)
    expect(transactionCreate).toHaveBeenCalledTimes(1)
    expect(balances.get('wallet-user')!.toFixed(8)).toBe('75.00000000')
    expect(settlements.get('sr-1')?.status).toBe('SETTLED')
  })

  it('rejects non-APPROVED settlements without burning credits', async () => {
    seedBaseState('PENDING_APPROVAL')

    await expect(
      executeSettlement({ settlementId: 'sr-1', settledBy: 'admin-1' }),
    ).rejects.toThrow('Settlement sr-1 is not APPROVED')

    expect(transactionCreate).not.toHaveBeenCalled()
    expect(balances.get('wallet-user')!.toFixed(8)).toBe('100.00000000')
  })
})
