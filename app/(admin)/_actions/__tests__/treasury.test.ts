import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  walletFindUnique: vi.fn(),
  walletUpdate: vi.fn(),
  auditLogCreate: vi.fn(),
  treasuryAdjustmentCreate: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireRole: mocks.requireRole }))

vi.mock('@/lib/db', () => ({
  db: {
    wallet: {
      findUnique: mocks.walletFindUnique,
      update: mocks.walletUpdate,
    },
    auditLog: {
      create: mocks.auditLogCreate,
    },
    treasuryAdjustment: {
      create: mocks.treasuryAdjustmentCreate,
    },
  },
}))

vi.mock('@/lib/audit', () => ({
  createAuditEntry: vi.fn(async (entry: unknown) => {
    mocks.auditLogCreate(entry)
  }),
}))

import { updateWalletFloorAction } from '../treasury'

const adminUser = { id: 'admin-1', role: 'MASTER_ADMIN' }

beforeEach(() => {
  vi.clearAllMocks()
  mocks.requireRole.mockResolvedValue(adminUser)
  mocks.walletUpdate.mockResolvedValue({})
  mocks.auditLogCreate.mockResolvedValue({})
})

describe('updateWalletFloorAction', () => {
  it('writes audit entry with before/after floor values', async () => {
    mocks.walletFindUnique.mockResolvedValueOnce({
      id: 'wallet-1',
      isSystem: true,
      systemKey: 'treasury_reserve',
      floor_kcrd: new Prisma.Decimal('100'),
    })

    await updateWalletFloorAction({ walletId: 'wallet-1', floor: '200' })

    expect(mocks.walletUpdate).toHaveBeenCalledWith({
      where: { id: 'wallet-1' },
      data: { floor_kcrd: new Prisma.Decimal('200') },
    })

    expect(mocks.auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'wallet.floor.updated',
        entity: 'Wallet',
        entityId: 'wallet-1',
        actorId: 'admin-1',
        before: { floor_kcrd: '100' },
        after: expect.objectContaining({ floor_kcrd: '200' }),
      })
    )
  })

  it('rejects a negative floor value', async () => {
    await expect(
      updateWalletFloorAction({ walletId: 'wallet-1', floor: '-50' })
    ).rejects.toThrow('Floor must be zero or a positive value')

    expect(mocks.walletUpdate).not.toHaveBeenCalled()
  })

  it('accepts null floor (unlimited)', async () => {
    mocks.walletFindUnique.mockResolvedValueOnce({
      id: 'wallet-2',
      isSystem: true,
      systemKey: 'community_fund',
      floor_kcrd: new Prisma.Decimal('50'),
    })

    await updateWalletFloorAction({ walletId: 'wallet-2', floor: null })

    expect(mocks.walletUpdate).toHaveBeenCalledWith({
      where: { id: 'wallet-2' },
      data: { floor_kcrd: null },
    })

    expect(mocks.auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        before: { floor_kcrd: '50' },
        after: expect.objectContaining({ floor_kcrd: null }),
      })
    )
  })

  it('rejects non-system wallets', async () => {
    mocks.walletFindUnique.mockResolvedValueOnce({
      id: 'user-wallet-1',
      isSystem: false,
      systemKey: null,
      floor_kcrd: null,
    })

    await expect(
      updateWalletFloorAction({ walletId: 'user-wallet-1', floor: '10' })
    ).rejects.toThrow('system wallets only')

    expect(mocks.walletUpdate).not.toHaveBeenCalled()
  })
})
