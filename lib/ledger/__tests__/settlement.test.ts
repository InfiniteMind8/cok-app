import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

vi.mock('@/lib/db', () => ({
  db: {
    settlementRequest: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: { findUnique: vi.fn() },
    wallet: { findUnique: vi.fn() },
  },
}))

vi.mock('../service', () => ({
  transferCredits: vi.fn().mockResolvedValue({
    transactionId: 'tx-settle-123',
    grossAmount: new Prisma.Decimal('75'),
    netAmount: new Prisma.Decimal('74.25'),
    feeSplit: {
      communityFund: new Prisma.Decimal('0.375'),
      operationsFund: new Prisma.Decimal('0.375'),
      developerShare: new Prisma.Decimal('0'),
      totalFee: new Prisma.Decimal('0.75'),
    },
    feeScheduleId: 'schedule-1',
  }),
}))

import {
  requestSettlement,
  approveSettlement,
  declineSettlement,
  executeSettlement,
} from '../settlements'
import { db } from '@/lib/db'
import { transferCredits } from '../service'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('requestSettlement', () => {
  it('creates a SettlementRequest with PENDING_APPROVAL status', async () => {
    vi.mocked(db.settlementRequest.create).mockResolvedValueOnce({
      id: 'sr-1',
      status: 'PENDING_APPROVAL',
    } as any)

    await requestSettlement({ userId: 'user-1', amount: new Prisma.Decimal('75') })

    expect(vi.mocked(db.settlementRequest.create)).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        status: 'PENDING_APPROVAL',
      }),
    })
  })

  it('throws when amount is zero', async () => {
    await expect(requestSettlement({ userId: 'u', amount: '0' })).rejects.toThrow(
      'Settlement amount must be positive'
    )
  })
})

describe('approveSettlement', () => {
  it('updates status to APPROVED', async () => {
    vi.mocked(db.settlementRequest.findUnique).mockResolvedValueOnce({
      id: 'sr-1',
      status: 'PENDING_APPROVAL',
    } as any)
    vi.mocked(db.settlementRequest.update).mockResolvedValueOnce({
      id: 'sr-1',
      status: 'APPROVED',
    } as any)

    await approveSettlement({ settlementId: 'sr-1', approvedBy: 'admin-1' })

    expect(vi.mocked(db.settlementRequest.update)).toHaveBeenCalledWith({
      where: { id: 'sr-1' },
      data: expect.objectContaining({
        status: 'APPROVED',
        approvedBy: 'admin-1',
      }),
    })
  })

  it('throws if already approved', async () => {
    vi.mocked(db.settlementRequest.findUnique).mockResolvedValueOnce({
      id: 'sr-1',
      status: 'APPROVED',
    } as any)

    await expect(
      approveSettlement({ settlementId: 'sr-1', approvedBy: 'admin-1' })
    ).rejects.toThrow('Cannot approve settlement in status APPROVED')
  })
})

describe('declineSettlement', () => {
  it('updates status to DECLINED with reason', async () => {
    vi.mocked(db.settlementRequest.findUnique).mockResolvedValueOnce({
      id: 'sr-1',
      status: 'PENDING_APPROVAL',
    } as any)
    vi.mocked(db.settlementRequest.update).mockResolvedValueOnce({
      id: 'sr-1',
      status: 'DECLINED',
    } as any)

    await declineSettlement({
      settlementId: 'sr-1',
      declinedBy: 'admin-1',
      reason: 'Insufficient documentation',
    })

    expect(vi.mocked(db.settlementRequest.update)).toHaveBeenCalledWith({
      where: { id: 'sr-1' },
      data: expect.objectContaining({
        status: 'DECLINED',
        declinedReason: 'Insufficient documentation',
      }),
    })
  })
})

describe('executeSettlement', () => {
  it('throws if not APPROVED', async () => {
    vi.mocked(db.settlementRequest.findUnique).mockResolvedValueOnce({
      id: 'sr-1',
      status: 'PENDING_APPROVAL',
    } as any)

    await expect(
      executeSettlement({ settlementId: 'sr-1', settledBy: 'treasury-1' })
    ).rejects.toThrow('Cannot execute settlement in status PENDING_APPROVAL')
  })

  it('full execution: calls transferCredits and marks SETTLED', async () => {
    vi.mocked(db.settlementRequest.findUnique).mockResolvedValueOnce({
      id: 'sr-1',
      userId: 'user-vendor',
      amount: new Prisma.Decimal('75'),
      status: 'APPROVED',
    } as any)
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      role: 'VENDOR',
    } as any)
    vi.mocked(db.wallet.findUnique)
      .mockResolvedValueOnce({ id: 'vendor-wallet' } as any) // user wallet
      .mockResolvedValueOnce({ id: 'burn-wallet' } as any) // settlement_burn

    vi.mocked(db.settlementRequest.update).mockResolvedValueOnce({} as any)

    await executeSettlement({ settlementId: 'sr-1', settledBy: 'treasury-1' })

    expect(vi.mocked(transferCredits)).toHaveBeenCalledWith(
      expect.objectContaining({
        fromWalletId: 'vendor-wallet',
        toWalletId: 'burn-wallet',
        type: 'VENDOR_SETTLEMENT',
      })
    )

    expect(vi.mocked(db.settlementRequest.update)).toHaveBeenCalledWith({
      where: { id: 'sr-1' },
      data: expect.objectContaining({
        status: 'SETTLED',
        transactionId: 'tx-settle-123',
      }),
    })
  })

  it('RESIDENT user gets RESIDENT_SETTLEMENT type', async () => {
    vi.mocked(db.settlementRequest.findUnique).mockResolvedValueOnce({
      id: 'sr-2',
      userId: 'user-resident',
      amount: new Prisma.Decimal('50'),
      status: 'APPROVED',
    } as any)
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({ role: 'RESIDENT' } as any)
    vi.mocked(db.wallet.findUnique)
      .mockResolvedValueOnce({ id: 'resident-wallet' } as any)
      .mockResolvedValueOnce({ id: 'burn-wallet' } as any)
    vi.mocked(db.settlementRequest.update).mockResolvedValueOnce({} as any)

    await executeSettlement({ settlementId: 'sr-2', settledBy: 'treasury-1' })

    expect(vi.mocked(transferCredits)).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'RESIDENT_SETTLEMENT' })
    )
  })
})
