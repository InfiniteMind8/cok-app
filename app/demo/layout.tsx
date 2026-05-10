import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Toaster } from '@/components/ui/sonner'
import { DemoBanner } from './_components/demo-banner'
import { PersonaSwitcher } from './_components/persona-switcher'

export const metadata: Metadata = {
  title: 'Demo preview · City of Karis',
  description:
    'Read-only UX/UI tour of the City of Karis community app. No authentication required.',
  robots: { index: false, follow: false, nocache: true },
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_DEMO_SHOWCASE_ENABLED !== 'true') {
    notFound()
  }

  return (
    <div className="min-h-screen bg-karis-stone-50 flex flex-col">
      <DemoBanner />
      <PersonaSwitcher />
      <div className="flex-1 flex flex-col">{children}</div>
      <Toaster richColors closeButton position="top-right" />
    </div>
  )
}
