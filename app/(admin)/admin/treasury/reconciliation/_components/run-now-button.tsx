'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminReconciliationApi, getBrowserApi, ApiClientError } from '@/lib/api'

export function RunNowButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const result = await adminReconciliationApi.runNow(getBrowserApi())
      router.push(`/admin/treasury/reconciliation/${result.reportId}`)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to run reconciliation.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-karis-green-900 text-white text-sm font-body rounded-lg hover:bg-karis-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Running…
          </>
        ) : (
          'Run reconciliation now'
        )}
      </button>
      {error && (
        <p className="mt-2 text-xs font-body text-red-600">{error}</p>
      )}
    </div>
  )
}
