import Link from 'next/link'
import { format } from 'date-fns'
import { adminReconciliationApi } from '@/lib/api'
import { getServerApi } from '@/lib/api/server'
import { AcknowledgeButton } from '@/app/(admin)/admin/treasury/reconciliation/_components/acknowledge-button'

export async function ReconciliationAlertBanner() {
  let alert: Awaited<ReturnType<typeof adminReconciliationApi.getActiveAlert>>
  try {
    alert = await adminReconciliationApi.getActiveAlert(getServerApi())
  } catch {
    return null
  }
  if (!alert) return null

  const details = alert.details as { discrepancy?: string } | null

  return (
    <div className="sticky top-0 z-50 w-full bg-red-600 text-white px-6 py-3 flex items-center justify-between gap-4 shadow-md">
      <div className="flex items-center gap-3 min-w-0">
        <span className="shrink-0 w-2 h-2 rounded-full bg-white animate-pulse" />
        <p className="text-sm font-body truncate">
          <span className="font-semibold">Treasury reconciliation discrepancy</span>
          {' '}detected on {format(new Date(alert.runAt), 'dd MMM yyyy')}.
          {details?.discrepancy ? ` Discrepancy: ${details.discrepancy} KCRD.` : ''}
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
