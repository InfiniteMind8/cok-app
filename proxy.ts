import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { checkRateLimit, RateLimitError } from '@/lib/rate-limit'

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

const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])
const isMfaRoute = createRouteMatcher(['/account/mfa-enroll(.*)'])

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'unknown'
}

export default clerkMiddleware(async (auth, request) => {
  const ip = getClientIp(request)

  // Auth routes: 5 requests per 15 minutes per IP (brute-force protection)
  if (isAuthRoute(request)) {
    try {
      await checkRateLimit({ identifier: ip, scope: 'auth' })
    } catch (e) {
      if (e instanceof RateLimitError) {
        return new NextResponse('Too many requests. Try again later.', {
          status: 429,
          headers: {
            'Retry-After': String(e.retryAfterSeconds),
            'Content-Type': 'text/plain',
          },
        })
      }
    }
  }

  // MFA enrollment: 10 requests per 15 minutes per IP
  if (isMfaRoute(request)) {
    try {
      await checkRateLimit({ identifier: ip, scope: 'mfa' })
    } catch (e) {
      if (e instanceof RateLimitError) {
        return new NextResponse('Too many requests. Try again later.', {
          status: 429,
          headers: {
            'Retry-After': String(e.retryAfterSeconds),
            'Content-Type': 'text/plain',
          },
        })
      }
    }
  }

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
