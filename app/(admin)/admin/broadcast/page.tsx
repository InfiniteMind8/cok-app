import { adminBroadcastsApi } from '@/lib/api'
import { getServerApi } from '@/lib/api/server'
import { BroadcastForm } from './_components/broadcast-form'
import { format, parseISO } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function BroadcastPage() {
  const { activeCount, recent } = await adminBroadcastsApi.getOverview(getServerApi())

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-display text-karis-green-900">Emergency Broadcast</h1>
        <p className="mt-1 text-sm font-body text-karis-stone-500">
          Send a high-urgency announcement to every active resident and visitor immediately.
        </p>
      </div>

      <BroadcastForm activeUserCount={activeCount} />

      {recent.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold font-body text-karis-stone-500 uppercase tracking-wider">
            Recent broadcasts
          </h2>
          <div className="rounded-xl border border-karis-stone-200 overflow-hidden divide-y divide-karis-stone-100">
            {recent.map((b) => (
              <div key={b.id} className="px-5 py-4 flex items-start justify-between gap-4 bg-white">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <SeverityBadge severity={b.severity} />
                    <span className="text-sm font-semibold font-body text-karis-stone-900 truncate">
                      {b.headline}
                    </span>
                  </div>
                  <p className="text-xs font-body text-karis-stone-500 truncate">
                    {b.message.slice(0, 100)}{b.message.length > 100 ? '…' : ''}
                  </p>
                </div>
                <div className="shrink-0 text-right space-y-0.5">
                  <p className="text-xs font-body text-karis-stone-500">
                    {format(parseISO(b.publishedAt), 'dd MMM yyyy HH:mm')}
                  </p>
                  <p className="text-xs font-body text-karis-stone-400">
                    {b._count.acknowledgements} acknowledged
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === 'CRITICAL') {
    return <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">Critical</span>
  }
  if (severity === 'URGENT') {
    return <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700">Urgent</span>
  }
  return <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">Info</span>
}
