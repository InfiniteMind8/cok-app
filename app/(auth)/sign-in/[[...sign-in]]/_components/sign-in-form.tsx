'use client'

import { useSignIn } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Clerk v7 API:
//   signIn.password({ emailAddress, password })     → submit credentials
//   signIn.create({ identifier })                   → init sign-in for reset flow
//   signIn.resetPasswordEmailCode.sendCode()        → send email code
//   signIn.resetPasswordEmailCode.verifyCode({code})→ verify, status → 'needs_new_password'
//   signIn.resetPasswordEmailCode.submitPassword({password}) → finalize reset
//   signIn.create({ strategy: 'ticket', ticket })   → ticket (link-based reset or demo)

type View = 'sign-in' | 'forgot-request' | 'forgot-verify' | 'forgot-newpw' | 'forgot-done'

const inputCls =
  'w-full px-4 py-3 font-body text-sm text-karis-stone-900 bg-white border border-karis-stone-300 rounded-xl placeholder:text-karis-stone-500 focus:outline-none focus:ring-2 focus:ring-karis-green-700 focus:border-karis-green-700 transition-colors duration-[120ms]'

const primaryBtnCls =
  'w-full py-3 px-4 font-body font-medium text-sm text-karis-gold-100 bg-karis-green-900 rounded-xl hover:bg-karis-green-700 active:bg-karis-green-900 focus:outline-none focus:ring-2 focus:ring-karis-green-700 focus:ring-offset-2 transition-colors duration-[120ms] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer'

const ghostBtnCls =
  'w-full font-body text-xs text-karis-stone-700 hover:text-karis-green-700 text-center transition-colors duration-[120ms] cursor-pointer py-1'

type ClerkResult = { error: { message?: string; longMessage?: string } | null }

function errorMsg(result: ClerkResult): string {
  if (!result.error) return ''
  return result.error.longMessage ?? result.error.message ?? 'Something went wrong.'
}

export function SignInForm() {
  const { signIn } = useSignIn()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [view, setView] = useState<View>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [liveMsg, setLiveMsg] = useState('')

  function announce(msg: string) {
    setLiveMsg('')
    // Double-rAF ensures aria-live fires even for repeat messages
    requestAnimationFrame(() => requestAnimationFrame(() => setLiveMsg(msg)))
  }

  // Handle password-reset link: /sign-in?__clerk_ticket=xxx
  useEffect(() => {
    const ticket = searchParams.get('__clerk_ticket')
    if (!ticket || !signIn) return

    signIn
      .create({ strategy: 'ticket', ticket })
      .then((result) => {
        if (result.error) {
          setError(result.error.longMessage ?? result.error.message ?? 'Reset link invalid or expired.')
          announce('Reset link invalid or expired.')
          return
        }
        if (signIn.status === 'needs_new_password') {
          setView('forgot-newpw')
          announce('Please enter a new password.')
        } else if (signIn.status === 'complete' && signIn.createdSessionId) {
          signIn.finalize().then(() => {
            router.push('/')
            router.refresh()
          })
        }
      })
      .catch(() => {
        setError('Reset link is invalid or expired. Please request a new one.')
        announce('Reset link is invalid or expired.')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Sign-in (email + password) ──────────────────────────────────────────
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!signIn || loading) return
    setLoading(true)
    setError('')
    try {
      const result = await signIn.password({ emailAddress: email, password })
      if (result.error) {
        const msg = errorMsg(result)
        setError(msg)
        announce(msg)
        return
      }
      if (signIn.status !== 'complete' || !signIn.createdSessionId) {
        setError('Sign-in requires additional steps. Please contact support.')
        return
      }
      await signIn.finalize()
      router.push('/')
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed. Please try again.'
      setError(msg)
      announce(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── Forgot password: request code ────────────────────────────────────────
  async function handleForgotRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!signIn || loading) return
    setLoading(true)
    setError('')
    try {
      // Initialize sign-in attempt with the identifier
      const createResult = await signIn.create({ identifier: email })
      if (createResult.error) {
        const msg = errorMsg(createResult)
        setError(msg)
        announce(msg)
        return
      }
      // Send the reset code to the registered email
      const sendResult = await signIn.resetPasswordEmailCode.sendCode()
      if (sendResult.error) {
        const msg = errorMsg(sendResult)
        setError(msg)
        announce(msg)
        return
      }
      setView('forgot-verify')
      announce('Reset code sent. Check your email.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not send reset code.'
      setError(msg)
      announce(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── Forgot password: verify code ─────────────────────────────────────────
  async function handleForgotVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!signIn || loading) return
    setLoading(true)
    setError('')
    try {
      const verifyResult = await signIn.resetPasswordEmailCode.verifyCode({ code: resetCode })
      if (verifyResult.error) {
        const msg = errorMsg(verifyResult)
        setError(msg)
        announce(msg)
        return
      }
      // status is now 'needs_new_password' — advance to new password view
      setView('forgot-newpw')
      announce('Code verified. Please enter your new password.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid code. Please try again.'
      setError(msg)
      announce(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── Forgot password: submit new password ─────────────────────────────────
  async function handleNewPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!signIn || loading) return
    setLoading(true)
    setError('')
    try {
      const submitResult = await signIn.resetPasswordEmailCode.submitPassword({
        password: newPassword,
      })
      if (submitResult.error) {
        const msg = errorMsg(submitResult)
        setError(msg)
        announce(msg)
        return
      }
      if (signIn.status === 'complete' && signIn.createdSessionId) {
        await signIn.finalize()
        router.push('/')
        router.refresh()
        return
      }
      setView('forgot-done')
      announce('Password reset successfully.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not reset password.'
      setError(msg)
      announce(msg)
    } finally {
      setLoading(false)
    }
  }

  function resetToSignIn() {
    setError('')
    setResetCode('')
    setNewPassword('')
    setView('sign-in')
    announce('Returned to sign in.')
  }

  const headings: Record<View, string> = {
    'sign-in': 'Welcome back to Karis.',
    'forgot-request': 'Reset your password',
    'forgot-verify': 'Check your email',
    'forgot-newpw': 'Choose a new password',
    'forgot-done': 'Password reset',
  }

  return (
    <div>
      {/* Screen-reader live region for error / status announcements — §B.1 step 6 */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMsg}
      </div>

      <h1 className="font-display text-2xl font-semibold text-karis-green-900 mb-6">
        {headings[view]}
      </h1>

      {/* ── Sign-in ────────────────────────────────────────────────────────── */}
      {view === 'sign-in' && (
        <form onSubmit={handleSignIn} noValidate className="space-y-4">
          <div className="space-y-3">
            <div>
              <label htmlFor="si-email" className="block font-body text-xs font-medium text-karis-stone-700 mb-1.5">
                Email{' '}
                <span className="text-status-red" aria-hidden="true">*</span>
              </label>
              <input
                id="si-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="si-password" className="block font-body text-xs font-medium text-karis-stone-700 mb-1.5">
                Password{' '}
                <span className="text-status-red" aria-hidden="true">*</span>
              </label>
              <input
                id="si-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="font-body text-xs text-status-red">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className={primaryBtnCls}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <button
            type="button"
            onClick={() => { setError(''); setView('forgot-request') }}
            className={ghostBtnCls}
          >
            Forgot password?
          </button>
        </form>
      )}

      {/* ── Forgot: request code ───────────────────────────────────────────── */}
      {view === 'forgot-request' && (
        <form onSubmit={handleForgotRequest} noValidate className="space-y-4">
          <p className="font-body text-sm text-karis-stone-700 -mt-2">
            Enter your email and we&rsquo;ll send a reset code.
          </p>
          <div>
            <label htmlFor="fp-email" className="block font-body text-xs font-medium text-karis-stone-700 mb-1.5">
              Email{' '}
              <span className="text-status-red" aria-hidden="true">*</span>
            </label>
            <input
              id="fp-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputCls}
            />
          </div>

          {error && (
            <p role="alert" className="font-body text-xs text-status-red">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className={primaryBtnCls}>
            {loading ? 'Sending…' : 'Send reset code'}
          </button>

          <button type="button" onClick={resetToSignIn} className={ghostBtnCls}>
            Back to sign in
          </button>
        </form>
      )}

      {/* ── Forgot: enter code ─────────────────────────────────────────────── */}
      {view === 'forgot-verify' && (
        <form onSubmit={handleForgotVerify} noValidate className="space-y-4">
          <p className="font-body text-sm text-karis-stone-700 -mt-2">
            Enter the 6-digit code from your email.
          </p>
          <div>
            <label htmlFor="fp-code" className="block font-body text-xs font-medium text-karis-stone-700 mb-1.5">
              Reset code{' '}
              <span className="text-status-red" aria-hidden="true">*</span>
            </label>
            <input
              id="fp-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className={inputCls}
            />
          </div>

          {error && (
            <p role="alert" className="font-body text-xs text-status-red">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className={primaryBtnCls}>
            {loading ? 'Verifying…' : 'Verify code'}
          </button>

          <button type="button" onClick={resetToSignIn} className={ghostBtnCls}>
            Back to sign in
          </button>
        </form>
      )}

      {/* ── Forgot: choose new password ────────────────────────────────────── */}
      {view === 'forgot-newpw' && (
        <form onSubmit={handleNewPassword} noValidate className="space-y-4">
          <p className="font-body text-sm text-karis-stone-700 -mt-2">
            Choose a strong new password for your account.
          </p>
          <div>
            <label htmlFor="fp-newpw" className="block font-body text-xs font-medium text-karis-stone-700 mb-1.5">
              New password{' '}
              <span className="text-status-red" aria-hidden="true">*</span>
            </label>
            <input
              id="fp-newpw"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </div>

          {error && (
            <p role="alert" className="font-body text-xs text-status-red">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className={primaryBtnCls}>
            {loading ? 'Saving…' : 'Set new password'}
          </button>
        </form>
      )}

      {/* ── Forgot: done ───────────────────────────────────────────────────── */}
      {view === 'forgot-done' && (
        <div className="space-y-4">
          <p className="font-body text-sm text-karis-stone-700 -mt-2">
            Password updated. Sign in with your new password.
          </p>
          <button type="button" onClick={resetToSignIn} className={primaryBtnCls}>
            Sign in
          </button>
        </div>
      )}
    </div>
  )
}
