/**
 * D.10 — Test 3: voucher-redemption
 *
 * Global-setup seeds a pending VoucherRequest for Aaliyah (K 100).
 * This test approves the request as Master Admin and verifies the
 * approval is processed.
 *
 * Note on "redemption": the voucher model in Phase 1+ uses VoucherRequest
 * (resident requests, admin approves). A resident-side "redeem a voucher code"
 * flow is not in Phase 1+ scope. The acceptance test covers the admin
 * approval side as the authoritative critical path.
 */
import { test, expect } from '@playwright/test'
import { signInAs } from './helpers/auth'

test.describe('Voucher — admin approves pending voucher request', () => {
  test('Master Admin approves Aaliyah voucher request', async ({ page }) => {
    await signInAs(page, 'Karis')

    // Navigate to Approvals → Vouchers tab
    await page.goto('/admin/approvals?tab=vouchers')
    await expect(page.getByRole('heading', { name: 'Approvals' })).toBeVisible()

    // Find the voucher request row for Aaliyah
    const voucherRow = page.locator('tr', { has: page.getByText('Aaliyah') })
    await expect(voucherRow).toBeVisible({ timeout: 15_000 })

    // Click the approve button in that row
    const approveBtn = voucherRow.getByRole('button', { name: /approve/i })
    await approveBtn.click()

    // Confirm in the dialog
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: /confirm|approve/i }).click()

    // Row should disappear (or show updated status)
    await expect(voucherRow).not.toBeVisible({ timeout: 10_000 })
  })
})
