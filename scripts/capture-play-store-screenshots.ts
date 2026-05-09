/**
 * Capture Play Store screenshots from the running app.
 *
 * Two modes:
 *
 * (1) Public-only (default — what the build agent runs in F.2):
 *
 *     # one terminal
 *     pnpm build && pnpm start
 *     # another terminal
 *     NEXT_PUBLIC_DEMO_MODE_ENABLED=true pnpm pwa:screenshots
 *
 *   Captures: sign-in / privacy / terms / offline (4 brand-correct shots).
 *
 * (2) Public + authenticated (project-owner flow — what closes D-F2-04):
 *
 *     # one terminal  (NODE_ENV must NOT be 'production' — `/api/auth/token`
 *     # short-circuits in production. `pnpm dev` is the simplest option;
 *     # alternatively, deploy to a non-production preview environment with
 *     # NEXT_PUBLIC_DEMO_MODE_ENABLED=true and DEMO accounts seeded.)
 *     pnpm dev
 *     # another terminal
 *     NEXT_PUBLIC_DEMO_MODE_ENABLED=true \
 *       SCREENSHOT_INCLUDE_AUTHENTICATED=1 \
 *       pnpm pwa:screenshots
 *
 *   Captures the four public shots PLUS three authenticated shots:
 *   dashboard / treasury / announcement, all signed in as the demo
 *   MASTER_ADMIN account from `lib/demo-mode.ts`.
 *
 * Output: marketing/play-store/screenshots/{name}-1080x1920.png
 *
 * Authentication flow for the authenticated shots:
 *   - POST /api/auth/token { userId } → { token } (Clerk sign-in token)
 *   - Navigate to /access/callback?ticket=<token>
 *   - The /access/callback page calls signIn.ticket() + signIn.finalize()
 *     and redirects to /. Cookies persist for the rest of that browser
 *     context, so the subsequent screenshot URL renders authenticated.
 *
 * Constraint: `/api/auth/token` returns 404 when NODE_ENV === 'production'
 * (intentional; see D-F2-03 / lib/demo-mode.ts). Run against `pnpm dev` or
 * a non-production preview deploy. If the endpoint refuses, the script
 * logs a single clear warning per authenticated shot and continues with
 * the public shots — it does NOT silently skip.
 */
import { chromium, type Browser, type Page } from '@playwright/test'
import path from 'node:path'
import { mkdir } from 'node:fs/promises'

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..')
const OUT = path.resolve(REPO_ROOT, 'COK-City-of-Karis', 'marketing', 'play-store', 'screenshots')
const BASE = process.env.SCREENSHOT_BASE_URL || 'http://localhost:3000'

const VIEWPORT = { width: 1080, height: 1920 } // Play Console phone screenshot — 9:16 portrait
const DEVICE_SCALE_FACTOR = 1

const INCLUDE_AUTHENTICATED = process.env.SCREENSHOT_INCLUDE_AUTHENTICATED === '1'

// Pinned to the Master Admin demo account in lib/demo-mode.ts. Master Admin
// is the only role that can render every authenticated screen requested by
// playbook §F.2 step 3 (dashboard + treasury + community/announcements).
const DEMO_MASTER_ADMIN_USER_ID = 'user_3CtmfDZfRg9T21vmoAEMqwKj5co'

interface Shot {
  name: string
  url: string
  waitFor?: string
  hideSelectors?: string[]
  authAs?: string // Clerk user_xxx id; if set, perform demo ticket auth before navigating
}

const publicShots: Shot[] = [
  { name: 'sign-in', url: '/sign-in', waitFor: 'main, body' },
  { name: 'privacy', url: '/privacy', waitFor: 'h1' },
  { name: 'terms', url: '/terms', waitFor: 'h1' },
  { name: 'offline', url: '/offline', waitFor: 'h1' },
]

const authenticatedShots: Shot[] = [
  {
    name: 'dashboard',
    url: '/admin/dashboard',
    waitFor: 'main h1, main [data-testid="dashboard-root"]',
    authAs: DEMO_MASTER_ADMIN_USER_ID,
  },
  {
    name: 'treasury',
    url: '/admin/treasury',
    waitFor: 'main h1',
    authAs: DEMO_MASTER_ADMIN_USER_ID,
  },
  {
    name: 'announcement',
    url: '/admin/community',
    waitFor: 'main h1',
    authAs: DEMO_MASTER_ADMIN_USER_ID,
  },
]

const shots: Shot[] = INCLUDE_AUTHENTICATED ? [...publicShots, ...authenticatedShots] : publicShots

async function performDemoAuth(page: Page, userId: string): Promise<void> {
  const tokenRes = await page.request.post(`${BASE}/api/auth/token`, {
    data: { userId },
    failOnStatusCode: false,
  })
  if (!tokenRes.ok()) {
    const status = tokenRes.status()
    const body = await tokenRes.text().catch(() => '')
    if (status === 404) {
      throw new Error(
        `/api/auth/token returned 404 — the server is running in production mode. ` +
          `Authenticated capture requires NODE_ENV !== 'production'. ` +
          `Use \`pnpm dev\` or a non-production preview deploy. (See script header for details.)`,
      )
    }
    throw new Error(
      `Demo token mint failed (status ${status}): ${body.slice(0, 200)}. ` +
        `Confirm CLERK_SECRET_KEY is set on the server and the demo account is registered in lib/demo-mode.ts.`,
    )
  }
  const json = (await tokenRes.json()) as { token?: string }
  if (!json.token) throw new Error('No token field returned from /api/auth/token')

  // /access/callback runs signIn.ticket() + signIn.finalize() and then sets
  // window.location.href = '/'. The post-auth navigation is what sets the
  // authenticated session cookie on this browser context.
  await page.goto(`${BASE}/access/callback?ticket=${encodeURIComponent(json.token)}`, {
    waitUntil: 'networkidle',
    timeout: 30_000,
  })

  // Wait for the redirect away from /access/* (success) OR for an error UI
  // on /access/callback (failure path renders inline rather than redirecting).
  await page.waitForFunction(
    () => !window.location.pathname.startsWith('/access/'),
    null,
    { timeout: 20_000 },
  )
}

async function capture(browser: Browser, shot: Shot) {
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  })
  const page = await ctx.newPage()
  try {
    if (shot.authAs) {
      await performDemoAuth(page, shot.authAs)
    }
    const target = `${BASE}${shot.url}`
    await page.goto(target, { waitUntil: 'networkidle', timeout: 30_000 })
    if (shot.waitFor) await page.waitForSelector(shot.waitFor, { timeout: 10_000 }).catch(() => {})
    if (shot.hideSelectors?.length) {
      await page.addStyleTag({
        content: shot.hideSelectors.map((s) => `${s} { visibility: hidden !important; }`).join('\n'),
      })
    }
    const file = path.join(OUT, `${shot.name}-${VIEWPORT.width}x${VIEWPORT.height}.png`)
    await page.screenshot({ path: file, fullPage: false })
    console.log(`  ${shot.name.padEnd(12)} → ${path.relative(REPO_ROOT, file)}`)
  } catch (err) {
    console.error(`  ${shot.name.padEnd(12)} FAILED:`, (err as Error).message)
  } finally {
    await ctx.close()
  }
}

async function main() {
  console.log(`Capturing Play Store screenshots from ${BASE}`)
  console.log(
    `  mode: ${INCLUDE_AUTHENTICATED ? 'public + authenticated' : 'public-only'} (${shots.length} shot${shots.length === 1 ? '' : 's'})`,
  )
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch()
  try {
    for (const shot of shots) {
      await capture(browser, shot)
    }
  } finally {
    await browser.close()
  }
  console.log('done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
