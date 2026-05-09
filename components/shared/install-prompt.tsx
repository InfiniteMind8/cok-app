'use client'

import { useEffect, useState, startTransition } from 'react'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STORAGE_KEY = 'karis-install-prompt-dismissed'

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    if (isStandalone) return
    if (localStorage.getItem(STORAGE_KEY) === '1') return

    function handler(e: Event) {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      startTransition(() => setVisible(true))
    }
    window.addEventListener('beforeinstallprompt', handler)

    function installed() {
      localStorage.setItem(STORAGE_KEY, '1')
      setVisible(false)
    }
    window.addEventListener('appinstalled', installed)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installed)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted' || outcome === 'dismissed') {
      localStorage.setItem(STORAGE_KEY, '1')
      setVisible(false)
    }
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-karis-green-900 text-white rounded-2xl shadow-md px-4 py-3 flex items-start gap-3">
      <Download size={18} className="shrink-0 mt-0.5 text-karis-gold-300" />
      <div className="flex-1">
        <p className="font-body text-sm font-medium">Install Karis</p>
        <p className="font-body text-xs text-karis-green-100 mt-0.5 leading-relaxed">
          Install the app for full-screen access and faster navigation.
        </p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={install}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-karis-gold-500 text-karis-green-900 hover:bg-karis-gold-300 transition-colors min-h-[36px]"
          >
            Install
          </button>
          <button
            onClick={dismiss}
            className="text-xs font-medium px-3 py-1.5 rounded-full text-karis-green-100 hover:text-white transition-colors min-h-[36px]"
          >
            Not now
          </button>
        </div>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="shrink-0 text-karis-green-300 hover:text-white transition-colors duration-150 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-1"
      >
        <X size={18} />
      </button>
    </div>
  )
}
