'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { QRCodeSVG } from 'qrcode.react'
import { Shield, Copy, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Wordmark } from '@/components/shared/wordmark'

type Phase = 'setup' | 'verify' | 'backup-codes'

interface Props {
  isStaff: boolean
  userName: string
}

export function MfaEnrollClient({ isStaff, userName: _ }: Props) {
  const router = useRouter()
  const { user } = useUser()
  const [phase, setPhase] = useState<Phase>('setup')
  const [totpUri, setTotpUri] = useState('')
  const [totpSecret, setTotpSecret] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [codesConfirmed, setCodesConfirmed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSetup() {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const totp = await user.createTOTP()
      setTotpUri(totp.uri ?? '')
      setTotpSecret(totp.secret ?? '')
      setPhase('verify')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create TOTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    if (!user || verifyCode.length !== 6) return
    setLoading(true)
    setError('')
    try {
      await user.verifyTOTP({ code: verifyCode })
      const backup = await user.createBackupCode()
      setBackupCodes(backup.codes)
      setPhase('backup-codes')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid code. Please check your authenticator and try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleDone() {
    router.push(isStaff ? '/dashboard' : '/profile')
    router.refresh()
  }

  function handleCopySecret() {
    navigator.clipboard.writeText(totpSecret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-karis-stone-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Wordmark className="justify-center mb-6" />
            <div className="w-12 h-12 bg-karis-green-900/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={24} className="text-karis-green-900" />
            </div>
            <h1 className="font-heading text-2xl text-karis-green-900 mb-2">
              Set up two-factor authentication
            </h1>
            <p className="font-body text-sm text-karis-stone-600 leading-relaxed">
              {isStaff
                ? 'Two-factor authentication is required for your role. It protects your account and community data with an extra layer of security.'
                : 'Add an extra layer of security to keep your Karis account safe.'}
            </p>
          </div>

          <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-6 space-y-5">
            <div className="space-y-2">
              <p className="font-body text-sm font-medium text-karis-green-900">What you'll need</p>
              <ul className="space-y-1 font-body text-sm text-karis-stone-600 list-disc list-inside">
                <li>An authenticator app (Google Authenticator, Authy, or 1Password)</li>
                <li>A safe place to store 10 one-time backup codes</li>
              </ul>
            </div>

            <Button
              onClick={handleSetup}
              disabled={loading}
              className="w-full bg-karis-green-900 hover:bg-karis-green-800 text-white font-body"
            >
              {loading ? 'Setting up…' : 'Get started'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'verify') {
    return (
      <div className="min-h-screen bg-karis-stone-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Wordmark className="justify-center mb-6" />
            <h1 className="font-heading text-2xl text-karis-green-900 mb-2">
              Scan with your authenticator
            </h1>
            <p className="font-body text-sm text-karis-stone-600">
              Open your authenticator app and scan the QR code, then enter the 6-digit code.
            </p>
          </div>

          <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-6 space-y-5">
            <div className="flex justify-center">
              <div className="p-3 bg-white border border-karis-stone-200 rounded-xl">
                {totpUri && <QRCodeSVG value={totpUri} size={180} />}
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-body text-xs text-karis-stone-500">
                Can't scan? Enter this key manually in your authenticator:
              </p>
              <div className="flex items-center gap-2 bg-karis-stone-50 border border-karis-stone-200 rounded-lg px-3 py-2">
                <code className="font-mono text-xs text-karis-stone-700 flex-1 break-all select-all">
                  {totpSecret}
                </code>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="shrink-0 text-karis-stone-400 hover:text-karis-green-700 transition-colors"
                  aria-label="Copy secret key"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="totp-code"
                className="font-body text-sm text-karis-stone-700 block"
              >
                Enter the 6-digit code from your authenticator app
              </label>
              <Input
                id="totp-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verifyCode}
                onChange={(e) =>
                  setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="000 000"
                className="text-center text-xl tracking-[0.4em] font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && verifyCode.length === 6) handleVerify()
                }}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-600 font-body text-sm">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              onClick={handleVerify}
              disabled={loading || verifyCode.length !== 6}
              className="w-full bg-karis-green-900 hover:bg-karis-green-800 text-white font-body"
            >
              {loading ? 'Verifying…' : 'Verify and continue'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-karis-stone-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Wordmark className="justify-center mb-6" />
          <h1 className="font-heading text-2xl text-karis-green-900 mb-2">
            Save your backup codes
          </h1>
          <p className="font-body text-sm text-karis-stone-600 leading-relaxed">
            Store these codes somewhere safe — a password manager or printed copy.
            Each code works only once and cannot be recovered.
          </p>
        </div>

        <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-6 space-y-5">
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code) => (
              <div
                key={code}
                className="bg-karis-stone-50 border border-karis-stone-200 rounded-lg px-3 py-2 font-mono text-sm text-karis-stone-700 text-center tracking-wider"
              >
                {code}
              </div>
            ))}
          </div>

          <div className="flex items-start gap-3 pt-1">
            <Checkbox
              id="codes-confirmed"
              checked={codesConfirmed}
              onCheckedChange={(v) => setCodesConfirmed(v === true)}
            />
            <label
              htmlFor="codes-confirmed"
              className="font-body text-sm text-karis-stone-700 cursor-pointer leading-relaxed"
            >
              I have saved these backup codes in a secure location.
            </label>
          </div>

          <Button
            onClick={handleDone}
            disabled={!codesConfirmed}
            className="w-full bg-karis-green-900 hover:bg-karis-green-800 text-white font-body"
          >
            Done — access my account
          </Button>
        </div>
      </div>
    </div>
  )
}
