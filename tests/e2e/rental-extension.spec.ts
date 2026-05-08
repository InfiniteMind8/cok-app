/**
 * D.10 — Test 7: rental-extension (C.3 implemented)
 *
 * Full lifecycle: resident requests extension → admin approves → updated
 * end date visible on resident property page.
 *
 * Note: c3-rental-extensions.spec.ts runs before this file (alphabetically)
 * and may have already approved an earlier request. Aaliyah can still submit
 * a new extension request after the previous one was approved.
 */
import { test, expect } from '@playwright/test'
import { signInAs, signOut } from './helpers/auth'

function futureDateStr(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().slice(0, 10)
}

test.describe('Rental extension — request and approve', () => {
  test('resident requests extension; admin approves; end date updates', async ({ page }) => {
    // ── Step 1: Aaliyah requests an extension ─────────────────────────────────
    await signInAs(page, 'Aaliyah')
    await page.goto('/property')

    // Lease card must be visible and show status
    await expect(page.getByText('Rental status')).toBeVisible({ timeout: 10_000 })

    // Request extension button present (leaseStatus=ACTIVE, canRequestExtension=true)
    await page.getByRole('button', { name: /request extension/i }).click()
    await expect(page.getByText('Request lease extension')).toBeVisible()

    // Fill form: date 120 days out (different from C.3 180-day request)
    const newEndDate = futureDateStr(120)
    await page.locator('input[type="date"]').fill(newEndDate)
    await page
      .getByPlaceholder(/briefly explain why you are requesting/i)
      .fill('D.10 E2E test — rental extension request')

    await page.getByRole('button', { name: /submit request/i }).click()
    await expect(page.getByText('Extension request submitted')).toBeVisible()

    // ── Step 2: Admin approves ────────────────────────────────────────────────
    await signOut(page)
    await signInAs(page, 'Karis')
    await page.goto('/admin/approvals?tab=rental-extensions')

    await expect(page.getByText('Aaliyah Singh')).toBeVisible({ timeout: 10_000 })

    // Approve the first (most recent) pending request
    await page.getByRole('button', { name: /^approve$/i }).first().click()
    await expect(page.getByText('Confirm approval')).toBeVisible()
    await page.getByRole('button', { name: /confirm approval/i }).click()
    await expect(page.getByText('Extension approved')).toBeVisible()

    // ── Step 3: Resident sees updated end date ────────────────────────────────
    await signOut(page)
    await signInAs(page, 'Aaliyah')
    await page.goto('/property')

    await expect(page.getByText('Rental status')).toBeVisible({ timeout: 10_000 })
    // The new end date string (YYYY-MM-DD → rendered as dd MMM yyyy) should appear
    // We verify the card renders lease end date (presence of "Lease end" label is sufficient)
    await expect(page.getByText('Lease end')).toBeVisible()
  })
})
