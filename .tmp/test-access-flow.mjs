// Verifies the /access one-click sign-in flow end-to-end against the running dev server.
// Uses cached Chromium from C:/Users/infin/AppData/Local/ms-playwright/chromium-1187.

import { chromium } from 'playwright-core'

const CHROME_PATH =
  'C:/Users/infin/AppData/Local/ms-playwright/chromium-1187/chrome-win/chrome.exe'
const BASE = 'http://localhost:3001'

const ACCOUNTS = [
  {
    name: 'Devon McKenzie',
    firstName: 'Devon',
    role: 'RESIDENT',
    expectDest: '/wallet',
  },
  {
    name: 'Anjali Pereira',
    firstName: 'Anjali',
    role: 'RESIDENT',
    expectDest: '/wallet',
  },
  {
    name: 'Karis Munroe',
    firstName: 'Karis',
    role: 'MASTER_ADMIN',
    expectDest: '/admin/dashboard',
  },
  {
    name: 'Naomi Wells',
    firstName: 'Naomi',
    role: 'ADMIN',
    expectDest: '/',
  },
  {
    name: 'Aaliyah Singh',
    firstName: 'Aaliyah',
    role: 'VENDOR',
    expectDest: '/',
  },
  {
    name: 'Marcus Bowen',
    firstName: 'Marcus',
    role: 'VISITOR',
    expectDest: '/wallet',
  },
]

async function testAccount(browser, account) {
  console.log(`\n=== Testing: ${account.name} (${account.role}) ===`)
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  const consoleMessages = []
  page.on('console', (msg) => consoleMessages.push(`[${msg.type()}] ${msg.text()}`))
  const pageErrors = []
  page.on('pageerror', (err) => pageErrors.push(err.message))

  try {
    await page.goto(`${BASE}/access`, { waitUntil: 'networkidle', timeout: 30000 })
    console.log('  ✓ /access loaded')

    // Wait for Clerk to finish loading client-side
    await page.waitForTimeout(2000)

    // Click the matching button by visible text
    const btn = page.getByRole('button', { name: `Enter as ${account.firstName}` })
    await btn.waitFor({ state: 'visible', timeout: 10000 })
    await btn.click()
    console.log('  ✓ Clicked button')

    // Wait for navigation to either expected destination OR an error to appear
    // Wait for navigation away from /access OR an error to appear
    const navResult = await Promise.race([
      page
        .waitForURL((url) => url.pathname !== '/access', { timeout: 15000 })
        .then(() => 'navigated'),
      page
        .waitForSelector('p[style*="oklch(0.58 0.21 25)"]', { timeout: 15000 })
        .then(() => 'error'),
      new Promise((resolve) => setTimeout(() => resolve('timeout'), 15000)),
    ])

    if (navResult === 'navigated') {
      // Wait for any server-side redirect chain (/, /admin/dashboard, /wallet) to settle
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
      await page.waitForTimeout(1500)
      const settledUrl = new URL(page.url())
      console.log(`  → After button: ${settledUrl.pathname}`)
      if (settledUrl.pathname.startsWith('/sign-in')) {
        return {
          ok: false,
          account,
          reason: `Bounced to ${settledUrl.pathname} — sign-in failed`,
        }
      }

      // Verify auth by hitting a protected route directly. /wallet is public to
      // any signed-in user; if Clerk redirects to /sign-in here, auth didn't stick.
      await page.goto(`${BASE}/wallet`, { waitUntil: 'networkidle', timeout: 15000 })
      await page.waitForTimeout(1000)
      const protUrl = new URL(page.url())
      if (protUrl.pathname.startsWith('/sign-in')) {
        return {
          ok: false,
          account,
          reason: `Auth did not stick — /wallet bounced to ${protUrl.pathname}`,
        }
      }
      console.log(`  ✓ Auth confirmed (visited /wallet, stayed on ${protUrl.pathname})`)
      return { ok: true, account, dest: settledUrl.pathname }
    } else if (navResult === 'error') {
      const errText = await page
        .locator('p[style*="oklch(0.58 0.21 25)"]')
        .first()
        .textContent()
      console.log(`  ✗ Error message: ${errText}`)
      return { ok: false, account, reason: `Error in UI: ${errText}` }
    } else {
      const stuckUrl = page.url()
      const btnText = await btn.textContent().catch(() => '?')
      console.log(`  ✗ Timed out. URL=${stuckUrl} button="${btnText}"`)
      return {
        ok: false,
        account,
        reason: `Timed out on ${stuckUrl}, button text="${btnText}"`,
      }
    }
  } catch (err) {
    console.log(`  ✗ Exception: ${err.message}`)
    return { ok: false, account, reason: err.message }
  } finally {
    if (consoleMessages.length) {
      console.log('  --- console ---')
      for (const m of consoleMessages.slice(-15)) console.log(`    ${m}`)
    }
    if (pageErrors.length) {
      console.log('  --- page errors ---')
      for (const e of pageErrors) console.log(`    ${e}`)
    }
    await ctx.close()
  }
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true })

  const results = []
  for (const account of ACCOUNTS) {
    const r = await testAccount(browser, account)
    results.push(r)
  }

  await browser.close()

  console.log('\n=== Summary ===')
  const failures = results.filter((r) => !r.ok)
  for (const r of results) {
    if (r.ok) {
      console.log(`  ✓ ${r.account.name} (${r.account.role}) → ${r.dest}`)
    } else {
      console.log(`  ✗ ${r.account.name}: ${r.reason}`)
    }
  }

  if (failures.length) {
    console.log(`\nFAILED: ${failures.length}/${results.length}`)
    process.exit(1)
  } else {
    console.log(`\nALL ${results.length} ACCOUNTS PASSED`)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(2)
})
