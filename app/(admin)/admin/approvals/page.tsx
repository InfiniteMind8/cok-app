import { Suspense } from 'react'
import { ClipboardList, UserCheck } from 'lucide-react'
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
import { format } from 'date-fns'
import {
  ApproveSettlementDialog,
  DeclineSettlementDialog,
} from './_components/settlement-dialogs'

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

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'settlements' } = await searchParams

  const pendingCount = await db.settlementRequest.count({
    where: { status: 'PENDING_APPROVAL' },
  })

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
            {pendingCount > 0 && (
              <Badge
                variant="secondary"
                className="text-xs h-5 min-w-5 px-1.5 bg-karis-gold-500/20 text-karis-green-900"
              >
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="upgrades" className="font-body text-sm">
            Account Upgrades
          </TabsTrigger>
          <TabsTrigger value="property" className="font-body text-sm">
            Property Updates
          </TabsTrigger>
          <TabsTrigger value="vendor" className="font-body text-sm">
            Vendor Items
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

        <TabsContent value="upgrades">
          <EmptyState
            icon={UserCheck}
            title="No upgrade requests"
            body="Visitor-to-Resident upgrade requests will appear here. The request mechanism is coming in Phase 2."
          />
        </TabsContent>

        <TabsContent value="property">
          <EmptyState
            icon={ClipboardList}
            title="Property update approvals"
            body="Property change requests from owners will appear here in Phase 2."
          />
        </TabsContent>

        <TabsContent value="vendor">
          <EmptyState
            icon={ClipboardList}
            title="Vendor item approvals"
            body="Vendor product and service submissions will appear here in Phase 2."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
