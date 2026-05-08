import { redirect } from 'next/navigation'
import { BrandLogo } from '@/components/shared/brand-logo'
import { listDemoAccounts } from '@/lib/demo-mode'
import { AccessButtonWrapper } from './_components/access-button-wrapper'

export default function AccessPage() {
  if (process.env.NODE_ENV === 'production') redirect('/')

  const accounts = listDemoAccounts()

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden"
      style={{ background: 'oklch(0.13 0.01 70)' }}
    >
      {/* Gold ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 50% 0%, oklch(0.72 0.13 75 / 0.10) 0%, transparent 65%)',
        }}
      />

      {/* Header */}
      <div className="relative flex flex-col items-center mb-10">
        <BrandLogo size={96} priority className="mb-6" />
        <p
          className="font-body text-xs tracking-[0.22em] uppercase mb-1"
          style={{ color: 'oklch(0.72 0.13 75 / 0.65)' }}
        >
          City of Karis
        </p>
        <h1
          className="font-display text-2xl font-medium"
          style={{ color: 'oklch(0.95 0.005 70)' }}
        >
          Demo access
        </h1>
        <p
          className="font-body text-xs mt-1"
          style={{ color: 'oklch(0.45 0.01 70)' }}
        >
          One click - no password required
        </p>
      </div>

      {/* Account grid */}
      <div className="relative w-full max-w-lg grid sm:grid-cols-2 gap-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex flex-col gap-3 rounded-xl p-5 border"
            style={{
              background: 'oklch(0.18 0.01 70)',
              borderColor: 'oklch(0.72 0.13 75 / 0.12)',
            }}
          >
            <div>
              <p
                className="font-body text-sm font-medium mb-0.5"
                style={{ color: 'oklch(0.95 0.005 70)' }}
              >
                {account.name}
              </p>
              <p
                className="font-body text-[11px] tracking-wider uppercase"
                style={{ color: 'oklch(0.72 0.13 75 / 0.75)' }}
              >
                {account.title}
              </p>
            </div>

            <p
              className="font-body text-xs leading-relaxed flex-1"
              style={{ color: 'oklch(0.55 0.015 70)' }}
            >
              {account.description}
            </p>

            <AccessButtonWrapper
              userId={account.id}
              firstName={account.name.split(' ')[0]}
            />
          </div>
        ))}
      </div>

      <p
        className="relative mt-10 font-body text-xs"
        style={{ color: 'oklch(0.35 0.01 70)' }}
      >
        Demo accounts only &middot; sign-in tokens generated on each click
      </p>
    </div>
  )
}
