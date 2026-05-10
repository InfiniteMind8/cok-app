import Link from 'next/link'
import { ArrowRight, Eye } from 'lucide-react'

export function DemoBanner() {
  return (
    <div
      role="status"
      aria-label="Demo preview banner"
      className="sticky top-0 z-40 w-full bg-karis-gold-100 border-b border-karis-gold-700/30"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Eye size={14} className="text-karis-green-900 shrink-0" aria-hidden="true" />
          <p className="font-body text-xs sm:text-sm text-karis-green-900 truncate">
            <span className="font-medium">Demo preview</span>
            <span className="text-karis-green-700"> — interactions disabled.</span>
          </p>
        </div>
        <Link
          href="/sign-in"
          className="shrink-0 inline-flex items-center gap-1.5 font-body text-xs sm:text-sm text-karis-green-900 underline underline-offset-4 decoration-karis-gold-700 hover:decoration-karis-green-900 transition-colors"
        >
          Sign in
          <ArrowRight size={12} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
