import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Offline · City of Karis',
  description: 'You are offline. Reconnect to continue.',
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-karis-stone-50">
      <div className="max-w-md w-full text-center">
        <p className="font-display text-karis-gold-500 text-sm tracking-[0.2em] uppercase mb-4">
          City of Karis
        </p>
        <h1 className="font-display text-3xl text-karis-green-900 mb-3">You are offline</h1>
        <p className="font-body text-base text-karis-stone-700 mb-8 leading-relaxed">
          The Karis app needs an internet connection. Reconnect, then try again.
        </p>
        <p className="font-body text-xs text-karis-stone-500">
          If you have it installed, recently visited pages may still be available from your home screen icon.
        </p>
      </div>
    </main>
  )
}
