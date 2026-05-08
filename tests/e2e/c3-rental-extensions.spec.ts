import { test, expect } from '@playwright/test'
import { signInAs, signOut } from './helpers/auth'

/**
 * C.3 — Rental Extension Workflow E2E
 *
 * Prerequisite: global-setup.ts seeds Aaliyah's RESIDENCE-B07 tenancy with
 *   leaseStatus=ACTIVE and endDate = today+30 so the "Request extension" button
 *   is visible. Runs before rental-extension.spec.ts (alphabetically).
 *
 * Serial: tests share DB state — each builds on the previous.
 */

function futureDateStr(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().slice(0, 10)
}

test.describe.serial('C.3 — Rental Extension Workflow', () => {
  test('resident requests extension; request appears in Approvals Center', async ({ page }) => {
    await signInAs(page, 'Aaliyah')
    await page.goto('/property')

    // Verify lease card renders with ACTIVE status
    await expect(page.getByText('Active')).toBeVisible({ timeout: 10_000 })

    // Open extension request modal
    await page.getByRole('button', { name: /request extension/i }).click()
    await expect(page.getByText('Request lease extension')).toBeVisible({ timeout: 5_000 })

    // Fill new end date (6 months out) and reason
    const newEndDate = futureDateStr(180)
    await page.locator('input[type="date"]').fill(newEndDate)
    await page
      .getByPlaceholder(/briefly explain why you are requesting/i)
      .fill('C.3 E2E test — requesting a 6-month extension')

    await page.getByRole('button', { name: /submit request/i }).click()
    await expect(page.getByText('Extension request submitted')).toBeVisible()

    // ── Verify it appears in Admin Approvals ──────────────────────────────────
    await signOut(page)
    await signInAs(page, 'Karis')
    await page.goto('/admin/approvals?tab=rental-extensions')

    // Aaliyah Singh + RESIDENCE-B07 should appear as a pending row
    await expect(page.getByText('Aaliyah Singh')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('RESIDENCE-B07')).toBeVisible()
  })

  test('admin approves extension; toast confirms', async ({ page }) => {
    await signInAs(page, 'Karis')
    await page.goto('/admin/approvals?tab=rental-extensions')

    await expect(page.getByText('Aaliyah Singh')).toBeVisible({ timeout: 10_000 })

    // Click the Approve button for the first pending row
    await page.getByRole('button', { name: /^approve$/i }).first().click()
    await expect(page.getByText('Confirm approval')).toBeVisible({ timeout: 5_000 })

    // Optionally add a note and confirm
    await page.getByRole('button', { name: /confirm approval/i }).click()
    await expect(page.getByText('Extension approved')).toBeVisible()
  })

  test('decline path: resident submits another request; admin declines with note', async ({ page }) => {
    // ── Aaliyah submits a second extension request ────────────────────────────
    await signInAs(page, 'Aaliyah')
    await page.goto('/property')

    // After previous approval the "Request extension" button is still visible
    // (leaseStatus is still ACTIVE; canRequestExtension allows multiple requests)
    await expect(page.getByRole('button', { name: /request extension/i })).toBeVisible({
      timeout: 10_000,
    })
    await page.getByRole('button', { name: /request extension/i }).click()

    const farFutureDate = futureDateStr(365)
    await page.locator('input[type="date"]').fill(farFutureDate)
    await page.getByRole('button', { name: /submit request/i }).click()
    await expect(page.getByText('Extension request submitted')).toBeVisible()

    // ── Admin declines ────────────────────────────────────────────────────────
    await signOut(page)
    await signInAs(page, 'Karis')
    await page.goto('/admin/approvals?tab=rental-extensions')

    await expect(page.getByText('Aaliyah Singh')).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: /^decline$/i }).first().click()
    await expect(page.getByText('Decline extension')).toBeVisible({ timeout: 5_000 })

    // Note is required for decline
    await page.getByPlaceholder(/explain why this extension is being declined/i).fill(
      'C.3 E2E test — decline reason',
    )
    await page.getByRole('button', { name: /confirm decline/i }).click()
    await expect(page.getByText('Extension declined')).toBeVisible()
  })
})
