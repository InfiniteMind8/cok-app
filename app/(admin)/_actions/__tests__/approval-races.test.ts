import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  denyIfVisitor: vi.fn(),
  revalidatePath: vi.fn(),
  transaction: vi.fn(),
  voucherUpdateMany: vi.fn(),
  voucherFindUnique: vi.fn(),
  voucherFindUniqueOrThrow: vi.fn(),
  transferUpdateMany: vi.fn(),
  transferFindUnique: vi.fn(),
  transferFindUniqueOrThrow: vi.fn(),
  propertyOwnershipUpdateMany: vi.fn(),
  extensionUpdateMany: vi.fn(),
  extensionFindUnique: vi.fn(),
  extensionFindUniqueOrThrow: vi.fn(),
  tenancyUpdate: vi.fn(),
  voteOptionFindUnique: vi.fn(),
  voteSubmissionCreate: vi.fn(),
  userFindUnique: vi.fn(),
  auditCreate: vi.fn(),
  notify: vi.fn(),
  notifyAllOfRole: vi.fn(),
  sendEmail: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))

vi.mock('@/lib/auth', () => ({
  requireRole: mocks.requireRole,
  denyIfVisitor: mocks.denyIfVisitor,
}))

vi.mock('@/lib/db', () => ({
  db: {
    voucherRequest: {
      updateMany: mocks.voucherUpdateMany,
      findUnique: mocks.voucherFindUnique,
      findUniqueOrThrow: mocks.voucherFindUniqueOrThrow,
    },
    propertyTransferRequest: {
      updateMany: mocks.transferUpdateMany,
      findUnique: mocks.transferFindUnique,
      findUniqueOrThrow: mocks.transferFindUniqueOrThrow,
    },
    propertyOwnership: {
      updateMany: mocks.propertyOwnershipUpdateMany,
    },
    rentalExtensionRequest: {
      updateMany: mocks.extensionUpdateMany,
      findUnique: mocks.extensionFindUnique,
      findUniqueOrThrow: mocks.extensionFindUniqueOrThrow,
    },
    propertyTenancy: {
      update: mocks.tenancyUpdate,
    },
    voteOption: {
      findUnique: mocks.voteOptionFindUnique,
    },
    voteSubmission: {
      create: mocks.voteSubmissionCreate,
    },
    user: {
      findUnique: mocks.userFindUnique,
    },
    auditLog: {
      create: mocks.auditCreate,
    },
    $transaction: mocks.transaction,
  },
}))

vi.mock('@/lib/email/service', () => ({ sendEmail: mocks.sendEmail }))
vi.mock('@/lib/notifications/service', () => ({
  notify: mocks.notify,
  notifyAllOfRole: mocks.notifyAllOfRole,
}))

import { approveVoucherRequestAction } from '../voucher-requests'
import { approveTransferAction } from '../property-transfers'
import { approveExtensionAction } from '../rental-extensions'
import { castVoteAction } from '../../../(resident)/_actions/community'

const ADMIN = { id: 'admin-1', role: 'MASTER_ADMIN', email: 'admin@test.com', fullName: 'Admin' }
const RESIDENT = { id: 'resident-1', role: 'RESIDENT', email: 'resident@test.com', fullName: 'Resident' }

const VOUCHER_REQUEST = {
  id: 'voucher-1',
  recipientId: 'resident-1',
  requestedBy: 'admin-1',
  amountKcrd: new Prisma.Decimal('100'),
  description: 'Welcome',
  message: null,
  expiresAt: null,
  status: 'APPROVED',
  declinedReason: null,
  voucherCode: 'KCRD-AAAAAAAA',
}

const TRANSFER_REQUEST = {
  id: 'transfer-1',
  propertyId: 'property-1',
  fromUserId: 'owner-old',
  toUserId: 'owner-new',
  requestedBy: 'admin-1',
  status: 'APPROVED',
  notes: null,
  declinedReason: null,
  property: { code: 'PROP-001', address: '1 Karis Way' },
}

const TENANCY = {
  id: 'tenancy-1',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2026-06-30'),
  cycleUnit: 'MONTHLY',
  leaseStatus: 'ACTIVE',
  property: { code: 'PROP-001' },
}

const EXTENSION_REQUEST = {
  id: 'extension-1',
  tenancyId: 'tenancy-1',
  requestedById: 'resident-1',
  requestedNewEndDate: new Date('2027-01-01'),
  reason: 'Need more time',
  status: 'APPROVED',
  reviewedById: 'admin-1',
  reviewedAt: new Date('2026-01-01'),
  decisionNote: null,
  tenancy: TENANCY,
  requestedBy: { id: 'resident-1', email: 'resident@test.com', fullName: 'Resident' },
}

function useDefaultTransaction() {
  mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    const tx = {
      voucherRequest: {
        updateMany: mocks.voucherUpdateMany,
        findUnique: mocks.voucherFindUnique,
        findUniqueOrThrow: mocks.voucherFindUniqueOrThrow,
      },
      propertyTransferRequest: {
        updateMany: mocks.transferUpdateMany,
        findUnique: mocks.transferFindUnique,
        findUniqueOrThrow: mocks.transferFindUniqueOrThrow,
      },
      propertyOwnership: {
        updateMany: mocks.propertyOwnershipUpdateMany,
      },
      rentalExtensionRequest: {
        updateMany: mocks.extensionUpdateMany,
        findUnique: mocks.extensionFindUnique,
        findUniqueOrThrow: mocks.extensionFindUniqueOrThrow,
      },
      propertyTenancy: {
        update: mocks.tenancyUpdate,
      },
      voteOption: {
        findUnique: mocks.voteOptionFindUnique,
      },
      voteSubmission: {
        create: mocks.voteSubmissionCreate,
      },
      auditLog: {
        create: mocks.auditCreate,
      },
    }
    return fn(tx)
  })
}

describe('approval race regressions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRole.mockResolvedValue(ADMIN)
    mocks.denyIfVisitor.mockResolvedValue(undefined)
    mocks.userFindUnique.mockResolvedValue({ email: 'resident@test.com', fullName: 'Resident' })
    mocks.auditCreate.mockResolvedValue({})
    mocks.notify.mockResolvedValue(undefined)
    mocks.notifyAllOfRole.mockResolvedValue(undefined)
    mocks.sendEmail.mockResolvedValue({ ok: true, messageId: 'email-1' })
    mocks.propertyOwnershipUpdateMany.mockResolvedValue({ count: 1 })
    mocks.tenancyUpdate.mockResolvedValue({})
    useDefaultTransaction()
  })

  it('allows only one concurrent voucher approval to win', async () => {
    mocks.voucherUpdateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 })
    mocks.voucherFindUnique.mockResolvedValue({ status: 'APPROVED' })
    mocks.voucherFindUniqueOrThrow.mockResolvedValue(VOUCHER_REQUEST)

    const results = await Promise.allSettled([
      approveVoucherRequestAction('voucher-1'),
      approveVoucherRequestAction('voucher-1'),
    ])

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
    expect(
      (results.find((result) => result.status === 'rejected') as PromiseRejectedResult).reason
        .message,
    ).toContain('already processed')
    expect(mocks.auditCreate).toHaveBeenCalledTimes(1)
    expect(mocks.notify).toHaveBeenCalledTimes(1)
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1)
  })

  it('rolls back property-transfer approval when ownership reassignment fails', async () => {
    let transferStatus = 'PENDING'

    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const previousStatus = transferStatus
      const tx = {
        propertyTransferRequest: {
          updateMany: vi.fn().mockImplementation(async ({ where, data }) => {
            if (where.id === 'transfer-1' && where.status === transferStatus) {
              transferStatus = data.status
              return { count: 1 }
            }
            return { count: 0 }
          }),
          findUnique: mocks.transferFindUnique,
          findUniqueOrThrow: mocks.transferFindUniqueOrThrow,
        },
        propertyOwnership: {
          updateMany: mocks.propertyOwnershipUpdateMany,
        },
        auditLog: {
          create: mocks.auditCreate,
        },
      }

      try {
        return await fn(tx)
      } catch (error) {
        transferStatus = previousStatus
        throw error
      }
    })
    mocks.transferFindUniqueOrThrow.mockResolvedValue(TRANSFER_REQUEST)
    mocks.propertyOwnershipUpdateMany.mockRejectedValue(new Error('ownership write failed'))

    await expect(approveTransferAction('transfer-1')).rejects.toThrow('ownership write failed')
    expect(transferStatus).toBe('PENDING')
    expect(mocks.auditCreate).not.toHaveBeenCalled()
    expect(mocks.notify).not.toHaveBeenCalled()
    expect(mocks.sendEmail).not.toHaveBeenCalled()
  })

  it('allows only one concurrent rental-extension approval to win', async () => {
    mocks.extensionUpdateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 })
    mocks.extensionFindUnique.mockResolvedValue({ status: 'APPROVED' })
    mocks.extensionFindUniqueOrThrow.mockResolvedValue(EXTENSION_REQUEST)

    const results = await Promise.allSettled([
      approveExtensionAction({ requestId: 'extension-1' }),
      approveExtensionAction({ requestId: 'extension-1' }),
    ])

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
    expect(
      (results.find((result) => result.status === 'rejected') as PromiseRejectedResult).reason
        .message,
    ).toContain('already processed')
    expect(mocks.tenancyUpdate).toHaveBeenCalledTimes(1)
    expect(mocks.auditCreate).toHaveBeenCalledTimes(1)
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1)
  })

  it('rejects a vote option that belongs to a different vote', async () => {
    mocks.requireRole.mockResolvedValue(RESIDENT)
    mocks.voteOptionFindUnique.mockResolvedValue({
      voteId: 'vote-c',
      vote: { isOpen: true },
    })

    await expect(castVoteAction('vote-a', 'option-b')).rejects.toThrow('Invalid vote option')
    expect(mocks.voteSubmissionCreate).not.toHaveBeenCalled()
    expect(mocks.revalidatePath).not.toHaveBeenCalledWith('/community')
  })
})
