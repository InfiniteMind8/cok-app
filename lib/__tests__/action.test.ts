import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  checkRateLimit: vi.fn(),
  createAuditEntry: vi.fn(),
  withSentryAction: vi.fn((fn: unknown) => fn),
  captureActionException: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireRole: mocks.requireRole }))
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mocks.checkRateLimit,
  RateLimitError: class RateLimitError extends Error {
    retryAfterSeconds: number
    constructor(n: number) {
      super(`Too many requests. Please try again in ${n} seconds.`)
      this.name = 'RateLimitError'
      this.retryAfterSeconds = n
    }
  },
}))
vi.mock('@/lib/audit', () => ({ createAuditEntry: mocks.createAuditEntry }))
vi.mock('@/lib/sentry', () => ({
  withSentryAction: mocks.withSentryAction,
  captureActionException: mocks.captureActionException,
}))

import { withAdminAction, withResidentAction } from '../action'
import { RateLimitError } from '@/lib/rate-limit'

const ACTOR = { id: 'user-1', role: 'MASTER_ADMIN', email: 'admin@karis.com', fullName: 'Admin' }

describe('withAdminAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRole.mockResolvedValue(ACTOR)
    mocks.checkRateLimit.mockResolvedValue(undefined)
    mocks.createAuditEntry.mockResolvedValue({})
    // withSentryAction passthrough
    mocks.withSentryAction.mockImplementation((fn: unknown) => fn)
  })

  it('resolves with inner fn return value on success', async () => {
    async function _inner(actor: typeof ACTOR, x: number) {
      return actor.id + ':' + x
    }
    const action = withAdminAction(_inner, { roles: ['MASTER_ADMIN'] })
    const result = await action(42)
    expect(result).toBe('user-1:42')
    expect(mocks.requireRole).toHaveBeenCalledWith(['MASTER_ADMIN'])
    expect(mocks.checkRateLimit).toHaveBeenCalledWith({ identifier: 'user-1', scope: 'mutation' })
  })

  it('propagates auth rejection without calling rate limit', async () => {
    mocks.requireRole.mockRejectedValueOnce(new Error('Forbidden'))
    const action = withAdminAction(async (_actor: typeof ACTOR) => 'ok', { roles: ['MASTER_ADMIN'] })
    await expect(action()).rejects.toThrow('Forbidden')
    expect(mocks.checkRateLimit).not.toHaveBeenCalled()
  })

  it('throws RateLimitError and writes audit entry on rate limit exceeded', async () => {
    mocks.checkRateLimit.mockRejectedValueOnce(new RateLimitError(30))
    const action = withAdminAction(async (_actor: typeof ACTOR) => 'ok', { roles: ['MASTER_ADMIN'] })
    await expect(action()).rejects.toThrow('Too many requests')
    expect(mocks.createAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'rate_limit_exceeded',
        entity: 'SYSTEM',
        actorId: 'user-1',
      }),
    )
  })

  it('uses custom scope when specified', async () => {
    const action = withAdminAction(async (_actor: typeof ACTOR) => 'ok', {
      roles: ['MASTER_ADMIN'],
      scope: 'bulk-import',
    })
    await action()
    expect(mocks.checkRateLimit).toHaveBeenCalledWith({ identifier: 'user-1', scope: 'bulk-import' })
  })

  it('skips rate limit when rateLimited: false', async () => {
    const action = withAdminAction(async (_actor: typeof ACTOR) => 'ok', {
      roles: ['MASTER_ADMIN'],
      rateLimited: false,
    })
    await action()
    expect(mocks.checkRateLimit).not.toHaveBeenCalled()
  })

  it('passes actor as first arg and forwards remaining args to inner fn', async () => {
    const inner = vi.fn().mockResolvedValue('result')
    const action = withAdminAction(inner, { roles: ['MASTER_ADMIN'] })
    await action('arg1', 'arg2')
    expect(inner).toHaveBeenCalledWith(ACTOR, 'arg1', 'arg2')
  })
})

describe('withResidentAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRole.mockResolvedValue({ ...ACTOR, role: 'RESIDENT' })
    mocks.checkRateLimit.mockResolvedValue(undefined)
    mocks.withSentryAction.mockImplementation((fn: unknown) => fn)
  })

  it('defaults to RESIDENT + VISITOR roles', async () => {
    const action = withResidentAction(async (_actor: typeof ACTOR) => 'ok')
    await action()
    expect(mocks.requireRole).toHaveBeenCalledWith(['RESIDENT', 'VISITOR'])
  })

  it('accepts custom roles override', async () => {
    const action = withResidentAction(async (_actor: typeof ACTOR) => 'ok', {
      roles: ['RESIDENT'],
    })
    await action()
    expect(mocks.requireRole).toHaveBeenCalledWith(['RESIDENT'])
  })

  it('applies mutation rate limit by default', async () => {
    const action = withResidentAction(async (_actor: typeof ACTOR) => 'ok')
    await action()
    expect(mocks.checkRateLimit).toHaveBeenCalledWith({ identifier: 'user-1', scope: 'mutation' })
  })
})
