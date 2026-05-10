import Link from 'next/link'
import { ArrowRight, ShieldCheck, Smartphone } from 'lucide-react'
import { BrandLogo } from '@/components/shared/brand-logo'
import { Wordmark } from '@/components/shared/wordmark'

interface PersonaCard {
  href: string
  label: string
  blurb: string
  status: 'live' | 'next'
}

const PERSONAS: PersonaCard[] = [
  {
    href: '/demo/resident',
    label: 'Resident',
    blurb:
      'Wallet, property/tenancy, community announcements, voting, profile. Full owner-resident experience with the multi-currency display toggle working live.',
    status: 'live',
  },
  {
    href: '/demo/master-admin',
    label: 'Master Admin',
    blurb:
      'Treasury dashboard, four-tab approvals centre, data directory, audit log, currency and promotions settings, emergency broadcast, email log.',
    status: 'next',
  },
  {
    href: '/demo/admin',
    label: 'Admin',
    blurb:
      'Scoped dashboard, approvals queue, residents list, audit log. The day-to-day operational view.',
    status: 'next',
  },
  {
    href: '/demo/vendor',
    label: 'Vendor',
    blurb:
      'Vendor dashboard, sales/payments list, profile. Phase 2 portal preview.',
    status: 'next',
  },
  {
    href: '/demo/visitor',
    label: 'Visitor',
    blurb:
      'Visitor dashboard, group memberships, filtered announcements, issue reports — plus a panel showing exactly what visitors cannot do (the §3.2 lockdown made visible).',
    status: 'next',
  },
]

export default function DemoLandingPage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section
        className="px-6 py-16 sm:py-20 text-center relative"
        style={{
          background:
            'radial-gradient(ellipse at 50% -10%, var(--color-karis-green-100) 0%, var(--color-karis-stone-50) 60%)',
        }}
      >
        <BrandLogo size={84} priority className="mx-auto mb-5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.08)]" />
        <Wordmark size="lg" className="mb-3" />
        <p className="font-heading text-xl text-karis-stone-500 max-w-2xl mx-auto leading-snug">
          A read-only tour of every surface, by persona
        </p>
        <p className="font-body text-sm text-karis-stone-500 mt-3 max-w-xl mx-auto leading-relaxed">
          No login, no real data. Click any persona below to walk through their authenticated experience as it appears in production. Interactions are intercepted — nothing writes to the database, no emails are sent.
        </p>

        <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-karis-stone-100 shadow-sm">
          <ShieldCheck size={14} className="text-karis-green-700" aria-hidden="true" />
          <span className="font-body text-xs text-karis-stone-700">
            Synthetic fixtures only · sign-in flow untouched
          </span>
        </div>
      </section>

      {/* Persona cards */}
      <section className="px-4 sm:px-6 pb-16 max-w-6xl mx-auto w-full">
        <h2 className="font-heading text-2xl text-karis-green-900 mb-6 text-center">
          Choose a persona
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PERSONAS.map((persona) => (
            <Link
              key={persona.href}
              href={persona.href}
              className="group block bg-white border border-karis-stone-100 rounded-2xl shadow-sm hover:shadow-md hover:border-karis-gold-300 transition-all duration-200 p-6"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-heading text-lg text-karis-green-900 leading-tight">
                  {persona.label}
                </h3>
                {persona.status === 'live' ? (
                  <span className="shrink-0 font-body text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-karis-green-900 text-white">
                    Live
                  </span>
                ) : (
                  <span className="shrink-0 font-body text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-karis-stone-100 text-karis-stone-700">
                    Coming next
                  </span>
                )}
              </div>
              <p className="font-body text-sm text-karis-stone-500 leading-relaxed mb-4">
                {persona.blurb}
              </p>
              <span className="inline-flex items-center gap-1 font-body text-sm text-karis-green-700 group-hover:text-karis-green-900 transition-colors">
                Start tour
                <ArrowRight
                  size={14}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Mobile preview prompt */}
      <section className="px-4 sm:px-6 pb-20 max-w-3xl mx-auto w-full">
        <div className="bg-karis-green-900 text-white rounded-2xl p-6 sm:p-8 flex items-start gap-5 border-l-4 border-l-karis-gold-500">
          <div className="shrink-0 w-12 h-12 rounded-full bg-karis-green-700 flex items-center justify-center">
            <Smartphone size={20} aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading text-xl mb-1">View on your phone</h3>
            <p className="font-body text-sm text-karis-stone-300 leading-relaxed">
              Most resident surfaces are mobile-first. Open this URL on a phone to see the tab bar and modal sheets as they appear in production.
            </p>
            <p className="font-body text-xs text-karis-stone-300 mt-3">
              Tip: paste the URL into your phone&rsquo;s browser, or AirDrop the link from Safari.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-karis-stone-100 px-6 py-6 text-center bg-white">
        <Wordmark size="sm" className="opacity-50 text-karis-stone-500" />
        <p className="font-body text-xs text-karis-stone-500 mt-2">
          Demo preview · all data synthetic · no authentication ·{' '}
          <Link
            href="/sign-in"
            className="underline underline-offset-2 hover:text-karis-green-900 transition-colors"
          >
            Sign in to the real app
          </Link>
        </p>
      </footer>
    </main>
  )
}
