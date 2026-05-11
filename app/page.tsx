import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { meApi, ApiClientError } from '@/lib/api'
import { getServerApi } from '@/lib/api/server'
import { BrandLogo } from '@/components/shared/brand-logo'
import { Wordmark } from '@/components/shared/wordmark'
import { Badge } from '@/components/ui/badge'

export default async function HomePage() {
  const { userId } = await auth()

  if (userId) {
    let user: { role: string; fullName: string } | null = null
    try {
      user = await meApi.get(getServerApi())
    } catch (err) {
      // Unknown user / deactivated → fall through to public hero
      if (!(err instanceof ApiClientError)) throw err
    }
    if (user) {
      if (user.role === 'MASTER_ADMIN') redirect('/admin/dashboard')
      if (user.role === 'RESIDENT' || user.role === 'VISITOR') redirect('/wallet')
      // ADMIN or VENDOR — Phase 2 placeholder
      return <ComingSoonPage name={user.fullName} role={user.role} />
    }
  }

  return <HeroPage />
}

function HeroPage() {
  return (
    <div className="min-h-screen bg-karis-stone-50 flex flex-col">
      {/* Full-bleed hero — stone/green radial gradient, brand-justified */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center relative"
        style={{
          background:
            'radial-gradient(ellipse at 50% -5%, var(--color-karis-green-100) 0%, var(--color-karis-stone-50) 65%)',
        }}
      >
        <BrandLogo
          size={160}
          priority
          className="mb-8 drop-shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
        />

        <Wordmark size="xl" className="mb-3 text-5xl sm:text-6xl" />

        <p className="font-heading text-xl text-karis-stone-500 mb-2 max-w-sm leading-snug">
          Beautiful, Empowered Living in Guyana
        </p>
        <p className="font-body text-sm text-karis-stone-400 mb-10 max-w-xs">
          Where global standards meet Guyanese soul
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:justify-center">
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center px-8 py-3 bg-karis-green-900 text-white font-body text-sm rounded-lg hover:bg-karis-green-700 transition-colors duration-150 min-h-[44px]"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center px-8 py-3 border border-karis-gold-500 text-karis-green-900 font-body text-sm rounded-lg hover:bg-karis-gold-300/20 transition-colors duration-150 min-h-[44px]"
          >
            Join the founding cohort
          </Link>
        </div>

        <Link
          href="/about/founders"
          className="mt-5 font-body text-xs text-karis-stone-400 hover:text-karis-gold-700 transition-colors underline underline-offset-4"
        >
          Meet the founders
        </Link>
      </div>

      {/* Feature strips */}
      <div className="border-t border-karis-stone-100 px-6 py-16 max-w-4xl mx-auto w-full">
        <div className="grid sm:grid-cols-3 gap-10">
          <div>
            <h3 className="font-heading text-lg text-karis-green-900 mb-2">
              Beautiful, empowered living
            </h3>
            <p className="font-body text-sm text-karis-stone-500 leading-relaxed">
              Off-grid solar with 72-hour battery backup. Telemedicine consultation
              within 15 minutes. High-speed fibre internet. Standards that
              don&apos;t ask you to compromise.
            </p>
          </div>
          <div>
            <h3 className="font-heading text-lg text-karis-green-900 mb-2">
              Off-grid by design
            </h3>
            <p className="font-body text-sm text-karis-stone-500 leading-relaxed">
              City of Karis is built for self-sufficiency — water, power, food,
              and community governance designed to thrive independently of the grid.
            </p>
          </div>
          <div>
            <h3 className="font-heading text-lg text-karis-green-900 mb-2">
              A community app, not just an app
            </h3>
            <p className="font-body text-sm text-karis-stone-500 leading-relaxed">
              K Credits power everything — from weekly groceries to wellness
              sessions to property installments. Every transaction strengthens
              the community.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-karis-stone-100 px-6 py-6 text-center">
        <Wordmark size="sm" className="opacity-50 text-karis-stone-500" />
        <p className="font-body text-xs text-karis-stone-500 mt-2">
          @cityofkaris &middot; @karisguyana &middot; Guyana{' '}
          <span aria-label="Guyana" role="img">
            🇬🇾
          </span>{' '}
          &middot; 2026
        </p>
      </footer>
    </div>
  )
}

function ComingSoonPage({ name, role }: { name: string; role: string }) {
  return (
    <div className="min-h-screen bg-karis-stone-50 flex flex-col items-center justify-center p-8 text-center">
      <BrandLogo size={56} priority className="mb-6" />
      <Wordmark size="lg" className="mb-2" />
      <p className="font-body text-karis-stone-500 text-sm mb-6">
        Welcome back, {name}
      </p>
      <Badge
        variant="secondary"
        className="mb-6 font-body text-xs uppercase tracking-wider"
      >
        {role.replace('_', ' ')}
      </Badge>
      <div className="max-w-sm bg-white border border-karis-stone-100 rounded-xl p-8 shadow-sm">
        <h2 className="font-heading text-xl text-karis-green-900 mb-3">
          Your dashboard is on its way
        </h2>
        <p className="font-body text-sm text-karis-stone-500 leading-relaxed">
          Phase 2 brings the full vendor and admin experience. You&apos;ll hear
          from us soon.
        </p>
      </div>
    </div>
  )
}
