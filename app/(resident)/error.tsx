'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function ResidentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { context: 'resident_route' } })
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6">
      <div className="max-w-sm text-center space-y-3">
        <h2 className="text-xl font-semibold text-karis-ebony">Something went wrong</h2>
        <p className="text-sm text-karis-stone-500">
          Please try again. If the issue persists, contact support.
          {error.digest && (
            <span className="block mt-1 font-mono text-xs text-karis-stone-400">
              Ref: {error.digest}
            </span>
          )}
        </p>
        <button
          onClick={reset}
          className="px-5 py-2 rounded-full bg-karis-ebony text-white text-sm hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
