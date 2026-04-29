// No 'server-only' — used in both edge middleware (proxy.ts) and Node.js server actions.
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import * as Sentry from '@sentry/nextjs'

export type RateLimitScope = 'auth' | 'mfa' | 'mutation' | 'bulk-import' | 'email-send'

type WindowUnit = 's' | 'm' | 'h' | 'd'
type WindowDuration = `${number} ${WindowUnit}`

const SCOPE_CONFIG: Record<
  RateLimitScope,
  { tokens: number; window: WindowDuration; windowMs: number }
> = {
  auth:           { tokens: 5,  window: '15 m', windowMs: 15 * 60 * 1000 },
  mfa:            { tokens: 10, window: '15 m', windowMs: 15 * 60 * 1000 },
  mutation:       { tokens: 60, window: '1 m',  windowMs: 60 * 1000 },
  'bulk-import':  { tokens: 3,  window: '1 h',  windowMs: 60 * 60 * 1000 },
  'email-send':   { tokens: 30, window: '1 h',  windowMs: 60 * 60 * 1000 },
}

export class RateLimitError extends Error {
  readonly retryAfterSeconds: number
  constructor(retryAfterSeconds: number) {
    super(`Too many requests. Please try again in ${retryAfterSeconds} seconds.`)
    this.name = 'RateLimitError'
    this.retryAfterSeconds = retryAfterSeconds
  }
}

type LimitResult = { success: boolean; limit: number; remaining: number; reset: number }

interface RateLimiterInterface {
  limit(key: string): Promise<LimitResult> | LimitResult
}

// In-memory fallback for dev/test (process-scoped; does not persist across edge isolates).
// Note: In edge middleware, each invocation may be a separate isolate — auth limits only
// enforce reliably with Redis configured (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN).
export class InMemoryRatelimit implements RateLimiterInterface {
  private windows = new Map<string, { count: number; reset: number }>()

  constructor(
    private tokens: number,
    private windowMs: number,
  ) {}

  limit(key: string): LimitResult {
    const now = Date.now()
    const w = this.windows.get(key)

    if (!w || w.reset <= now) {
      this.windows.set(key, { count: 1, reset: now + this.windowMs })
      return { success: true, limit: this.tokens, remaining: this.tokens - 1, reset: now + this.windowMs }
    }

    if (w.count >= this.tokens) {
      return { success: false, limit: this.tokens, remaining: 0, reset: w.reset }
    }

    w.count++
    return { success: true, limit: this.tokens, remaining: this.tokens - w.count, reset: w.reset }
  }
}

// Factory: Redis-backed in production when env vars present, in-memory otherwise.
export function createLimiter(scope: RateLimitScope): RateLimiterInterface {
  const cfg = SCOPE_CONFIG[scope]
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (url && token) {
    return new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.fixedWindow(cfg.tokens, cfg.window),
      prefix: 'cok:rl',
    })
  }

  return new InMemoryRatelimit(cfg.tokens, cfg.windowMs)
}

// Module-level lazy singletons — one limiter instance per scope.
const _limiters = new Map<RateLimitScope, RateLimiterInterface>()

function getLimiter(scope: RateLimitScope): RateLimiterInterface {
  if (!_limiters.has(scope)) _limiters.set(scope, createLimiter(scope))
  return _limiters.get(scope)!
}

export interface CheckRateLimitOptions {
  identifier: string
  scope: RateLimitScope
}

// Throws RateLimitError when the identifier has exceeded the scope limit.
// Logs a Sentry warning on every denial. Audit logging of admin action rate-limits
// is handled at the call site (server actions can await createAuditEntry after catching).
export async function checkRateLimit(opts: CheckRateLimitOptions): Promise<void> {
  const result = await getLimiter(opts.scope).limit(`${opts.scope}:${opts.identifier}`)

  if (!result.success) {
    const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))

    Sentry.captureMessage('Rate limit exceeded', {
      level: 'warning',
      tags: { scope: opts.scope },
      extra: { identifier: opts.identifier, retryAfterSeconds: retryAfter },
    })

    throw new RateLimitError(retryAfter)
  }
}
