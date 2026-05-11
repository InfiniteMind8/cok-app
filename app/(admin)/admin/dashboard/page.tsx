import { Suspense } from 'react'
import {
  Coins,
  Users,
  ClipboardList,
  AlertTriangle,
  Vault,
  Sprout,
} from 'lucide-react'
import { StatCard } from '@/components/admin/stat-card'
import { PageHeader } from '@/components/admin/page-header'
import { KAmount } from '@/components/admin/k-amount'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { adminDashboardApi } from '@/lib/api'
import { getServerApi } from '@/lib/api/server'
import { Prisma } from '@/lib/prisma-shim'

function roleName(role: string) {
  const map: Record<string, string> = {
    MASTER_ADMIN: 'Master Admin',
    ADMIN: 'Admin',
    VENDOR: 'Vendor',
    RESIDENT: 'Resident',
    VISITOR: 'Visitor',
  }
  return map[role] ?? role
}

async function DashboardContent() {
  const data = await adminDashboardApi.get(getServerApi())

  const totalDeposits = data.flowByRole.reduce(
    (acc, r) => acc.add(r.totalDeposits),
    new Prisma.Decimal(0),
  )
  const totalSettlements = data.flowByRole.reduce(
    (acc, r) => acc.add(r.totalSettlements),
    new Prisma.Decimal(0),
  )

  const treasuryBalance = new Prisma.Decimal(data.treasuryReserve)
  const communityBalance = new Prisma.Decimal(data.communityFund)
  const circulatingCredits = new Prisma.Decimal(data.totalCirculating)

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      <PageHeader
        title="Dashboard"
        subtitle="Treasury overview, pending activity, and community metrics."
      />

      {/* Treasury hero cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-karis-green-900 text-white rounded-xl p-6 border-l-4 border-l-karis-gold-500 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-body text-karis-stone-300 uppercase tracking-wider mb-1">
                Treasury Reserve
              </p>
              <p className="text-3xl font-heading tabular-nums">
                <span className="text-karis-gold-300">K </span>
                {treasuryBalance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </p>
              <p className="text-xs text-karis-stone-300 font-body mt-1">
                Fiat backing of all issued K Credits
              </p>
            </div>
            <Vault size={28} className="text-karis-gold-500 mt-0.5 shrink-0" />
          </div>
        </div>

        <div className="bg-white border border-karis-stone-100 rounded-xl p-6 border-l-4 border-l-karis-gold-500 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-body text-karis-stone-500 uppercase tracking-wider mb-1">
                Community Investment Fund
              </p>
              <p className="text-3xl font-heading tabular-nums text-karis-green-900">
                <span className="text-karis-gold-700">K </span>
                {communityBalance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </p>
              <p className="text-xs text-karis-stone-500 font-body mt-1">
                Fee-accumulated community capital
              </p>
            </div>
            <Sprout size={28} className="text-karis-gold-500 mt-0.5 shrink-0" />
          </div>
          <div className="mt-4">
            <Button variant="outline" size="sm" className="text-xs font-body" disabled>
              Disburse (Phase 2)
            </Button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Credits in Circulation"
          value={`K ${circulatingCredits.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`}
          icon={Coins}
          accent="gold"
        />
        <StatCard
          title="Active Members"
          value={data.activeMembers.toLocaleString()}
          sub="accounts with ACTIVE status"
          icon={Users}
          accent="green"
        />
        <StatCard
          title="Pending Approvals"
          value={data.pendingApprovals.toLocaleString()}
          sub="awaiting review"
          icon={ClipboardList}
          href="/admin/approvals"
          accent={data.pendingApprovals > 0 ? 'orange' : 'green'}
        />
        <StatCard
          title="Open Issues"
          value={data.openIssues.toLocaleString()}
          sub="open or in progress"
          icon={AlertTriangle}
          href="/admin/community?tab=issues"
          accent={data.openIssues > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Treasury flow by user type */}
      <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-karis-stone-100">
          <h2 className="font-heading text-lg text-karis-green-900">Treasury Flow by User Type</h2>
          <p className="text-xs font-body text-karis-stone-500 mt-0.5">
            Lifetime deposits and approved/settled settlements per role
          </p>
        </div>
        {data.flowByRole.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-body text-karis-stone-500">
              No transactions yet. Activity will appear here.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-karis-stone-50">
                <TableHead className="px-6 font-body text-xs uppercase tracking-wider text-karis-stone-500">
                  Role
                </TableHead>
                <TableHead className="px-6 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">
                  Deposits Total
                </TableHead>
                <TableHead className="px-6 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">
                  Settlements Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.flowByRole.map((row) => (
                <TableRow key={row.role}>
                  <TableCell className="px-6 font-body text-karis-stone-900">
                    {roleName(row.role)}
                  </TableCell>
                  <TableCell className="px-6 text-right">
                    <KAmount amount={row.totalDeposits} />
                  </TableCell>
                  <TableCell className="px-6 text-right">
                    <KAmount amount={row.totalSettlements} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-karis-stone-50 font-medium">
                <TableCell className="px-6 font-body text-karis-green-900">Total</TableCell>
                <TableCell className="px-6 text-right">
                  <KAmount amount={totalDeposits} className="font-medium" />
                </TableCell>
                <TableCell className="px-6 text-right">
                  <KAmount amount={totalSettlements} className="font-medium" />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </div>

      {/* Credits in wallets by role */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-karis-stone-100">
            <h2 className="font-heading text-lg text-karis-green-900">K Credits in Wallets</h2>
            <p className="text-xs font-body text-karis-stone-500 mt-0.5">
              Current circulating balance by member role
            </p>
          </div>
          {data.creditsByRole.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-body text-karis-stone-500">
                No wallet activity yet. Activity will appear here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-karis-stone-50">
                  <TableHead className="px-6 font-body text-xs uppercase tracking-wider text-karis-stone-500">
                    Role
                  </TableHead>
                  <TableHead className="px-6 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">
                    Members
                  </TableHead>
                  <TableHead className="px-6 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">
                    Total Balance
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.creditsByRole.map((row) => (
                  <TableRow key={row.role}>
                    <TableCell className="px-6 font-body text-karis-stone-900">
                      {roleName(row.role)}
                    </TableCell>
                    <TableCell className="px-6 text-right font-body text-karis-stone-500 tabular-nums">
                      {row.memberCount}
                    </TableCell>
                    <TableCell className="px-6 text-right">
                      <KAmount amount={row.totalBalance} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* System wallets summary */}
        <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-karis-stone-100">
            <h2 className="font-heading text-lg text-karis-green-900">System Wallets</h2>
            <p className="text-xs font-body text-karis-stone-500 mt-0.5">
              Reserve, fee pools, and settlement burn
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-karis-stone-50">
                <TableHead className="px-6 font-body text-xs uppercase tracking-wider text-karis-stone-500">
                  Wallet
                </TableHead>
                <TableHead className="px-6 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">
                  Balance
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.systemWallets.map((w) => (
                <TableRow key={w.key}>
                  <TableCell className="px-6 font-body text-karis-stone-900">
                    {w.key.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell className="px-6 text-right">
                    <KAmount amount={w.balance} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="p-8 space-y-8 max-w-7xl">
      <div className="space-y-1">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
