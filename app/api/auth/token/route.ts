import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getDemoAccount } from '@/lib/demo-mode'

const requestSchema = z.object({
  userId: z.string().regex(/^user_/, 'Must be a Clerk user id'),
})

// D.4 inline — was `InMemoryRatelimit` from @/lib/rate-limit (deleted).
// In-process fixed-window limiter: 10 mints / 15 min / IP. Process-scoped
// (sufficient for dev/demo; backend has the full Upstash-backed limiter).
const demoMintHits = new Map<string, { count: number; resetAt: number }>()
const DEMO_LIMIT = 10
const DEMO_WINDOW_MS = 900_000

function checkDemoMintLimit(ip: string): {
  ok: boolean
  reset: number
} {
  const now = Date.now()
  const entry = demoMintHits.get(ip)
  if (!entry || entry.resetAt < now) {
    demoMintHits.set(ip, { count: 1, resetAt: now + DEMO_WINDOW_MS })
    return { ok: true, reset: now + DEMO_WINDOW_MS }
  }
  if (entry.count >= DEMO_LIMIT) return { ok: false, reset: entry.resetAt }
  entry.count += 1
  return { ok: true, reset: entry.resetAt }
}

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
  const rateLimit = checkDemoMintLimit(getClientIp(req))

  if (!rateLimit.ok) {
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

  // D.4 inline — was `createAuditEntry` from @/lib/audit (deleted).
  // Direct AuditLog insert; same shape as the helper.
  await db.auditLog.create({
    data: {
      action: 'DEMO_TOKEN_MINT',
      entity: 'DemoSession',
      entityId: userId,
      actorId: userId,
      after: {
        requestedUserId: userId,
        name: account.name,
        role: account.role,
      },
    },
  })

  return Response.json({ token: data.token })
}
