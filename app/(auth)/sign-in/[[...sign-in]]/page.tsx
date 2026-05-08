import Link from 'next/link'
import { Suspense } from 'react'
import { SignInForm } from './_components/sign-in-form'
import { DemoBlock } from './_components/demo-block'

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED === 'true'

export default function SignInPage() {
  return (
    <>
      {/* Card — §4.5: max-w 420px, white surface, stone-300 border, 16px radius, 32px padding */}
      <section
        aria-label="Sign in to City of Karis"
        className="w-full max-w-[420px] bg-white border border-karis-stone-300 rounded-2xl shadow-[0_4px_16px_oklch(0.20_0.05_155_/_0.08)]"
      >
        <div className="p-8">
          {/* SignInForm manages its own heading per view state */}
          <Suspense>
            <SignInForm />
          </Suspense>
        </div>

        <div className="px-8 pb-6 pt-4 border-t border-karis-stone-300 text-center">
          <Link
            href="/sign-up"
            className="font-body text-xs text-karis-stone-700 hover:text-karis-green-700 transition-colors duration-[120ms]"
          >
            New to Karis? Create account
          </Link>
        </div>
      </section>

      {/* Demo block — rendered server-side only when flag is true (no hidden divs when off) */}
      {isDemoMode && <DemoBlock />}
    </>
  )
}
