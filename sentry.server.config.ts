import * as Sentry from '@sentry/nextjs'

const isProd = process.env.NODE_ENV === 'production'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.DEPLOY_ENV ?? process.env.NODE_ENV ?? 'development',
  release: process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev',
  tracesSampleRate: isProd ? 0.1 : 1.0,
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
  ],
  beforeSend(event) {
    if (event.user) {
      const role = (event.user as Record<string, unknown>).role
      event.user = role ? { role: String(role) } : {}
    }
    if (event.request?.data && typeof event.request.data === 'object') {
      const data = event.request.data as Record<string, unknown>
      for (const key of ['email', 'name', 'phone', 'storageKey', 'nationalIdNumber']) {
        if (key in data) data[key] = '[Filtered]'
      }
    }
    return event
  },
})
