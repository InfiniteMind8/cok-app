'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { adminEmailsApi, getBrowserApi, ApiClientError } from '@/lib/api'

export function ResendButton({ logId }: { logId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleClick() {
    setState('loading')
    try {
      await adminEmailsApi.resend(getBrowserApi(), logId)
      setState('done')
    } catch (err) {
      setState('error')
      setErrorMsg(err instanceof ApiClientError ? err.message : 'Unexpected error')
    }
  }

  if (state === 'done') {
    return <span className="text-xs text-emerald-600 font-body">Resent</span>
  }

  if (state === 'error') {
    return <span className="text-xs text-red-600 font-body" title={errorMsg}>Failed</span>
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      className="flex items-center gap-1.5 text-xs text-karis-green-700 hover:text-karis-green-900 font-body disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      aria-label="Resend this email"
    >
      <RefreshCw size={12} className={state === 'loading' ? 'animate-spin' : ''} />
      {state === 'loading' ? 'Sending…' : 'Resend'}
    </button>
  )
}
