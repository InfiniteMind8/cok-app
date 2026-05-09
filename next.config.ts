import type { NextConfig } from 'next'
import path from 'path'
import { withSentryConfig } from '@sentry/nextjs'

// Content-Security-Policy source allowlist — F.1.
// Each directive is built from the integration list:
//   Clerk     auth, user/avatar CDNs, telemetry
//   Sentry    error/perf ingest + browser SDK CDN
//   Upstash   Redis REST (rate limit)
//   Storage   image/file CDN (R2 / B2 / AWS S3 — keep all so any STORAGE_DRIVER works)
//   Self      app origin
// `style-src 'unsafe-inline'` is acknowledged by playbook §F.1 step 3 — see D-F1-01.
// Resend is server-side only (api.resend.com is called from server actions, not the browser),
// so it does not need a connect-src entry.
const CLERK_HOSTS = [
  'https://*.clerk.com',
  'https://*.clerk.dev',
  'https://*.clerk.accounts.dev',
  'https://clerk-telemetry.com',
  'https://*.clerk-telemetry.com',
]
const SENTRY_HOSTS = [
  'https://*.sentry.io',
  'https://*.ingest.sentry.io',
  'https://browser.sentry-cdn.com',
  'https://js.sentry-cdn.com',
]
const UPSTASH_HOSTS = ['https://*.upstash.io']
const STORAGE_HOSTS = [
  'https://*.amazonaws.com',
  'https://*.r2.cloudflarestorage.com',
  'https://*.backblazeb2.com',
  'https://utfs.io', // legacy UploadThing
]

const cspDirectives = {
  'default-src': ["'self'"],
  // Clerk loads its frontend SDK from clerk subdomains; 'wasm-unsafe-eval' is required
  // by some Clerk and Sentry browser bundles; no 'unsafe-eval' or 'unsafe-inline'.
  'script-src': ["'self'", "'wasm-unsafe-eval'", ...CLERK_HOSTS, ...SENTRY_HOSTS],
  // 'unsafe-inline' is required by Tailwind/shadcn inline style attributes; tighten with
  // a nonce strategy in a future phase per playbook §F.1 step 3.
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https://images.clerk.dev',
    'https://img.clerk.com',
    'https://images.unsplash.com',
    ...STORAGE_HOSTS,
  ],
  'font-src': ["'self'", 'data:'],
  'connect-src': [
    "'self'",
    ...CLERK_HOSTS,
    ...SENTRY_HOSTS,
    ...UPSTASH_HOSTS,
    ...STORAGE_HOSTS,
  ],
  // Clerk hosted UI components (e.g. <SignIn />) iframe Clerk pages.
  'frame-src': ["'self'", ...CLERK_HOSTS],
  'worker-src': ["'self'", 'blob:'],
  'media-src': ["'self'", 'blob:'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'", ...CLERK_HOSTS],
  // X-Frame-Options DENY is also set above; frame-ancestors gives the same protection
  // for browsers that honour CSP but not the legacy header.
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
} as const

const cspHeader = Object.entries(cspDirectives)
  .map(([directive, sources]) => (sources.length ? `${directive} ${sources.join(' ')}` : directive))
  .join('; ')

const securityHeaders = [
  // Enforce HTTPS for 2 years; include subdomains; eligible for preload list
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Deny framing to prevent clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Restrict referrer information to same-origin path
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable browser features not used by this app
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // F.1 — Content-Security-Policy (resolves R-E2-04 / D-E2-01)
  { key: 'Content-Security-Policy', value: cspHeader },
]

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.clerk.dev' },
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Silent when no auth token (local dev / CI without token) — skips source map upload
  silent: !process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
})
