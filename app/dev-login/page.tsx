import { redirect } from 'next/navigation'
import { DevSignInButton } from './_components/dev-sign-in-button'

const TEST_USERS = [
  {
    id: 'user_3CtmfDZfRg9T21vmoAEMqwKj5co',
    name: 'Karis Munroe',
    email: 'karis@cityofkaris.com',
    role: 'MASTER_ADMIN',
  },
  {
    id: 'user_3CtmfI4l73YuvWDzzAT1H9I3g91',
    name: 'Naomi Wells',
    email: 'naomi@cityofkaris.com',
    role: 'ADMIN',
  },
  {
    id: 'user_3CtmfMWnpFibGSGws37JEW7FFwH',
    name: 'Devon McKenzie',
    email: 'devon@example.com',
    role: 'RESIDENT',
  },
  {
    id: 'user_3CtmfKH80kXydPxKBsxVjFfgZLP',
    name: 'Anjali Pereira',
    email: 'anjali@pereirawellness.com',
    role: 'RESIDENT',
  },
  {
    id: 'user_3CtmfWRMtnrt8gecUHkqyQ0CMZk',
    name: 'Aaliyah Singh',
    email: 'aaliyah@example.com',
    role: 'VENDOR',
  },
  {
    id: 'user_3CtmfSIS8UizzHXbLQQfbyC5o5w',
    name: 'Marcus Bowen',
    email: 'marcus@example.com',
    role: 'VISITOR',
  },
]

const ROLE_BADGE: Record<string, string> = {
  MASTER_ADMIN: 'bg-karis-green-900 text-white',
  ADMIN: 'bg-karis-green-700 text-white',
  RESIDENT: 'bg-karis-gold-700 text-white',
  VENDOR: 'bg-karis-stone-600 text-white',
  VISITOR: 'bg-karis-stone-300 text-karis-stone-800',
}

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

export default async function DevLoginPage() {
  if (process.env.NODE_ENV === 'production') redirect('/')

  const users = await Promise.all(
    TEST_USERS.map(async (u) => ({ ...u, token: await generateToken(u.id) })),
  )

  return (
    <div className="min-h-screen bg-karis-stone-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-3">
        <div className="text-center mb-8">
          <p className="font-body text-xs text-karis-stone-400 uppercase tracking-widest mb-2">Development</p>
          <h1 className="font-heading text-2xl text-karis-green-900">Quick Sign In</h1>
          <p className="font-body text-sm text-karis-stone-500 mt-1">
            One click — tokens refresh on each page load
          </p>
        </div>

        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white border border-karis-stone-100 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0">
                <p className="font-body text-sm font-medium text-karis-stone-900">{user.name}</p>
                <p className="font-body text-xs text-karis-stone-400 truncate">{user.email}</p>
              </div>
              <span
                className={`ml-2 shrink-0 font-body text-xs px-2 py-0.5 rounded-full ${ROLE_BADGE[user.role] ?? 'bg-karis-stone-200'}`}
              >
                {user.role.replace('_', ' ')}
              </span>
            </div>

            {user.token ? (
              <DevSignInButton firstName={user.name.split(' ')[0]} token={user.token} />
            ) : (
              <p className="font-body text-xs text-status-red text-center py-2">
                Token generation failed — check CLERK_SECRET_KEY
              </p>
            )}
          </div>
        ))}

        <p className="font-body text-xs text-karis-stone-300 text-center pt-4">
          This page is disabled in production
        </p>
      </div>
    </div>
  )
}
