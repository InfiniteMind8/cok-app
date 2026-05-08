import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { BrandLogo } from '@/components/shared/brand-logo'
import { AccessCallbackClient } from './_components/access-callback-client'

export default function AccessCallbackPage() {
  if (process.env.NODE_ENV === 'production') redirect('/')

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 gap-6"
      style={{ background: 'oklch(0.13 0.01 70)' }}
    >
      <BrandLogo size={64} priority />
      <Suspense
        fallback={
          <p
            className="font-body text-sm animate-pulse"
            style={{ color: 'oklch(0.45 0.01 70)' }}
          >
            Signing in…
          </p>
        }
      >
        <AccessCallbackClient />
      </Suspense>
    </div>
  )
}
