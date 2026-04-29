import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.DEPLOY_ENV ?? process.env.NODE_ENV ?? 'development',
  release: process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  beforeSend(event) {
    if (event.user) {
      const role = (event.user as Record<string, unknown>).role
      event.user = role ? { role: String(role) } : {}
    }
    return event
  },
})
