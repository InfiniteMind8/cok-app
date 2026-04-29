import { Suspense } from 'react'
import { ClipboardList, ArrowRightLeft, Gift, Clock } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { KAmount } from '@/components/admin/k-amount'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { db } from '@/lib/db'
import { getWalletBalance } from '@/lib/ledger/balance'
import { Prisma } from '@prisma/client'
import { format, differenceInDays } from 'date-fns'
import {
  ApproveSettlementDialog,
  DeclineSettlementDialog,
} from './_components/settlement-dialogs'
import { TransferApprovalActions } from './_components/transfer-dialogs'
import { VoucherRequestApprovalActions } from './_components/voucher-request-dialogs'
import { RentalExtensionApprovalActions } from './_components/rental-extension-dialogs'

// ─── Settlements tab (unchanged) ──────────────────────────────────────────────

async function SettlementsTab() {
  const requests = await db.settlementRequest.findMany({
    where: { status: 'PENDING_APPROVAL' },
    orderBy: { createdAt: 'asc' },
  })

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No pending settlements"
        body="Settlement requests from members will appear here for review."
      />
    )
  }

  const settlementRows = await Promise.all(
    requests.map(async (r) => {
      const user = await db.user.findUnique({
        where: { id: r.userId },
        select: { fullName: true, memberId: true },
      })
      const wallet = await db.wallet.findUnique({ where: { userId: r.userId } })
      const eligibleBalance = wallet ? await getWalletBalance(wallet.id) : new Prisma.Decimal(0)

      return {
        id: r.id,
        userId: r.userId,
        amount: new Prisma.Decimal(r.amount).toFixed(2),
        purpose: r.purpose,
        createdAt: format(r.createdAt, 'dd MMM yyyy'),
        userName: user?.fullName ?? 'Unknown',
        memberId: user?.memberId ?? '—',
        eligibleBalance: eligibleBalance.toFixed(2),
      }
    }),
  )

  return (
    <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-karis-stone-50">
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">
              Request ID
            </TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">
              Member
            </TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">
              Amount
            </TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">
              Eligible Balance
            </TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">
              Submitted
            </TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {settlementRows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="px-5 font-body text-xs text-karis-stone-500 tabular-nums">
                {row.id.slice(0, 8)}…
              </TableCell>
              <TableCell className="px-5">
                <div className="font-body text-sm text-karis-stone-900">{row.userName}</div>
                <div className="font-body text-xs text-karis-stone-500">{row.memberId}</div>
              </TableCell>
              <TableCell className="px-5 text-right">
                <KAmount amount={row.amount} />
              </TableCell>
              <TableCell className="px-5 text-right">
                <KAmount amount={row.eligibleBalance} />
              </TableCell>
              <TableCell className="px-5 font-body text-sm text-karis-stone-500">
                {row.createdAt}
              </TableCell>
              <TableCell className="px-5">
                <div className="flex items-center gap-2">
                  <ApproveSettlementDialog settlement={row} />
                  <DeclineSettlementDialog settlement={row} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ─── Property Transfers tab ───────────────────────────────────────────────────

async function PropertyTransfersTab() {
  const requests = await db.propertyTransferRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: {
      property: { select: { code: true, address: true } },
    },
  })

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={ArrowRightLeft}
        title="No pending transfers"
        body="Property transfer requests will appear here for review."
      />
    )
  }

  const rows = await Promise.all(
    requests.map(async (r) => {
      const [fromUser, toUser] = await Promise.all([
        db.user.findUnique({ where: { id: r.fromUserId }, select: { fullName: true, memberId: true } }),
        db.user.findUnique({ where: { id: r.toUserId }, select: { fullName: true, memberId: true } }),
      ])
      return {
        id: r.id,
        propertyCode: r.property.code,
        propertyAddress: r.property.address,
        fromUser: fromUser ?? { fullName: 'Unknown', memberId: '—' },
        toUser: toUser ?? { fullName: 'Unknown', memberId: '—' },
        createdAt: format(r.createdAt, 'dd MMM yyyy'),
      }
    }),
  )

  return (
    <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-karis-stone-50">
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Property</TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">From</TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">To</TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Submitted</TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="px-5">
                <div className="font-body text-sm font-medium text-karis-stone-900 tabular-nums">{row.propertyCode}</div>
                {row.propertyAddress && (
                  <div className="font-body text-xs text-karis-stone-500">{row.propertyAddress}</div>
                )}
              </TableCell>
              <TableCell className="px-5">
                <div className="font-body text-sm text-karis-stone-900">{row.fromUser.fullName}</div>
                <div className="font-body text-xs text-karis-stone-500">{row.fromUser.memberId}</div>
              </TableCell>
              <TableCell className="px-5">
                <div className="font-body text-sm text-karis-stone-900">{row.toUser.fullName}</div>
                <div className="font-body text-xs text-karis-stone-500">{row.toUser.memberId}</div>
              </TableCell>
              <TableCell className="px-5 font-body text-sm text-karis-stone-500">{row.createdAt}</TableCell>
              <TableCell className="px-5">
                <TransferApprovalActions
                  row={{
                    id: row.id,
                    propertyCode: row.propertyCode,
                    fromUserName: row.fromUser.fullName,
                    toUserName: row.toUser.fullName,
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ─── Vouchers tab ─────────────────────────────────────────────────────────────

async function VouchersTab() {
  const requests = await db.voucherRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
  })

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={Gift}
        title="No pending voucher requests"
        body="Voucher issuance requests will appear here for approval."
      />
    )
  }

  const rows = await Promise.all(
    requests.map(async (r) => {
      const recipient = await db.user.findUnique({
        where: { id: r.recipientId },
        select: { fullName: true, memberId: true },
      })
      return {
        id: r.id,
        amount: new Prisma.Decimal(r.amountKcrd).toFixed(2),
        description: r.description ?? r.message ?? null,
        expiresAt: r.expiresAt ? format(r.expiresAt, 'dd MMM yyyy') : null,
        createdAt: format(r.createdAt, 'dd MMM yyyy'),
        recipient: recipient ?? { fullName: 'Unknown', memberId: '—' },
      }
    }),
  )

  return (
    <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-karis-stone-50">
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Recipient</TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">Amount</TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Description</TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Expires</TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Submitted</TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="px-5">
                <div className="font-body text-sm text-karis-stone-900">{row.recipient.fullName}</div>
                <div className="font-body text-xs text-karis-stone-500">{row.recipient.memberId}</div>
              </TableCell>
              <TableCell className="px-5 text-right">
                <KAmount amount={row.amount} />
              </TableCell>
              <TableCell className="px-5 font-body text-sm text-karis-stone-500 max-w-[200px] truncate">
                {row.description ?? '—'}
              </TableCell>
              <TableCell className="px-5 font-body text-sm text-karis-stone-500">
                {row.expiresAt ?? 'No expiry'}
              </TableCell>
              <TableCell className="px-5 font-body text-sm text-karis-stone-500">{row.createdAt}</TableCell>
              <TableCell className="px-5">
                <VoucherRequestApprovalActions
                  row={{ id: row.id, amount: row.amount, recipientName: row.recipient.fullName }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ─── Rental Extensions tab ────────────────────────────────────────────────────

async function RentalExtensionsTab() {
  const requests = await db.rentalExtensionRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: {
      tenancy: {
        include: { property: { select: { code: true, address: true } } },
      },
      requestedBy: { select: { fullName: true, memberId: true } },
    },
  })

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No pending extension requests"
        body="Rental extension requests from residents will appear here for review."
      />
    )
  }

  const rows = requests.map((r) => {
    const currentEnd = r.tenancy.endDate
    const requestedEnd = r.requestedNewEndDate
    const deltaDays = currentEnd ? differenceInDays(requestedEnd, currentEnd) : null

    return {
      id: r.id,
      requesterName: r.requestedBy.fullName,
      requesterMemberId: r.requestedBy.memberId,
      propertyCode: r.tenancy.property.code,
      propertyAddress: r.tenancy.property.address,
      currentEnd: currentEnd ? format(currentEnd, 'dd MMM yyyy') : '—',
      requestedEnd: format(requestedEnd, 'dd MMM yyyy'),
      deltaDays: deltaDays ?? 0,
      reason: r.reason,
      createdAt: format(r.createdAt, 'dd MMM yyyy'),
    }
  })

  return (
    <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-karis-stone-50">
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Requester</TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Property</TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Current end</TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Requested end</TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Reason</TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Submitted</TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="px-5">
                <div className="font-body text-sm text-karis-stone-900">{row.requesterName}</div>
                <div className="font-body text-xs text-karis-stone-500">{row.requesterMemberId}</div>
              </TableCell>
              <TableCell className="px-5">
                <div className="font-body text-sm font-medium text-karis-stone-900 tabular-nums">{row.propertyCode}</div>
                {row.propertyAddress && (
                  <div className="font-body text-xs text-karis-stone-500">{row.propertyAddress}</div>
                )}
              </TableCell>
              <TableCell className="px-5 font-body text-sm text-karis-stone-500">{row.currentEnd}</TableCell>
              <TableCell className="px-5">
                <div className="font-body text-sm text-karis-stone-900">{row.requestedEnd}</div>
                {row.deltaDays > 0 && (
                  <div className="font-body text-xs text-karis-stone-400">+{row.deltaDays} days</div>
                )}
              </TableCell>
              <TableCell className="px-5 font-body text-sm text-karis-stone-500 max-w-[200px] truncate">
                {row.reason ?? '—'}
              </TableCell>
              <TableCell className="px-5 font-body text-sm text-karis-stone-500">{row.createdAt}</TableCell>
              <TableCell className="px-5">
                <RentalExtensionApprovalActions
                  row={{
                    id: row.id,
                    requesterName: row.requesterName,
                    propertyCode: row.propertyCode,
                    currentEnd: row.currentEnd,
                    requestedEnd: row.requestedEnd,
                    deltaDays: row.deltaDays,
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'settlements' } = await searchParams

  const [settlementCount, transferCount, voucherCount, extensionCount] = await Promise.all([
    db.settlementRequest.count({ where: { status: 'PENDING_APPROVAL' } }),
    db.propertyTransferRequest.count({ where: { status: 'PENDING' } }),
    db.voucherRequest.count({ where: { status: 'PENDING' } }),
    db.rentalExtensionRequest.count({ where: { status: 'PENDING' } }),
  ])

  return (
    <div className="p-8 max-w-7xl">
      <PageHeader
        title="Approvals"
        subtitle="Review and action pending requests from members."
      />

      <Tabs defaultValue={tab}>
        <TabsList className="mb-6">
          <TabsTrigger value="settlements" className="font-body text-sm gap-2">
            Settlements
            {settlementCount > 0 && (
              <Badge
                variant="secondary"
                className="text-xs h-5 min-w-5 px-1.5 bg-karis-gold-500/20 text-karis-green-900"
              >
                {settlementCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="property-transfers" className="font-body text-sm gap-2">
            Property Transfers
            {transferCount > 0 && (
              <Badge
                variant="secondary"
                className="text-xs h-5 min-w-5 px-1.5 bg-karis-gold-500/20 text-karis-green-900"
              >
                {transferCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="vouchers" className="font-body text-sm gap-2">
            Vouchers
            {voucherCount > 0 && (
              <Badge
                variant="secondary"
                className="text-xs h-5 min-w-5 px-1.5 bg-karis-gold-500/20 text-karis-green-900"
              >
                {voucherCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rental-extensions" className="font-body text-sm gap-2">
            Rental Extensions
            {extensionCount > 0 && (
              <Badge
                variant="secondary"
                className="text-xs h-5 min-w-5 px-1.5 bg-karis-gold-500/20 text-karis-green-900"
              >
                {extensionCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settlements">
          <Suspense
            fallback={
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            }
          >
            <SettlementsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="property-transfers">
          <Suspense
            fallback={
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            }
          >
            <PropertyTransfersTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="vouchers">
          <Suspense
            fallback={
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            }
          >
            <VouchersTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="rental-extensions">
          <Suspense
            fallback={
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            }
          >
            <RentalExtensionsTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
