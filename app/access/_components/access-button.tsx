'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { useClerk } from '@clerk/nextjs'

interface AccessButtonProps {
  firstName: string
  children: ReactNode
}

export function AccessButton({ firstName, children }: AccessButtonProps) {
  const { signOut } = useClerk()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget)
      const userId = formData.get('userId')

      if (typeof userId !== 'string') {
        throw new Error('Invalid request')
      }

      // Generate token first, then sign out and hard-navigate.
      // This matches the pattern used in login-button.tsx and dev-sign-in-button.tsx.
      // The sign-in page's useEffect detects __clerk_ticket and auto-signs in
      // without showing the form - user lands on the dashboard within ~300ms.
      const res = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const { token, error: apiError } = await res.json()
      if (!token) throw new Error(apiError ?? 'Token generation failed')

      await signOut()
      window.location.href = `/access/callback?ticket=${token}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-1.5">
      {children}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 text-sm font-body font-medium rounded-lg transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: loading ? 'oklch(0.65 0.10 75)' : 'oklch(0.72 0.13 75)',
          color: 'oklch(0.13 0.01 70)',
        }}
      >
        {loading ? 'Signing in...' : `Enter as ${firstName}`}
      </button>
      {error && (
        <p
          className="font-body text-xs text-center"
          style={{ color: 'oklch(0.58 0.21 25)' }}
        >
          {error}
        </p>
      )}
    </form>
  )
}
