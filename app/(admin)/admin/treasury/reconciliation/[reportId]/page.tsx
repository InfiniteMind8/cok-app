import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { PageHeader } from '@/components/admin/page-header'
import {
  adminReconciliationApi,
  ApiClientError,
  getServerApi,
  type ReconciliationStatus,
} from '@/lib/api'
import { AcknowledgeButton } from '../_components/acknowledge-button'

export const dynamic = 'force-dynamic'

const STATUS_PILL: Record<ReconciliationStatus, { label: string; className: string }> = {
  OK: { label: 'OK', className: 'bg-green-100 text-green-800' },
  WARNING: { label: 'Warning', className: 'bg-amber-100 text-amber-800' },
  MISMATCH: { label: 'Mismatch', className: 'bg-red-100 text-red-800' },
}

export default async function ReconciliationDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>
}) {
  const { reportId } = await params

  let report
  try {
    report = await adminReconciliationApi.get(getServerApi(), reportId)
  } catch (err) {
    if (err instanceof ApiClientError && err.code === 'NOT_FOUND') notFound()
    throw err
  }

  const pill = STATUS_PILL[report.status]
  const details = report.details as Record<string, unknown>
  const showAcknowledge = report.status === 'MISMATCH' && !report.acknowledgedAt

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="flex items-center gap-2 text-xs font-body text-karis-stone-400 mb-2">
        <Link href="/admin/treasury/reconciliation" className="hover:text-karis-green-700 transition-colors">
          Reconciliation reports
        </Link>
        <span>›</span>
        <span className="text-karis-stone-600">Report detail</span>
      </div>

      <PageHeader
        title="Reconciliation Report"
        subtitle={`Run at ${format(parseISO(report.runAt), 'dd MMM yyyy HH:mm')} UTC`}
      />

      {/* Status + acknowledge */}
      <div className="flex items-center gap-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-body font-medium ${pill.className}`}>
          {pill.label}
        </span>
        {showAcknowledge && <AcknowledgeButton reportId={report.id} />}
        {report.acknowledgedAt && (
          <p className="text-xs font-body text-karis-stone-400">
            Acknowledged by {report.acknowledgedBy?.fullName ?? 'unknown'} on{' '}
            {format(parseISO(report.acknowledgedAt), 'dd MMM yyyy HH:mm')} UTC
          </p>
        )}
      </div>

      {/* Details card */}
      <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-karis-stone-100">
          <h2 className="font-heading text-base text-karis-green-900">Ledger summary</h2>
          <p className="text-xs font-body text-karis-stone-500 mt-0.5">
            Double-entry check: net sum of all ledger entries should be zero.
          </p>
        </div>
        <div className="px-6 py-5 space-y-3">
          {Object.entries(details).map(([key, value]) => (
            <div key={key} className="flex items-baseline justify-between gap-4">
              <span className="text-xs font-body text-karis-stone-500 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className={`font-body text-sm tabular-nums ${
                key === 'discrepancy' && Number(value) !== 0
                  ? 'text-red-600 font-semibold'
                  : 'text-karis-stone-900'
              }`}>
                {String(value)}
                {typeof value === 'string' && key !== 'walletCount' ? ' KCRD' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      {report.status === 'MISMATCH' && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-4">
          <p className="text-sm font-body text-red-800 leading-relaxed">
            The ledger is out of balance. This indicates that a debit was posted without a
            corresponding credit, or vice versa. Review recent transactions in the audit log
            for entries that may have been written outside the normal transfer path.
          </p>
          <Link
            href="/admin/audit-log"
            className="mt-3 inline-block text-xs font-body text-red-700 hover:underline"
          >
            Open audit log →
          </Link>
        </div>
      )}
    </div>
  )
}
