import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { format, parseISO } from 'date-fns'
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
import { adminTreasuryApi } from '@/lib/api'
import { getServerApi } from '@/lib/api/server'
import { DepositSheet } from './_components/deposit-sheet'
import { TreasuryAdjustmentDialog } from './_components/treasury-adjustment-dialog'
import { ExecuteSettlementSheet } from './_components/execute-settlement-sheet'
import { WalletFloorCard } from './_components/wallet-floor-card'

export default async function TreasuryPage({
  searchParams,
}: {
  searchParams: Promise<{ depositsPage?: string }>
}) {
  const { depositsPage = '1' } = await searchParams
  const page = Math.max(1, parseInt(depositsPage, 10) || 1)
  const pageSize = 20

  const data = await adminTreasuryApi.getOverview(getServerApi(), page)
  const totalPages = Math.ceil(data.depositTotal / pageSize)

  return (
    <div className="p-8 max-w-7xl space-y-8">
      <PageHeader title="Treasury" subtitle="K Credit issuance, settlement execution, and reserve management." />

      {/* Treasury reserve card */}
      <div className="bg-karis-green-900 text-white rounded-xl p-6 shadow-sm flex items-start justify-between max-w-md">
        <div>
          <p className="text-xs font-body text-karis-stone-300 uppercase tracking-wider mb-1">
            Treasury Reserve (Fiat Backing)
          </p>
          <p className="text-3xl font-heading tabular-nums">
            <span className="text-karis-gold-300">K </span>
            {data.reserveBalance.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          </p>
          <p className="text-xs text-karis-stone-400 font-body mt-1.5">
            Ledger value of all treasury reserve entries
          </p>
        </div>
        <TreasuryAdjustmentDialog />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <DepositSheet users={data.allUsers} />
        <ExecuteSettlementSheet settlements={data.approvedSettlements} />
        <Link
          href="/admin/treasury/debug"
          className="inline-flex items-center gap-1.5 text-xs font-body text-karis-stone-500 hover:text-karis-stone-900 transition-colors px-3 py-2 border border-karis-stone-100 rounded-lg"
        >
          <ExternalLink size={13} />
          Reconciliation debug
        </Link>
      </div>

      {/* System wallet floors */}
      {data.systemWallets.length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="font-heading text-base text-karis-green-900">System Wallet Floors</h2>
            <p className="font-body text-xs text-karis-stone-500 mt-0.5">
              Configure minimum balance floors per system wallet. Transfers that would breach a floor are blocked.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.systemWallets.map((w) => (
              <WalletFloorCard
                key={w.walletId}
                walletId={w.walletId}
                walletKey={w.key}
                balance={w.balance}
                floor={w.floor}
                headroom={w.headroom}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent deposits */}
      <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-karis-stone-100 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg text-karis-green-900">Recent Deposits</h2>
            <p className="text-xs font-body text-karis-stone-500 mt-0.5">
              All fiat deposits recorded by admins
            </p>
          </div>
          {data.depositTotal > 0 && (
            <span className="text-xs font-body text-karis-stone-500 tabular-nums">
              {data.depositTotal} total
            </span>
          )}
        </div>

        {data.deposits.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-body text-karis-stone-500">
              No transactions yet. Your activity will appear here.
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-karis-stone-50">
                  <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">
                    Date
                  </TableHead>
                  <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">
                    Member
                  </TableHead>
                  <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">
                    Fiat Amount
                  </TableHead>
                  <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">
                    Currency
                  </TableHead>
                  <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">
                    Method
                  </TableHead>
                  <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">
                    K Issued
                  </TableHead>
                  <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">
                    Proof
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.deposits.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="px-5 font-body text-sm text-karis-stone-500">
                      {format(parseISO(d.createdAt), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="px-5">
                      <div className="font-body text-sm text-karis-stone-900">{d.userName}</div>
                      <div className="font-body text-xs text-karis-stone-500">{d.memberId}</div>
                    </TableCell>
                    <TableCell className="px-5 text-right font-body text-sm tabular-nums text-karis-stone-900">
                      {d.fiatAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    </TableCell>
                    <TableCell className="px-5 font-body text-sm text-karis-stone-500">
                      {d.currency}
                    </TableCell>
                    <TableCell className="px-5 font-body text-sm text-karis-stone-500">
                      {d.paymentMethod}
                    </TableCell>
                    <TableCell className="px-5 text-right">
                      <KAmount amount={d.kIssued} />
                    </TableCell>
                    <TableCell className="px-5">
                      {d.proofUrl ? (
                        <a
                          href={d.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-body text-karis-green-700 hover:underline inline-flex items-center gap-1"
                        >
                          View <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span className="text-xs font-body text-karis-stone-300">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-karis-stone-100 flex items-center justify-between">
                <span className="text-xs font-body text-karis-stone-500">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`/admin/treasury?depositsPage=${page - 1}`}
                      className="text-xs font-body text-karis-stone-500 hover:text-karis-stone-900 px-3 py-1.5 border border-karis-stone-100 rounded-lg transition-colors"
                    >
                      Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`/admin/treasury?depositsPage=${page + 1}`}
                      className="text-xs font-body text-karis-stone-500 hover:text-karis-stone-900 px-3 py-1.5 border border-karis-stone-100 rounded-lg transition-colors"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
