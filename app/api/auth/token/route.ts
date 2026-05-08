import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { createAuditEntry } from '@/lib/audit'
import { getDemoAccount } from '@/lib/demo-mode'
import { InMemoryRatelimit } from '@/lib/rate-limit'

const requestSchema = z.object({
  userId: z.string().regex(/^user_/, 'Must be a Clerk user id'),
})

const demoTokenMintLimiter = new InMemoryRatelimit(10, 900 * 1000)
const DEMO_TOKEN_MINT_SCOPE = 'demo-token-mint'

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for')
  const firstForwardedIp = forwardedFor?.split(',')[0]?.trim()
  return firstForwardedIp || req.headers.get('x-real-ip') || 'unknown'
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { userId } = parsed.data
  const rateLimit = await demoTokenMintLimiter.limit(
    `${DEMO_TOKEN_MINT_SCOPE}:${getClientIp(req)}`,
  )

  if (!rateLimit.success) {
    const retryAfter = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000))
    return Response.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }

  const account = getDemoAccount(userId)

  if (!account) {
    return Response.json({ error: 'Not a demo account' }, { status: 403 })
  }

  const key = process.env.CLERK_SECRET_KEY
  if (!key) return Response.json({ error: 'Server misconfiguration' }, { status: 500 })

  const res = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, expires_in_seconds: 300 }),
  })
  const data = await res.json()

  if (!data.token) {
    return Response.json({ error: 'Token generation failed' }, { status: 500 })
  }

  await createAuditEntry({
    action: 'DEMO_TOKEN_MINT',
    entity: 'DemoSession',
    entityId: userId,
    actorId: userId,
    after: {
      requestedUserId: userId,
      name: account.name,
      role: account.role,
    },
  })

  return Response.json({ token: data.token })
}
