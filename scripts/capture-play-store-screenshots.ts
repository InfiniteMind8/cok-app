/**
 * Capture Play Store screenshots from the running app.
 *
 * Usage:
 *   1. In one terminal: pnpm build && pnpm start
 *      (or just pnpm dev if you accept watermarks / dev banners)
 *   2. NEXT_PUBLIC_DEMO_MODE_ENABLED=true pnpm pwa:screenshots
 *
 * Output: marketing/play-store/screenshots/{sign-in,offline,privacy,terms}-1080x1920.png
 *
 * The four screens chosen here are the **public-renderable** ones the build agent can
 * capture without a populated Postgres + Clerk session. The playbook §F.2 step 3 also
 * requests dashboard / treasury / announcement captures — those require an authenticated
 * session and are documented as project-owner action in docs/play-store.md §7.3.
 */
import { chromium, type Browser } from '@playwright/test'
import path from 'node:path'
import { mkdir } from 'node:fs/promises'

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..')
const OUT = path.resolve(REPO_ROOT, 'COK-City-of-Karis', 'marketing', 'play-store', 'screenshots')
const BASE = process.env.SCREENSHOT_BASE_URL || 'http://localhost:3000'

const VIEWPORT = { width: 1080, height: 1920 } // Play Console phone screenshot — 9:16 portrait
const DEVICE_SCALE_FACTOR = 1

interface Shot {
  name: string
  url: string
  waitFor?: string
  hideSelectors?: string[]
}

const shots: Shot[] = [
  { name: 'sign-in', url: '/sign-in', waitFor: 'main, body' },
  { name: 'privacy', url: '/privacy', waitFor: 'h1' },
  { name: 'terms', url: '/terms', waitFor: 'h1' },
  { name: 'offline', url: '/offline', waitFor: 'h1' },
]

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
    console.log(`  ${shot.name.padEnd(8)} → ${path.relative(REPO_ROOT, file)}`)
  } catch (err) {
    console.error(`  ${shot.name.padEnd(8)} FAILED:`, (err as Error).message)
  } finally {
    await ctx.close()
  }
}

async function main() {
  console.log(`Capturing Play Store screenshots from ${BASE}`)
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
