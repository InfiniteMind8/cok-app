'use client'

import { useSignIn, useClerk } from '@clerk/nextjs'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DEMO_USERS = [
  { id: 'user_3CtmfDZfRg9T21vmoAEMqwKj5co', name: 'Karis Munroe', role: 'Master Admin' },
  { id: 'user_3CtmfI4l73YuvWDzzAT1H9I3g91', name: 'Naomi Wells', role: 'Admin' },
  { id: 'user_3CtmfMWnpFibGSGws37JEW7FFwH', name: 'Devon McKenzie', role: 'Resident' },
  { id: 'user_3CtmfKH80kXydPxKBsxVjFfgZLP', name: 'Anjali Pereira', role: 'Resident' },
  { id: 'user_3CtmfWRMtnrt8gecUHkqyQ0CMZk', name: 'Aaliyah Singh', role: 'Vendor' },
  { id: 'user_3CtmfSIS8UizzHXbLQQfbyC5o5w', name: 'Marcus Bowen', role: 'Visitor' },
] as const

function DemoButton({ userId, name, role }: { userId: string; name: string; role: string }) {
  const { signIn } = useSignIn()
  const { signOut } = useClerk()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    if (loading || !signIn) return
    setLoading(true)
    setError('')
    try {
      await signOut()

      const res = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = (await res.json()) as { token?: string; error?: string }
      if (!data.token) throw new Error(data.error ?? 'Token generation failed')

      await signIn.create({ strategy: 'ticket', ticket: data.token })
      if (signIn.status !== 'complete' || !signIn.createdSessionId) {
        throw new Error(`Sign-in did not complete (status: ${signIn.status ?? 'null'})`)
      }

      await signIn.finalize()
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
      setLoading(false)
    }
  }

  const firstName = name.split(' ')[0]

  return (
    <div className="space-y-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-karis-gold-100 text-karis-green-900 border border-karis-gold-700 rounded-xl font-body text-sm font-medium hover:bg-karis-gold-300 focus:outline-none focus:ring-2 focus:ring-karis-green-700 focus:ring-offset-2 transition-colors duration-[120ms] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        aria-label={`Sign in as ${name} — ${role}`}
      >
        <span>{firstName}</span>
        <span className="font-body text-xs text-karis-green-700 font-normal">{role}</span>
        {loading && (
          <span className="absolute right-4 font-body text-xs text-karis-stone-500" aria-hidden="true">
            …
          </span>
        )}
      </button>
      {error && (
        <p className="font-body text-xs text-status-red px-1">{error}</p>
      )}
    </div>
  )
}

export function DemoBlock() {
  return (
    <div className="w-full max-w-[420px] mt-4">
      {/* Divider with label */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-karis-stone-300" />
        <span className="font-body text-xs text-karis-stone-500 shrink-0">Demo accounts</span>
        <div className="flex-1 h-px bg-karis-stone-300" />
      </div>

      <div className="space-y-2">
        {DEMO_USERS.map((user) => (
          <DemoButton key={user.id} userId={user.id} name={user.name} role={user.role} />
        ))}
      </div>
    </div>
  )
}
