import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { PageHeader } from '@/components/admin/page-header'
import { adminReconciliationApi, getServerApi, type ReconciliationStatus } from '@/lib/api'
import { RunNowButton } from './_components/run-now-button'

export const dynamic = 'force-dynamic'

const STATUS_PILL: Record<ReconciliationStatus, { label: string; className: string }> = {
  OK: {
    label: 'OK',
    className: 'bg-green-100 text-green-800',
  },
  WARNING: {
    label: 'Warning',
    className: 'bg-amber-100 text-amber-800',
  },
  MISMATCH: {
    label: 'Mismatch',
    className: 'bg-red-100 text-red-800',
  },
}

export default async function ReconciliationListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; from?: string; to?: string }>
}) {
  const { page: pageParam = '1', from, to } = await searchParams
  const page = Math.max(1, parseInt(pageParam, 10) || 1)

  const { reports, total, pageSize } = await adminReconciliationApi.list(getServerApi(), {
    page,
    from,
    to,
  })
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="p-8 max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Treasury Reconciliation"
          subtitle="Daily ledger balance checks. Each run verifies that total credits equal total debits."
        />
        <RunNowButton />
      </div>

      {/* Date filter */}
      <form method="GET" className="flex items-center gap-3">
        <label className="text-xs font-body text-karis-stone-500">From</label>
        <input
          type="date"
          name="from"
          defaultValue={from}
          className="text-xs font-body border border-karis-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-karis-green-600"
        />
        <label className="text-xs font-body text-karis-stone-500">To</label>
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="text-xs font-body border border-karis-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-karis-green-600"
        />
        <button
          type="submit"
          className="text-xs font-body text-karis-green-700 hover:text-karis-green-900 px-3 py-1.5 border border-karis-stone-200 rounded-lg transition-colors"
        >
          Filter
        </button>
        {(from || to) && (
          <Link
            href="/admin/treasury/reconciliation"
            className="text-xs font-body text-karis-stone-400 hover:text-karis-stone-600"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Reports table */}
      <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-karis-stone-100 flex items-center justify-between">
          <h2 className="font-heading text-base text-karis-green-900">Reconciliation Reports</h2>
          <span className="text-xs font-body text-karis-stone-500 tabular-nums">{total} total</span>
        </div>

        {reports.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-body text-karis-stone-500">
              No reconciliation reports yet. Run one now to start.
            </p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-karis-stone-50">
                  {['Run time', 'Status', 'Discrepancy (KCRD)', 'Acknowledged by', ''].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left font-body text-xs uppercase tracking-wider text-karis-stone-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-karis-stone-50">
                {reports.map((r) => {
                  const pill = STATUS_PILL[r.status]
                  const details = r.details as { discrepancy?: string }
                  return (
                    <tr key={r.id} className="hover:bg-karis-stone-50/50 transition-colors">
                      <td className="px-5 py-3 font-body text-sm text-karis-stone-500 tabular-nums">
                        {format(parseISO(r.runAt), 'dd MMM yyyy HH:mm')} UTC
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body font-medium ${pill.className}`}>
                          {pill.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-body text-sm tabular-nums text-karis-stone-900">
                        {details.discrepancy ?? '—'}
                      </td>
                      <td className="px-5 py-3 font-body text-sm text-karis-stone-500">
                        {r.acknowledgedBy
                          ? `${r.acknowledgedBy.fullName} · ${r.acknowledgedAt ? format(parseISO(r.acknowledgedAt), 'dd MMM yyyy') : ''}`
                          : r.status === 'MISMATCH'
                            ? <span className="text-red-600 font-medium">Unacknowledged</span>
                            : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/admin/treasury/reconciliation/${r.id}`}
                          className="text-xs font-body text-karis-green-700 hover:text-karis-green-900 hover:underline"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-karis-stone-100 flex items-center justify-between">
                <span className="text-xs font-body text-karis-stone-500">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`/admin/treasury/reconciliation?page=${page - 1}${from ? `&from=${from}` : ''}${to ? `&to=${to}` : ''}`}
                      className="text-xs font-body text-karis-stone-500 hover:text-karis-stone-900 px-3 py-1.5 border border-karis-stone-100 rounded-lg transition-colors"
                    >
                      Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`/admin/treasury/reconciliation?page=${page + 1}${from ? `&from=${from}` : ''}${to ? `&to=${to}` : ''}`}
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
