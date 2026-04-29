'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-stone-900">Something went wrong</h1>
          <p className="text-stone-500">
            We&apos;ve been notified and are looking into it. Please try again.
          </p>
          {error.digest && (
            <p className="text-xs text-stone-400 font-mono">Reference: {error.digest}</p>
          )}
          <button
            onClick={reset}
            className="mt-2 px-6 py-2 rounded-lg bg-stone-900 text-white text-sm hover:bg-stone-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
