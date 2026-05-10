import { BrandLogo } from '@/components/shared/brand-logo'
import { Wordmark } from '@/components/shared/wordmark'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-karis-stone-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Brand header — §4.5: wordmark above card, tagline in Inter italic */}
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <BrandLogo size={52} priority className="mb-2" />
        <Wordmark size="lg" />
        <p className="font-body italic text-sm text-karis-stone-700">
          A community, by design.
        </p>
      </div>

      {children}
    </div>
  )
}
