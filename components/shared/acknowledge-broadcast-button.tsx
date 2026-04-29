'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { acknowledgeEmergencyBroadcastAction } from '@/app/(admin)/_actions/broadcast'

export function AcknowledgeBroadcastButton({ broadcastId }: { broadcastId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDismiss() {
    startTransition(async () => {
      setError(null)
      const result = await acknowledgeEmergencyBroadcastAction(broadcastId)
      if (result.ok) {
        router.refresh()
      } else {
        setError(result.error ?? 'Could not dismiss.')
      }
    })
  }

  return (
    <div className="shrink-0 flex items-center gap-2">
      {error && <span className="text-xs text-white/80">{error}</span>}
      <button
        onClick={handleDismiss}
        disabled={isPending}
        className="inline-flex items-center px-3 py-1 rounded text-xs font-semibold bg-white/20 hover:bg-white/30 text-white border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
      >
        {isPending ? 'Dismissing…' : 'Dismiss'}
      </button>
    </div>
  )
}
