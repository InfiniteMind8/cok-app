import { redirect } from 'next/navigation'
import { BrandLogo } from '@/components/shared/brand-logo'
import { LoginButton } from './_components/login-button'

const ACCOUNTS = [
  {
    id: 'user_3CtmfDZfRg9T21vmoAEMqwKj5co',
    name: 'Karis Munroe',
    title: 'Master Admin',
    description: 'Full platform access — treasury, accounts, settings',
  },
  {
    id: 'user_3CtmfI4l73YuvWDzzAT1H9I3g91',
    name: 'Naomi Wells',
    title: 'Admin',
    description: 'Approvals, community management, member support',
  },
  {
    id: 'user_3CtmfMWnpFibGSGws37JEW7FFwH',
    name: 'Devon McKenzie',
    title: 'Resident',
    description: 'Wallet, property, community — full resident experience',
  },
  {
    id: 'user_3CtmfKH80kXydPxKBsxVjFfgZLP',
    name: 'Anjali Pereira',
    title: 'Resident',
    description: 'Pending settlement request, active community member',
  },
  {
    id: 'user_3CtmfWRMtnrt8gecUHkqyQ0CMZk',
    name: 'Aaliyah Singh',
    title: 'Vendor',
    description: 'Vendor wallet access — Phase 2 portal coming soon',
  },
  {
    id: 'user_3CtmfSIS8UizzHXbLQQfbyC5o5w',
    name: 'Marcus Bowen',
    title: 'Visitor',
    description: 'Limited access — wallet only, no property tab',
  },
]

async function generateToken(userId: string): Promise<string | null> {
  const key = process.env.CLERK_SECRET_KEY
  if (!key) return null
  try {
    const res = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, expires_in_seconds: 3600 }),
      cache: 'no-store',
    })
    const data = await res.json()
    return data.token ?? null
  } catch {
    return null
  }
}

export default async function LoginPage() {
  if (process.env.NODE_ENV === 'production') redirect('/')

  const accounts = await Promise.all(
    ACCOUNTS.map(async (a) => ({ ...a, token: await generateToken(a.id) })),
  )

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden"
      style={{ background: 'oklch(0.13 0.01 70)' }}
    >
      {/* Gold glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, oklch(0.72 0.13 75 / 0.10) 0%, transparent 65%)',
        }}
      />

      {/* Header */}
      <div className="relative flex flex-col items-center mb-12">
        <BrandLogo size={72} priority className="mb-5" />
        <p
          className="font-body text-xs tracking-[0.22em] uppercase mb-1"
          style={{ color: 'oklch(0.72 0.13 75 / 0.7)' }}
        >
          City of Karis
        </p>
        <h1
          className="font-display text-2xl font-medium"
          style={{ color: 'oklch(0.95 0.005 70)' }}
        >
          Select an account
        </h1>
      </div>

      {/* Account cards */}
      <div className="relative w-full max-w-lg grid sm:grid-cols-2 gap-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex flex-col gap-3 rounded-xl p-5 border"
            style={{
              background: 'oklch(0.18 0.01 70)',
              borderColor: 'oklch(0.72 0.13 75 / 0.15)',
            }}
          >
            {/* Name + role */}
            <div>
              <p
                className="font-body text-sm font-medium mb-0.5"
                style={{ color: 'oklch(0.95 0.005 70)' }}
              >
                {account.name}
              </p>
              <p
                className="font-body text-[11px] tracking-wider uppercase"
                style={{ color: 'oklch(0.72 0.13 75 / 0.8)' }}
              >
                {account.title}
              </p>
            </div>

            {/* Description */}
            <p
              className="font-body text-xs leading-relaxed flex-1"
              style={{ color: 'oklch(0.65 0.02 70)' }}
            >
              {account.description}
            </p>

            {/* Button */}
            {account.token ? (
              <LoginButton firstName={account.name.split(' ')[0]} token={account.token} />
            ) : (
              <p className="text-xs text-center font-body" style={{ color: 'oklch(0.58 0.21 25)' }}>
                Token failed — check CLERK_SECRET_KEY
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p
        className="relative mt-10 font-body text-xs"
        style={{ color: 'oklch(0.40 0.01 70)' }}
      >
        Tokens refresh on each page load &middot; disabled in production
      </p>
    </div>
  )
}
