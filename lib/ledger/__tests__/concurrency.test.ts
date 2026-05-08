import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

type WalletRow = {
  id: string
  isSystem: boolean
  systemKey: string | null
  floor_kcrd: Prisma.Decimal | null
}

const wallets = new Map<string, WalletRow>()
const balances = new Map<string, Prisma.Decimal>()
const activeLocks = new Map<bigint, { promise: Promise<void>; release: () => void }>()
let transactionSeq = 0

function resetLedgerState() {
  wallets.clear()
  balances.clear()
  activeLocks.clear()
  transactionSeq = 0
}

async function acquireLock(lockKey: bigint, heldLocks: Array<{ key: bigint; release: () => void }>) {
  while (activeLocks.has(lockKey)) {
    await activeLocks.get(lockKey)!.promise
  }

  let release!: () => void
  const promise = new Promise<void>((resolve) => {
    release = resolve
  })
  activeLocks.set(lockKey, { promise, release })
  heldLocks.push({ key: lockKey, release })
}

function createTxClient() {
  const heldLocks: Array<{ key: bigint; release: () => void }> = []

  return {
    $queryRaw: vi.fn(async (_strings: TemplateStringsArray, lockKey: bigint) => {
      await acquireLock(lockKey, heldLocks)
    }),
    wallet: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string } }) => {
        if (!where.id) return null
        return wallets.get(where.id) ?? null
      }),
      findMany: vi.fn(async () => [...wallets.values()].filter((wallet) => wallet.isSystem)),
    },
    ledgerEntry: {
      aggregate: vi.fn(async ({ where }: { where: { walletId: string } }) => ({
        _sum: { amount: balances.get(where.walletId) ?? new Prisma.Decimal(0) },
      })),
    },
    transaction: {
      create: vi.fn(async ({ data }: { data: { entries: { createMany: { data: Array<{ walletId: string; amount: Prisma.Decimal }> } } } }) => {
        for (const entry of data.entries.createMany.data) {
          const current = balances.get(entry.walletId) ?? new Prisma.Decimal(0)
          balances.set(entry.walletId, current.add(new Prisma.Decimal(entry.amount)))
        }
        transactionSeq += 1
        return { id: `tx-${transactionSeq}` }
      }),
    },
    releaseLocks() {
      for (const held of heldLocks.reverse()) {
        const active = activeLocks.get(held.key)
        if (active?.release === held.release) {
          activeLocks.delete(held.key)
          held.release()
        }
      }
    },
  }
}

vi.mock('@/lib/db', () => ({
  db: {
    $transaction: vi.fn(async (fn: (tx: ReturnType<typeof createTxClient>) => Promise<unknown>) => {
      const tx = createTxClient()
      try {
        return await fn(tx)
      } finally {
        tx.releaseLocks()
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
        TRANSFER: { totalPct: 0, communityFundPct: 0, operationsFundPct: 0, developerSharePct: 0 },
      },
    }),
  }
})

vi.mock('../reconciliation', () => ({
  reconcileTreasury: vi.fn().mockResolvedValue({ isBalanced: true, discrepancy: new Prisma.Decimal(0) }),
}))

import { transferCredits } from '../service'
import { FloorBreachError } from '../types'

beforeEach(() => {
  vi.clearAllMocks()
  resetLedgerState()
})

describe('transferCredits concurrency protection', () => {
  it('serializes concurrent floor-sensitive transfers so only one can commit', async () => {
    wallets.set('system-a', {
      id: 'system-a',
      isSystem: true,
      systemKey: 'treasury_reserve',
      floor_kcrd: new Prisma.Decimal('50'),
    })
    wallets.set('user-b', { id: 'user-b', isSystem: false, systemKey: null, floor_kcrd: null })
    balances.set('system-a', new Prisma.Decimal('100'))
    balances.set('user-b', new Prisma.Decimal('0'))

    const request = {
      fromWalletId: 'system-a',
      toWalletId: 'user-b',
      amount: new Prisma.Decimal('30'),
      type: 'TRANSFER' as const,
      description: 'Concurrent floor test',
    }

    const results = await Promise.allSettled([
      transferCredits(request),
      transferCredits(request),
    ])

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    const rejected = results.find((result) => result.status === 'rejected')
    expect(rejected?.status).toBe('rejected')
    if (rejected?.status === 'rejected') {
      expect(rejected.reason).toBeInstanceOf(FloorBreachError)
    }
    expect(balances.get('system-a')!.toFixed(8)).toBe('70.00000000')
  })

  it('orders wallet locks consistently for opposite-direction transfers', async () => {
    wallets.set('wallet-a', { id: 'wallet-a', isSystem: false, systemKey: null, floor_kcrd: null })
    wallets.set('wallet-b', { id: 'wallet-b', isSystem: false, systemKey: null, floor_kcrd: null })
    balances.set('wallet-a', new Prisma.Decimal('100'))
    balances.set('wallet-b', new Prisma.Decimal('100'))

    const completed = await Promise.race([
      Promise.allSettled([
        transferCredits({
          fromWalletId: 'wallet-a',
          toWalletId: 'wallet-b',
          amount: new Prisma.Decimal('10'),
          type: 'TRANSFER',
          description: 'A to B',
        }),
        transferCredits({
          fromWalletId: 'wallet-b',
          toWalletId: 'wallet-a',
          amount: new Prisma.Decimal('10'),
          type: 'TRANSFER',
          description: 'B to A',
        }),
      ]),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timed out waiting for opposite-direction transfers')), 1000)
      }),
    ])

    expect(completed).toHaveLength(2)
    expect(completed.every((result) => result.status === 'fulfilled')).toBe(true)
    expect(balances.get('wallet-a')!.toFixed(8)).toBe('100.00000000')
    expect(balances.get('wallet-b')!.toFixed(8)).toBe('100.00000000')
  })
})
