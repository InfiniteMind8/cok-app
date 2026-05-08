import 'server-only'
import { requireRole } from '@/lib/auth'
import { checkRateLimit, RateLimitError, type RateLimitScope } from '@/lib/rate-limit'
import { createAuditEntry } from '@/lib/audit'
import { withSentryAction } from '@/lib/sentry'
import type { Role } from '@prisma/client'

export type AuthUser = NonNullable<Awaited<ReturnType<typeof requireRole>>>

interface ActionConfig {
  roles: Role[]
  scope?: RateLimitScope
  rateLimited?: boolean
}

function buildAction<A extends unknown[], T>(
  fn: (actor: AuthUser, ...args: A) => Promise<T>,
  config: ActionConfig,
): (...args: A) => Promise<T> {
  const { roles, scope = 'mutation', rateLimited = true } = config

  const wrapped = async (...args: A): Promise<T> => {
    const actor = await requireRole(roles)

    if (rateLimited) {
      try {
        await checkRateLimit({ identifier: actor.id, scope })
      } catch (e) {
        if (e instanceof RateLimitError) {
          await createAuditEntry({
            action: 'rate_limit_exceeded',
            entity: 'SYSTEM',
            actorId: actor.id,
            after: { scope, actionName: fn.name },
          })
        }
        throw e
      }
    }

    return fn(actor, ...args)
  }

  return withSentryAction(wrapped, fn.name || 'unknown_action')
}

export function withAdminAction<A extends unknown[], T>(
  fn: (actor: AuthUser, ...args: A) => Promise<T>,
  config: ActionConfig,
): (...args: A) => Promise<T> {
  return buildAction(fn, config)
}

export function withResidentAction<A extends unknown[], T>(
  fn: (actor: AuthUser, ...args: A) => Promise<T>,
  config?: Partial<ActionConfig>,
): (...args: A) => Promise<T> {
  return buildAction(fn, {
    roles: ['RESIDENT', 'VISITOR'],
    scope: 'mutation',
    rateLimited: true,
    ...config,
  })
}
