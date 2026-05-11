import { Suspense } from 'react'
import { ClipboardList, ArrowRightLeft, Gift, Clock } from 'lucide-react'
import { format, differenceInDays, parseISO } from 'date-fns'
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
import { adminApprovalsApi } from '@/lib/api'
import { getServerApi } from '@/lib/api/server'
import {
  ApproveSettlementDialog,
  DeclineSettlementDialog,
} from './_components/settlement-dialogs'
import { TransferApprovalActions } from './_components/transfer-dialogs'
import { VoucherRequestApprovalActions } from './_components/voucher-request-dialogs'
import { RentalExtensionApprovalActions } from './_components/rental-extension-dialogs'

// ─── Settlements tab ──────────────────────────────────────────────────────────

async function SettlementsTab() {
  const settlementRows = await adminApprovalsApi.listSettlements(getServerApi())

  if (settlementRows.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No pending settlements"
        body="Settlement requests from members will appear here for review."
      />
    )
  }

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
                {format(parseISO(row.createdAt), 'dd MMM yyyy')}
              </TableCell>
              <TableCell className="px-5">
                <div className="flex items-center gap-2">
                  <ApproveSettlementDialog
                    settlement={{
                      id: row.id,
                      userId: row.userId,
                      amount: row.amount,
                      purpose: row.purpose,
                      createdAt: row.createdAt,
                      userName: row.userName,
                      memberId: row.memberId,
                      eligibleBalance: row.eligibleBalance,
                    }}
                  />
                  <DeclineSettlementDialog
                    settlement={{
                      id: row.id,
                      userId: row.userId,
                      amount: row.amount,
                      purpose: row.purpose,
                      createdAt: row.createdAt,
                      userName: row.userName,
                      memberId: row.memberId,
                      eligibleBalance: row.eligibleBalance,
                    }}
                  />
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
  const rows = await adminApprovalsApi.listPropertyTransfers(getServerApi())

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={ArrowRightLeft}
        title="No pending transfers"
        body="Property transfer requests will appear here for review."
      />
    )
  }

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
              <TableCell className="px-5 font-body text-sm text-karis-stone-500">
                {format(parseISO(row.createdAt), 'dd MMM yyyy')}
              </TableCell>
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
  const rows = await adminApprovalsApi.listVoucherRequests(getServerApi())

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Gift}
        title="No pending voucher requests"
        body="Voucher issuance requests will appear here for approval."
      />
    )
  }

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
                {row.expiresAt ? format(parseISO(row.expiresAt), 'dd MMM yyyy') : 'No expiry'}
              </TableCell>
              <TableCell className="px-5 font-body text-sm text-karis-stone-500">
                {format(parseISO(row.createdAt), 'dd MMM yyyy')}
              </TableCell>
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
  const requests = await adminApprovalsApi.listRentalExtensions(getServerApi())

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
    const currentEnd = r.currentEnd ? parseISO(r.currentEnd) : null
    const requestedEnd = parseISO(r.requestedEnd)
    const deltaDays = currentEnd ? differenceInDays(requestedEnd, currentEnd) : r.deltaDays

    return {
      id: r.id,
      requesterName: r.requesterName,
      requesterMemberId: r.requesterMemberId,
      propertyCode: r.propertyCode,
      propertyAddress: r.propertyAddress,
      currentEnd: currentEnd ? format(currentEnd, 'dd MMM yyyy') : '—',
      requestedEnd: format(requestedEnd, 'dd MMM yyyy'),
      deltaDays,
      reason: r.reason,
      createdAt: format(parseISO(r.createdAt), 'dd MMM yyyy'),
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
  const { counts } = await adminApprovalsApi.counts(getServerApi())

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
            {counts.settlements > 0 && (
              <Badge
                variant="secondary"
                className="text-xs h-5 min-w-5 px-1.5 bg-karis-gold-500/20 text-karis-green-900"
              >
                {counts.settlements}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="property-transfers" className="font-body text-sm gap-2">
            Property Transfers
            {counts.transfers > 0 && (
              <Badge
                variant="secondary"
                className="text-xs h-5 min-w-5 px-1.5 bg-karis-gold-500/20 text-karis-green-900"
              >
                {counts.transfers}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="vouchers" className="font-body text-sm gap-2">
            Vouchers
            {counts.vouchers > 0 && (
              <Badge
                variant="secondary"
                className="text-xs h-5 min-w-5 px-1.5 bg-karis-gold-500/20 text-karis-green-900"
              >
                {counts.vouchers}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rental-extensions" className="font-body text-sm gap-2">
            Rental Extensions
            {counts.extensions > 0 && (
              <Badge
                variant="secondary"
                className="text-xs h-5 min-w-5 px-1.5 bg-karis-gold-500/20 text-karis-green-900"
              >
                {counts.extensions}
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
