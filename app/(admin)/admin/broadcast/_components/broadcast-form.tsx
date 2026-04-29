'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { sendBroadcastAction } from '@/app/(admin)/_actions/broadcast'
import type { AnnouncementSeverity } from '@prisma/client'

type FormState = 'idle' | 'confirming' | 'sending' | 'done' | 'error'

const SEVERITY_OPTIONS: { value: AnnouncementSeverity; label: string; description: string }[] = [
  { value: 'INFO', label: 'Info', description: 'General announcement' },
  { value: 'URGENT', label: 'Urgent', description: 'Time-sensitive, action may be needed' },
  { value: 'CRITICAL', label: 'Critical', description: 'Immediate action required' },
]

const SEVERITY_PREVIEW_COLORS: Record<AnnouncementSeverity, { bg: string; badge: string; text: string }> = {
  INFO: { bg: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700', text: 'text-green-800' },
  URGENT: { bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', text: 'text-amber-800' },
  CRITICAL: { bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', text: 'text-red-800' },
}

const CONFIRM_PHRASE = 'BROADCAST'

interface Props {
  activeUserCount: number
}

export function BroadcastForm({ activeUserCount }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [state, setState] = useState<FormState>('idle')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [severity, setSeverity] = useState<AnnouncementSeverity>('URGENT')
  const [confirmPhrase, setConfirmPhrase] = useState('')
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const confirmInputRef = useRef<HTMLInputElement>(null)

  const canSubmit = title.trim().length > 0 && body.trim().length > 0
  const confirmValid = confirmPhrase === CONFIRM_PHRASE

  function openConfirm() {
    setState('confirming')
    setConfirmPhrase('')
    setTimeout(() => confirmInputRef.current?.focus(), 50)
  }

  function closeModal() {
    setState('idle')
    setConfirmPhrase('')
    setError(null)
  }

  function handleSend() {
    setState('sending')
    startTransition(async () => {
      try {
        const res = await sendBroadcastAction({ title: title.trim(), body: body.trim(), severity })
        if (res.ok) {
          setResult({ sent: res.sent ?? 0, failed: res.failed ?? 0 })
          setState('done')
        } else {
          setError(res.error ?? 'An unexpected error occurred.')
          setState('error')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
        setState('error')
      }
    })
  }

  function handleDoneClose() {
    setTitle('')
    setBody('')
    setSeverity('URGENT')
    setResult(null)
    setError(null)
    setState('idle')
    router.refresh()
  }

  const preview = SEVERITY_PREVIEW_COLORS[severity]

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Composer */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold font-body text-karis-stone-700">
                Title <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs font-body ${title.length > 72 ? 'text-amber-600' : 'text-karis-stone-400'}`}>
                {title.length}/80
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 80))}
              placeholder="What is this broadcast about?"
              className="w-full px-4 py-2.5 text-sm font-body border border-karis-stone-200 rounded-lg bg-white text-karis-stone-900 placeholder:text-karis-stone-400 focus:outline-none focus:ring-2 focus:ring-karis-green-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold font-body text-karis-stone-700">
                Message <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs font-body ${body.length > 1800 ? 'text-amber-600' : 'text-karis-stone-400'}`}>
                {body.length}/2000
              </span>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 2000))}
              placeholder="Provide full details of the situation and any instructions for residents…"
              rows={8}
              className="w-full px-4 py-2.5 text-sm font-body border border-karis-stone-200 rounded-lg bg-white text-karis-stone-900 placeholder:text-karis-stone-400 focus:outline-none focus:ring-2 focus:ring-karis-green-500 focus:border-transparent transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold font-body text-karis-stone-700 mb-2">Severity</label>
            <div className="grid grid-cols-3 gap-2">
              {SEVERITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSeverity(opt.value)}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-body text-left transition ${
                    severity === opt.value
                      ? opt.value === 'CRITICAL'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : opt.value === 'URGENT'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-karis-green-500 bg-green-50 text-green-700'
                      : 'border-karis-stone-200 bg-white text-karis-stone-600 hover:border-karis-stone-300'
                  }`}
                >
                  <p className="font-semibold">{opt.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold font-body text-karis-stone-700 mb-2">Channels</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 text-sm font-body text-karis-stone-700">
                <input type="checkbox" checked readOnly disabled className="rounded accent-karis-green-600" />
                <span>In-app banner <span className="text-karis-stone-400">(always on)</span></span>
              </label>
              <label className="flex items-center gap-3 text-sm font-body text-karis-stone-700">
                <input type="checkbox" checked readOnly className="rounded accent-karis-green-600" />
                <span>Email <span className="text-karis-stone-400">({activeUserCount} active users)</span></span>
              </label>
              <label className="flex items-center gap-3 text-sm font-body text-karis-stone-400 cursor-not-allowed">
                <input type="checkbox" disabled className="rounded" />
                <span>SMS <span className="inline-flex items-center ml-1.5 px-1.5 py-0.5 text-xs rounded bg-karis-stone-100">Coming soon</span></span>
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={openConfirm}
            disabled={!canSubmit}
            className="w-full py-3 px-6 rounded-xl text-sm font-semibold font-body bg-karis-green-700 text-white hover:bg-karis-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Send Broadcast
          </button>
        </div>

        {/* Preview pane */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold font-body text-karis-stone-500 uppercase tracking-wider">Preview</h2>
          <div className={`rounded-xl border-2 p-5 space-y-3 ${preview.bg}`}>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${preview.badge}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Emergency Broadcast — City of Karis
            </div>
            <p className={`text-lg font-display font-semibold ${preview.text}`}>
              {title || <span className="opacity-40">Your title will appear here</span>}
            </p>
            <p className="text-sm font-body text-karis-stone-600 leading-relaxed whitespace-pre-line">
              Hello Resident,
            </p>
            <p className="text-sm font-body text-karis-stone-800 leading-relaxed whitespace-pre-line">
              {body || <span className="opacity-40">Your message will appear here</span>}
            </p>
            <p className="text-xs font-body text-karis-stone-400 pt-2 border-t border-current/10">
              Sent by City of Karis administration.
            </p>
          </div>
          <p className="text-xs font-body text-karis-stone-400">
            Actual email delivery uses the registered email template with full brand styling.
          </p>
        </div>
      </div>

      {/* Confirm / sending / done / error modal */}
      {state !== 'idle' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            {state === 'confirming' && (
              <>
                <div className={`rounded-xl p-4 ${severity === 'CRITICAL' ? 'bg-red-50 border border-red-200' : severity === 'URGENT' ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${severity === 'CRITICAL' ? 'text-red-600' : severity === 'URGENT' ? 'text-amber-600' : 'text-green-600'}`}>
                    {severity} broadcast
                  </p>
                  <p className="text-sm font-semibold font-body text-karis-stone-900">{title}</p>
                  <p className="text-xs font-body text-karis-stone-600 mt-1">
                    {body.slice(0, 120)}{body.length > 120 ? '…' : ''}
                  </p>
                </div>
                <div className="text-sm font-body text-karis-stone-600 space-y-1">
                  <p>This will immediately send to <strong>{activeUserCount} active users</strong> via in-app banner and email.</p>
                  <p className="text-karis-stone-500">This action cannot be undone.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold font-body text-karis-stone-700 mb-2">
                    Type <span className="font-mono bg-karis-stone-100 px-1 rounded">{CONFIRM_PHRASE}</span> to confirm
                  </label>
                  <input
                    ref={confirmInputRef}
                    type="text"
                    value={confirmPhrase}
                    onChange={(e) => setConfirmPhrase(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && confirmValid) handleSend() }}
                    placeholder={CONFIRM_PHRASE}
                    autoComplete="off"
                    className="w-full px-4 py-2.5 text-sm font-mono border border-karis-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-karis-green-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2.5 text-sm font-semibold font-body border border-karis-stone-200 rounded-xl text-karis-stone-700 hover:bg-karis-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!confirmValid}
                    className="flex-1 py-2.5 text-sm font-semibold font-body rounded-xl bg-karis-green-700 text-white hover:bg-karis-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Confirm & Send
                  </button>
                </div>
              </>
            )}

            {state === 'sending' && (
              <div className="py-8 flex flex-col items-center gap-4 text-center">
                <svg className="w-8 h-8 animate-spin text-karis-green-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold font-body text-karis-stone-900">Sending broadcast…</p>
                  <p className="text-xs font-body text-karis-stone-500 mt-1">Delivering to all active users. Please wait.</p>
                </div>
              </div>
            )}

            {state === 'done' && result && (
              <>
                <div className="py-4 flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold font-body text-karis-stone-900">Broadcast sent</p>
                    <p className="text-xs font-body text-karis-stone-500 mt-1">
                      {result.sent} delivered{result.failed > 0 ? ` · ${result.failed} failed` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDoneClose}
                  className="w-full py-2.5 text-sm font-semibold font-body rounded-xl bg-karis-green-700 text-white hover:bg-karis-green-800 transition-colors"
                >
                  Close
                </button>
              </>
            )}

            {state === 'error' && (
              <>
                <div className="py-4 flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold font-body text-karis-stone-900">Broadcast failed</p>
                    <p className="text-xs font-body text-red-600 mt-1">{error}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={closeModal} className="flex-1 py-2.5 text-sm font-semibold font-body border border-karis-stone-200 rounded-xl text-karis-stone-700 hover:bg-karis-stone-50 transition-colors">
                    Cancel
                  </button>
                  <button type="button" onClick={() => { setState('confirming'); setConfirmPhrase('') }} className="flex-1 py-2.5 text-sm font-semibold font-body rounded-xl bg-karis-green-700 text-white hover:bg-karis-green-800 transition-colors">
                    Retry
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
