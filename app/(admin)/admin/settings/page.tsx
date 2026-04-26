import 'server-only'
import { format } from 'date-fns'
import { Settings, Wallet, Activity } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { KAmount } from '@/components/admin/k-amount'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { getSystemWalletSummary } from '@/lib/queries/dashboard'
import { getActiveFeeSchedule } from '@/lib/ledger/fee-engine'
import { db } from '@/lib/db'
import type { FeeScheduleRules } from '@/lib/ledger/types'
import { Prisma } from '@prisma/client'

const SYSTEM_KEY_LABELS: Record<string, string> = {
  treasury_reserve: 'Treasury Reserve',
  community_fund: 'Community Fund',
  operations_fund: 'Operations Fund',
  developer_share: 'Developer Share',
  settlement_burn: 'Settlement Burn',
}

async function getRecentAdminActivity() {
  const adminUsers = await db.user.findMany({
    where: { role: { in: ['MASTER_ADMIN', 'ADMIN'] } },
    select: { id: true, fullName: true, memberId: true },
  })
  const adminIds = adminUsers.map((u) => u.id)
  const nameMap = new Map(adminUsers.map((u) => [u.id, u.fullName]))

  const transactions = await db.transaction.findMany({
    where: { initiatedBy: { in: adminIds } },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      entries: {
        where: { amount: { gt: 0 } },
        select: { amount: true },
      },
    },
  })

  return transactions.map((t) => {
    const total = t.entries.reduce(
      (sum, e) => sum.add(e.amount),
      new Prisma.Decimal(0),
    )
    return {
      id: t.id,
      type: t.type,
      description: t.description,
      total,
      createdAt: t.createdAt,
      initiatedByName: t.initiatedBy ? (nameMap.get(t.initiatedBy) ?? 'Unknown') : '—',
    }
  })
}

export default async function SettingsPage() {
  const [feeSchedule, systemWallets, recentActivity] = await Promise.all([
    getActiveFeeSchedule(),
    getSystemWalletSummary(),
    getRecentAdminActivity(),
  ])

  const rules = (feeSchedule?.rules ?? {}) as FeeScheduleRules
  const ruleEntries = Object.entries(rules) as [string, { totalPct: number; communityFundPct: number; operationsFundPct: number; developerSharePct: number }][]

  return (
    <div className="p-8 max-w-5xl space-y-10">
      <PageHeader
        title="Settings"
        subtitle="Fee schedule, system wallets, and admin activity."
      />

      {/* ─── Active Fee Schedule ──────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Settings size={15} className="text-karis-stone-500" />
          <h2 className="font-heading text-base text-karis-green-900">Active Fee Schedule</h2>
        </div>
        {!feeSchedule ? (
          <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm p-6">
            <p className="font-body text-sm text-karis-stone-500">No fee schedule configured.</p>
          </div>
        ) : (
          <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-karis-stone-50 border-b border-karis-stone-100 flex items-center gap-3">
              <span className="font-body text-xs text-karis-stone-500">
                Effective {format(feeSchedule.effectiveAt, 'dd MMM yyyy')}
              </span>
              <Badge variant="secondary" className="font-body text-xs bg-status-green/15 text-status-green">
                Active
              </Badge>
            </div>
            {ruleEntries.length === 0 ? (
              <div className="p-5">
                <p className="font-body text-sm text-karis-stone-500">No fee rules defined.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-karis-stone-50">
                    <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Transaction Type</TableHead>
                    <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">Total %</TableHead>
                    <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">Community Fund %</TableHead>
                    <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">Operations %</TableHead>
                    <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">Developer %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ruleEntries.map(([type, rule]) => (
                    <TableRow key={type}>
                      <TableCell className="px-5 font-body text-sm text-karis-stone-900">
                        {type.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="px-5 font-body text-sm text-karis-stone-700 text-right tabular-nums">
                        {rule.totalPct}%
                      </TableCell>
                      <TableCell className="px-5 font-body text-sm text-karis-stone-700 text-right tabular-nums">
                        {rule.communityFundPct}%
                      </TableCell>
                      <TableCell className="px-5 font-body text-sm text-karis-stone-700 text-right tabular-nums">
                        {rule.operationsFundPct}%
                      </TableCell>
                      <TableCell className="px-5 font-body text-sm text-karis-stone-700 text-right tabular-nums">
                        {rule.developerSharePct}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="px-5 py-2.5 border-t border-karis-stone-100 bg-karis-stone-50">
              <p className="font-body text-xs text-karis-stone-400">
                New fee schedules are applied via a migration (change is rare). Contact the dev team to update.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ─── System Wallets ───────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={15} className="text-karis-stone-500" />
          <h2 className="font-heading text-base text-karis-green-900">System Wallets</h2>
        </div>
        <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-karis-stone-50">
                <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Wallet</TableHead>
                <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">System Key</TableHead>
                <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {systemWallets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="px-5 py-8 text-center font-body text-sm text-karis-stone-500">
                    No system wallets found.
                  </TableCell>
                </TableRow>
              ) : (
                systemWallets.map((w) => (
                  <TableRow key={w.key}>
                    <TableCell className="px-5 font-body text-sm text-karis-stone-900">
                      {SYSTEM_KEY_LABELS[w.key] ?? w.key}
                    </TableCell>
                    <TableCell className="px-5 font-body text-xs text-karis-stone-500 font-mono">
                      {w.key}
                    </TableCell>
                    <TableCell className="px-5 text-right">
                      <KAmount amount={w.balance} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* ─── Recent Admin Activity ────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Activity size={15} className="text-karis-stone-500" />
          <h2 className="font-heading text-base text-karis-green-900">Recent Admin Activity</h2>
        </div>
        <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-karis-stone-50">
                <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Type</TableHead>
                <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Description</TableHead>
                <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">Amount</TableHead>
                <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Initiated By</TableHead>
                <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-8 text-center font-body text-sm text-karis-stone-500">
                    No admin activity recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentActivity.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="px-5">
                      <Badge variant="secondary" className="font-body text-xs bg-karis-stone-100 text-karis-stone-700">
                        {t.type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 font-body text-sm text-karis-stone-700 max-w-xs truncate">
                      {t.description}
                    </TableCell>
                    <TableCell className="px-5 text-right">
                      {t.total.gt(0) ? <KAmount amount={t.total} /> : <span className="font-body text-sm text-karis-stone-400">—</span>}
                    </TableCell>
                    <TableCell className="px-5 font-body text-sm text-karis-stone-700">
                      {t.initiatedByName}
                    </TableCell>
                    <TableCell className="px-5 font-body text-sm text-karis-stone-500">
                      {format(t.createdAt, 'dd MMM yyyy · HH:mm')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  )
}
