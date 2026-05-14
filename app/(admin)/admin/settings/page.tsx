import 'server-only'
import Link from 'next/link'
import { format } from 'date-fns'
import { Wallet, Activity, DollarSign, Tag, ChevronRight, ShieldCheck } from 'lucide-react'
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
import { adminSettingsApi } from '@/lib/api'
import { getServerApi } from '@/lib/api/server'
import { Prisma } from '@/lib/prisma-shim'
import type { FeeScheduleRules } from '@/lib/ledger/types'
import { FeeScheduleEditor } from './_components/fee-schedule-editor'

const SYSTEM_KEY_LABELS: Record<string, string> = {
  treasury_reserve: 'Treasury Reserve',
  community_fund: 'Community Fund',
  operations_fund: 'Operations Fund',
  developer_share: 'Developer Share',
  settlement_burn: 'Settlement Burn',
}

export default async function SettingsPage() {
  const api = getServerApi()
  const [overview, history] = await Promise.all([
    adminSettingsApi.getOverview(api),
    adminSettingsApi.feeScheduleHistory(api),
  ])

  const { feeSchedule, systemWallets, recentActivity } = overview
  const rules = (feeSchedule?.rules ?? {}) as FeeScheduleRules

  return (
    <div className="p-8 max-w-5xl space-y-10">
      <PageHeader
        title="Settings"
        subtitle="Fee schedule, system wallets, and admin activity."
      />

      {/* ─── Sub-settings navigation ─────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/admin/settings/currency"
            className="flex items-center gap-4 bg-white border border-karis-stone-100 rounded-xl shadow-sm px-5 py-4 hover:border-karis-green-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-karis-green-50 text-karis-green-700">
              <DollarSign size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-body text-sm font-medium text-karis-stone-900">Currency Rates</div>
              <div className="font-body text-xs text-karis-stone-500">KCRD ↔ USD ↔ GYD conversion rates</div>
            </div>
            <ChevronRight size={15} className="text-karis-stone-400 group-hover:text-karis-green-600 shrink-0" />
          </Link>

          <Link
            href="/admin/settings/promotions"
            className="flex items-center gap-4 bg-white border border-karis-stone-100 rounded-xl shadow-sm px-5 py-4 hover:border-karis-green-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-karis-gold-50 text-karis-gold-700">
              <Tag size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-body text-sm font-medium text-karis-stone-900">Promotions</div>
              <div className="font-body text-xs text-karis-stone-500">Bonus K Credit incentives on conversions</div>
            </div>
            <ChevronRight size={15} className="text-karis-stone-400 group-hover:text-karis-green-600 shrink-0" />
          </Link>

          <Link
            href="/admin/treasury"
            className="flex items-center gap-4 bg-white border border-karis-stone-100 rounded-xl shadow-sm px-5 py-4 hover:border-karis-green-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-karis-green-50 text-karis-green-700">
              <ShieldCheck size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-body text-sm font-medium text-karis-stone-900">System Wallet Floors</div>
              <div className="font-body text-xs text-karis-stone-500">Configure minimum balance floors per system wallet</div>
            </div>
            <ChevronRight size={15} className="text-karis-stone-400 group-hover:text-karis-green-600 shrink-0" />
          </Link>
        </div>
      </section>

      {/* ─── Fee Schedule Editor ──────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-heading text-base text-karis-green-900">Fee Schedule</h2>
          <Badge variant="secondary" className="font-body text-xs bg-status-green/15 text-status-green ml-1">
            Active
          </Badge>
          {feeSchedule && (
            <span className="font-body text-xs text-karis-stone-400 ml-auto">
              Since {format(new Date(feeSchedule.effectiveAt), 'dd MMM yyyy')}
            </span>
          )}
        </div>
        <FeeScheduleEditor initialRules={rules} history={history} />
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
                      <KAmount amount={new Prisma.Decimal(w.balance)} />
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
                recentActivity.map((t) => {
                  const totalDecimal = new Prisma.Decimal(t.total)
                  return (
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
                        {totalDecimal.gt(0) ? <KAmount amount={totalDecimal} /> : <span className="font-body text-sm text-karis-stone-400">—</span>}
                      </TableCell>
                      <TableCell className="px-5 font-body text-sm text-karis-stone-700">
                        {t.initiatedByName}
                      </TableCell>
                      <TableCell className="px-5 font-body text-sm text-karis-stone-500">
                        {format(new Date(t.createdAt), 'dd MMM yyyy · HH:mm')}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  )
}
