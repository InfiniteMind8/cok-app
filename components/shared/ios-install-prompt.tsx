'use client'

import { useState, useEffect, startTransition } from 'react'
import { X, Share } from 'lucide-react'

export function IOSInstallPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const isIOS =
      /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const dismissed = localStorage.getItem('karis-ios-prompt-dismissed') === '1'

    if (isIOS && !isStandalone && !dismissed) {
      startTransition(() => setVisible(true))
    }
  }, [])

  function dismiss() {
    localStorage.setItem('karis-ios-prompt-dismissed', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-karis-green-900 text-white rounded-2xl shadow-md px-4 py-3 flex items-start gap-3">
      <Share size={18} className="shrink-0 mt-0.5 text-karis-gold-300" />
      <div className="flex-1">
        <p className="font-body text-sm font-medium">Add to Home Screen</p>
        <p className="font-body text-xs text-karis-green-100 mt-0.5 leading-relaxed">
          Tap the share icon below, then &ldquo;Add to Home Screen&rdquo; for the full Karis experience.
        </p>
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 text-karis-green-300 hover:text-white transition-colors duration-150 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-1"
      >
        <X size={18} />
      </button>
    </div>
  )
}
