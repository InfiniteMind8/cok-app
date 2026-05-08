'use client'

import { useState } from 'react'
import { useSignIn, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

interface AccessButtonProps {
  userId: string
  firstName: string
}

export function AccessButton({ userId, firstName }: AccessButtonProps) {
  // Clerk v7 API: useSignIn returns { errors, fetchStatus, signIn }
  // signIn is a SignInFutureResource — always defined, never null
  const { signIn } = useSignIn()
  const { signOut } = useClerk()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      // Clear any active session (idempotent — no-op if not signed in)
      await signOut()

      // Generate a Clerk sign-in token server-side
      const res = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const { token, error: apiError } = await res.json()
      if (!token) throw new Error(apiError ?? 'Token generation failed')

      // v7: signIn.create() with ticket strategy authenticates the user
      const createResult = await signIn.create({ strategy: 'ticket', ticket: token })
      if (createResult.error) {
        throw new Error(createResult.error.message ?? 'Ticket authentication failed')
      }

      // Confirm the sign-in actually completed before we try to finalize.
      // If status isn't 'complete', surface what Clerk reported instead of
      // hitting "Cannot finalize sign-in without a created session" downstream.
      if (signIn.status !== 'complete' || !signIn.createdSessionId) {
        throw new Error(
          `Sign-in did not complete (status: ${signIn.status ?? 'null'})`
        )
      }

      // v7: signIn.finalize() activates the new session (replaces old setActive)
      const finalizeResult = await signIn.finalize()
      if (finalizeResult.error) {
        throw new Error(finalizeResult.error.message ?? 'Session activation failed')
      }

      // Route through home — app/page.tsx reads the DB role and dispatches:
      // MASTER_ADMIN → /admin/dashboard, RESIDENT/VISITOR → /wallet,
      // ADMIN/VENDOR → coming-soon. Single source of truth, no role drift.
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full py-3 text-sm font-body font-medium rounded-lg transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: loading ? 'oklch(0.65 0.10 75)' : 'oklch(0.72 0.13 75)',
          color: 'oklch(0.13 0.01 70)',
        }}
      >
        {loading ? 'Signing in…' : `Enter as ${firstName}`}
      </button>
      {error && (
        <p
          className="font-body text-xs text-center"
          style={{ color: 'oklch(0.58 0.21 25)' }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
