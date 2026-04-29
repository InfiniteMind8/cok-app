'use client'

import { useState } from 'react'
import { acknowledgeAlertAction } from '@/app/(admin)/_actions/reconciliation'

export function AcknowledgeButton({ reportId }: { reportId: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const result = await acknowledgeAlertAction(reportId)
      if (result.ok) {
        setDone(true)
      } else {
        setError(result.error ?? 'Unknown error')
      }
    } catch {
      setError('Failed to acknowledge alert.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <span className="text-sm font-body text-karis-stone-500">Alert acknowledged.</span>
    )
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-body text-karis-stone-700 border border-karis-stone-200 rounded-lg hover:bg-karis-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Acknowledging…' : 'Acknowledge alert'}
      </button>
      {error && (
        <p className="mt-1.5 text-xs font-body text-red-600">{error}</p>
      )}
    </div>
  )
}
