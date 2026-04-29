import * as Sentry from '@sentry/nextjs'

export function withSentryAction<T, A extends unknown[]>(
  fn: (...args: A) => Promise<T>,
  name: string
): (...args: A) => Promise<T> {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (err) {
      Sentry.captureException(err, {
        tags: { context: 'server_action', action: name },
      })
      throw err
    }
  }
}

export function captureActionException(
  err: unknown,
  action: string,
  extra?: Record<string, unknown>
) {
  Sentry.captureException(err, {
    tags: { context: 'server_action', action },
    extra,
  })
}
