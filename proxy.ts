import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/cron(.*)',
  '/account/mfa-enroll(.*)',
  '/access(.*)',
  '/login',
  '/dev-login',
  '/api/auth/token',
  // PRE-3: public demo showcase. The /demo layout itself returns 404 when
  // NEXT_PUBLIC_DEMO_SHOWCASE_ENABLED !== 'true'.
  '/demo(.*)',
  // F.2: PWA + Play Store public surfaces.
  '/privacy',
  '/terms',
  '/offline',
  '/.well-known/(.*)',
])

// D.4 note — auth + MFA rate limits previously enforced here via the local
// @/lib/rate-limit module have been removed. Defense-in-depth is preserved:
//   - Clerk runs its own brute-force protection on /sign-in and /sign-up.
//   - The backend (cok-api) enforces the full Upstash-backed limiter at the
//     /v1/auth/* endpoints any frontend traffic eventually hits.
// If frontend-only IP-scoped limiting is ever needed again, prefer a
// middleware-friendly Edge-runtime fetch to the backend's limit endpoint
// over an in-process Map (which doesn't share state across edge isolates).

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
