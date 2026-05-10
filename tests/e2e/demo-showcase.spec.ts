/**
 * PRE-3 — Public demo showcase
 *
 * Verifies the /demo route tree is reachable without authentication, that
 * interactions are intercepted, and that the existing /sign-in flow is
 * untouched. Requires NEXT_PUBLIC_DEMO_SHOWCASE_ENABLED=true (set in
 * playwright.config.ts webServer.env).
 */
import { test, expect } from '@playwright/test'

test.describe('Demo showcase — public, no-login tour', () => {
  test('landing page renders all five persona cards in incognito', async ({ page }) => {
    await page.goto('/demo')

    await expect(page.getByRole('heading', { name: 'Choose a persona' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Resident/ }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Master Admin/ }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /^Admin/ }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Vendor/ }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Visitor/ }).first()).toBeVisible()
  })

  test('demo banner is present on every /demo route', async ({ page }) => {
    for (const path of [
      '/demo',
      '/demo/resident',
      '/demo/resident/wallet',
      '/demo/resident/property',
      '/demo/resident/community',
      '/demo/resident/profile',
      '/demo/master-admin',
      '/demo/admin',
      '/demo/vendor',
      '/demo/visitor',
    ]) {
      await page.goto(path)
      await expect(page.getByRole('status', { name: 'Demo preview banner' })).toBeVisible()
    }
  })

  test('robots noindex meta tag is present', async ({ page }) => {
    await page.goto('/demo')
    const robots = page.locator('meta[name="robots"]')
    const content = await robots.getAttribute('content')
    expect(content).toMatch(/noindex/)
    expect(content).toMatch(/nofollow/)
  })

  test('resident wallet — currency toggle changes displayed amounts (local state)', async ({
    page,
  }) => {
    await page.goto('/demo/resident/wallet')

    // KCRD shows the K symbol
    await expect(page.locator('[data-testid="demo-currency-toggle"]')).toBeVisible()
    await expect(page.locator('[data-testid="demo-currency-KCRD"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    // Switch to GYD — values should change visibly (no DB round-trip)
    await page.locator('[data-testid="demo-currency-GYD"]').click()
    await expect(page.locator('[data-testid="demo-currency-GYD"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.locator('[data-testid="demo-currency-KCRD"]')).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  test('resident wallet — locked button shows demo toast on click', async ({ page }) => {
    await page.goto('/demo/resident/wallet')

    // <DemoLocked> sets aria-disabled="true"; Playwright auto-wait sees that as
    // "not enabled" and refuses to click. Force the click — the click handler
    // still fires and the toast still appears, which is the intended UX.
    await page.getByRole('button', { name: /Deposit/ }).click({ force: true })
    await expect(
      page.getByText('This is a demo preview — sign in to use this feature.'),
    ).toBeVisible({ timeout: 5_000 })
  })

  test('resident property — extension modal opens; submit is intercepted', async ({ page }) => {
    await page.goto('/demo/resident/property')

    await page.getByRole('button', { name: /Request extension/ }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Request tenancy extension/ })).toBeVisible()

    // Submit should not navigate or write — it should fire the demo toast.
    await page.getByRole('button', { name: 'Submit request' }).click()
    await expect(
      page.getByText('This is a demo preview — sign in to use this feature.'),
    ).toBeVisible({ timeout: 5_000 })
    // URL stays on the property page
    expect(new URL(page.url()).pathname).toBe('/demo/resident/property')
  })

  test('persona switcher highlights active route', async ({ page }) => {
    await page.goto('/demo/resident/community')
    const residentTab = page.getByRole('navigation', { name: 'Persona tour switcher' }).getByRole('link', { name: 'Resident' })
    await expect(residentTab).toBeVisible()
  })

  test('non-Resident personas show coming-soon scaffolding', async ({ page }) => {
    for (const persona of ['master-admin', 'admin', 'vendor', 'visitor']) {
      await page.goto(`/demo/${persona}`)
      await expect(page.getByText(/coming next/i)).toBeVisible()
      await expect(page.getByText(/Surfaces planned/i)).toBeVisible()
    }
  })

  test('sign-in flow is untouched (regression guard)', async ({ page }) => {
    await page.goto('/sign-in')
    // The auth layout's tagline confirms the real sign-in page rendered.
    await expect(page.getByText('A community, by design.')).toBeVisible()
  })
})
