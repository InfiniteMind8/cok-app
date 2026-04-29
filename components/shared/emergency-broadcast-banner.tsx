import { getActiveEmergencyBroadcasts } from '@/lib/queries/broadcast'
import { AcknowledgeBroadcastButton } from './acknowledge-broadcast-button'
import type { AnnouncementSeverity } from '@prisma/client'

function severityStyles(severity: AnnouncementSeverity): { bg: string; text: string; border: string; label: string } {
  switch (severity) {
    case 'CRITICAL':
      return { bg: 'bg-red-600', text: 'text-white', border: 'border-red-700', label: 'Critical' }
    case 'URGENT':
      return { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600', label: 'Urgent' }
    default:
      return { bg: 'bg-karis-green-700', text: 'text-white', border: 'border-karis-green-800', label: 'Info' }
  }
}

export async function EmergencyBroadcastBanner({ userId }: { userId: string }) {
  const broadcasts = await getActiveEmergencyBroadcasts(userId)
  if (!broadcasts.length) return null

  return (
    <div className="sticky top-0 z-50 flex flex-col">
      {broadcasts.map((broadcast) => {
        const s = severityStyles(broadcast.severity)
        return (
          <div
            key={broadcast.id}
            className={`w-full ${s.bg} ${s.text} px-6 py-3 flex items-center justify-between gap-4 shadow-md border-b ${s.border}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="shrink-0 w-2 h-2 rounded-full bg-white animate-pulse" />
              <div className="min-w-0">
                <span className="text-xs font-semibold uppercase tracking-widest opacity-80 mr-2">
                  {s.label}
                </span>
                <span className="text-sm font-semibold">{broadcast.headline}</span>
                <span className="hidden sm:inline text-sm opacity-90"> — {broadcast.message.slice(0, 80)}{broadcast.message.length > 80 ? '…' : ''}</span>
              </div>
            </div>
            <AcknowledgeBroadcastButton broadcastId={broadcast.id} />
          </div>
        )
      })}
    </div>
  )
}
