import { BrandLogo } from '@/components/shared/brand-logo'
import { Wordmark } from '@/components/shared/wordmark'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-karis-stone-50 flex flex-col items-center justify-center p-4">
      <div className="mb-6 flex flex-col items-center gap-2">
        <BrandLogo size={56} priority />
        <p className="font-heading text-base text-karis-stone-500">
          Welcome to City of Karis
        </p>
      </div>

      {children}

      <div className="mt-6">
        <Wordmark size="sm" className="opacity-50" />
      </div>
    </div>
  )
}
