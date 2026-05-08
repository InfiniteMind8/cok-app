'use client'

import { useEffect, useState } from 'react'
import { useSignIn } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'

export function AccessCallbackClient() {
  const { signIn } = useSignIn()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ticket = searchParams.get('ticket')
    if (!ticket) { setError('No ticket provided.'); return }

    async function run() {
      try {
        const { error: ticketErr } = await signIn.ticket({ ticket })
        if (ticketErr) throw new Error(ticketErr.message ?? 'Ticket rejected by Clerk')
        const { error: finalErr } = await signIn.finalize()
        if (finalErr) throw new Error(finalErr.message ?? 'Session activation failed')
        window.location.href = '/'
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Sign-in failed')
      }
    }
    run()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <div className="text-center space-y-3">
        <p
          className="font-body text-sm"
          style={{ color: 'oklch(0.58 0.21 25)' }}
        >
          {error}
        </p>
        <a
          href="/access"
          className="font-body text-xs underline underline-offset-4"
          style={{ color: 'oklch(0.72 0.13 75 / 0.7)' }}
        >
          ← Back to demo page
        </a>
      </div>
    )
  }

  return (
    <p
      className="font-body text-sm animate-pulse"
      style={{ color: 'oklch(0.45 0.01 70)' }}
    >
      Signing in…
    </p>
  )
}
