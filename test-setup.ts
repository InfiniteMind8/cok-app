import { vi } from 'vitest'

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue(undefined),
  RateLimitError: class RateLimitError extends Error {
    retryAfterSeconds: number
    constructor(n: number) {
      super(`Too many requests. Please try again in ${n} seconds.`)
      this.name = 'RateLimitError'
      this.retryAfterSeconds = n
    }
  },
  createLimiter: vi.fn(),
  InMemoryRatelimit: vi.fn(),
}))

vi.mock('@/lib/sentry', () => ({
  withSentryAction: vi.fn((fn: unknown) => fn),
  captureActionException: vi.fn(),
}))
