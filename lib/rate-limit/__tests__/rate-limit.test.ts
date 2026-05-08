import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InMemoryRatelimit, RateLimitError, checkRateLimit, createLimiter } from '../index'

vi.mock('@sentry/nextjs', () => ({
  captureMessage: vi.fn(),
}))

vi.mock('@/lib/db', () => ({ db: {} }))

import * as Sentry from '@sentry/nextjs'

// ── InMemoryRatelimit boundary tests ────────────────────────────────────────

describe('InMemoryRatelimit', () => {
  it('allows requests up to the token limit', async () => {
    const limiter = new InMemoryRatelimit(5, 15 * 60 * 1000)
    for (let i = 0; i < 5; i++) {
      const result = await limiter.limit('user:test')
      expect(result.success).toBe(true)
    }
  })

  it('denies the request that crosses the limit boundary', async () => {
    const limiter = new InMemoryRatelimit(5, 15 * 60 * 1000)
    for (let i = 0; i < 5; i++) await limiter.limit('user:boundary')
    const result = await limiter.limit('user:boundary')
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.reset).toBeGreaterThan(Date.now())
  })

  it('bulk-import scope allows 3, denies on 4th', async () => {
    const limiter = new InMemoryRatelimit(3, 60 * 60 * 1000)
    for (let i = 0; i < 3; i++) {
      const r = await limiter.limit('user:import')
      expect(r.success).toBe(true)
    }
    const denied = await limiter.limit('user:import')
    expect(denied.success).toBe(false)
  })

  it('different identifiers do not interfere', async () => {
    const limiter = new InMemoryRatelimit(2, 60 * 1000)
    await limiter.limit('user:alice')
    await limiter.limit('user:alice')
    // alice is now at limit; bob should still be allowed
    const result = await limiter.limit('user:bob')
    expect(result.success).toBe(true)
  })

  it('resets the window after windowMs elapses', async () => {
    vi.useFakeTimers()
    const limiter = new InMemoryRatelimit(2, 1000) // 1-second window
    await limiter.limit('user:reset')
    await limiter.limit('user:reset') // at limit

    vi.advanceTimersByTime(1001)

    const result = await limiter.limit('user:reset')
    expect(result.success).toBe(true)
    vi.useRealTimers()
  })
})

// ── RateLimitError ────────────────────────────────────────────────────────

describe('RateLimitError', () => {
  it('has name RateLimitError', () => {
    const err = new RateLimitError(30)
    expect(err.name).toBe('RateLimitError')
  })

  it('exposes retryAfterSeconds', () => {
    const err = new RateLimitError(42)
    expect(err.retryAfterSeconds).toBe(42)
    expect(err.message).toContain('42')
  })
})

// ── checkRateLimit ────────────────────────────────────────────────────────

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves without throwing when under the limit', async () => {
    // Each test gets fresh module-level limiters — not ideal, but we can use
    // a unique identifier per test to avoid cross-test interference.
    await expect(
      checkRateLimit({ identifier: 'unit-test-allowed', scope: 'mutation' }),
    ).resolves.toBeUndefined()
  })

  it('throws RateLimitError when limit is exceeded', async () => {
    // Exhaust the auth limit (5) using a unique identifier
    const id = `unit-test-auth-${Date.now()}`
    for (let i = 0; i < 5; i++) {
      await checkRateLimit({ identifier: id, scope: 'auth' })
    }
    await expect(
      checkRateLimit({ identifier: id, scope: 'auth' }),
    ).rejects.toThrow(RateLimitError)
  })

  it('captures a Sentry warning on denial', async () => {
    const id = `unit-test-sentry-${Date.now()}`
    for (let i = 0; i < 5; i++) {
      await checkRateLimit({ identifier: id, scope: 'auth' })
    }
    await expect(checkRateLimit({ identifier: id, scope: 'auth' })).rejects.toThrow()
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Rate limit exceeded',
      expect.objectContaining({ level: 'warning' }),
    )
  })

  it('RateLimitError retryAfterSeconds is a positive integer', async () => {
    const id = `unit-test-retry-${Date.now()}`
    for (let i = 0; i < 5; i++) {
      await checkRateLimit({ identifier: id, scope: 'auth' })
    }
    try {
      await checkRateLimit({ identifier: id, scope: 'auth' })
      expect.fail('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(RateLimitError)
      expect((e as RateLimitError).retryAfterSeconds).toBeGreaterThan(0)
      expect(Number.isInteger((e as RateLimitError).retryAfterSeconds)).toBe(true)
    }
  })
})

// ── createLimiter ────────────────────────────────────────────────────────

describe('createLimiter', () => {
  it('returns InMemoryRatelimit when Upstash env vars absent', () => {
    const originalUrl = process.env.UPSTASH_REDIS_REST_URL
    const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN

    const limiter = createLimiter('mutation')
    expect(limiter).toBeInstanceOf(InMemoryRatelimit)

    process.env.UPSTASH_REDIS_REST_URL = originalUrl
    process.env.UPSTASH_REDIS_REST_TOKEN = originalToken
  })
})
