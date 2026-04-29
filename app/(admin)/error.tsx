'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { context: 'admin_route' } })
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
      <div className="max-w-sm text-center space-y-3">
        <h2 className="text-xl font-semibold text-karis-ebony">An error occurred</h2>
        <p className="text-sm text-karis-stone-500">
          The admin page encountered an unexpected error.
          {error.digest && (
            <span className="block mt-1 font-mono text-xs text-karis-stone-400">
              Ref: {error.digest}
            </span>
          )}
        </p>
        <div className="flex gap-3 justify-center pt-1">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-karis-ebony text-white text-sm hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
          <button
            onClick={() => { window.location.href = '/admin' }}
            className="px-4 py-2 rounded-lg border border-karis-stone-200 text-karis-ebony text-sm hover:bg-karis-stone-100 transition-colors"
          >
            Back to Admin
          </button>
        </div>
      </div>
    </div>
  )
}
