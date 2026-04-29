import Link from 'next/link'
import { getActiveAlert } from '@/lib/ledger/reconciliation-report'
import { AcknowledgeButton } from '@/app/(admin)/admin/treasury/reconciliation/_components/acknowledge-button'
import { format } from 'date-fns'

export async function ReconciliationAlertBanner() {
  const alert = await getActiveAlert()
  if (!alert) return null

  const details = alert.details as { discrepancy?: string }

  return (
    <div className="sticky top-0 z-50 w-full bg-red-600 text-white px-6 py-3 flex items-center justify-between gap-4 shadow-md">
      <div className="flex items-center gap-3 min-w-0">
        <span className="shrink-0 w-2 h-2 rounded-full bg-white animate-pulse" />
        <p className="text-sm font-body truncate">
          <span className="font-semibold">Treasury reconciliation discrepancy</span>
          {' '}detected on {format(alert.runAt, 'dd MMM yyyy')}.
          {details.discrepancy ? ` Discrepancy: ${details.discrepancy} KCRD.` : ''}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href={`/admin/treasury/reconciliation/${alert.id}`}
          className="text-sm font-body text-white underline hover:no-underline whitespace-nowrap"
        >
          View report
        </Link>
        <AcknowledgeButton reportId={alert.id} />
      </div>
    </div>
  )
}
