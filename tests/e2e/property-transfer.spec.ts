/**
 * D.10 — Test 5: property-transfer
 *
 * Global-setup seeds a pending PropertyTransferRequest for RESIDENCE-A12
 * (Devon → Aaliyah).
 * This test approves the transfer as Master Admin and verifies:
 *  - The request row disappears from the approvals list
 *  - An audit log entry exists (checked via admin audit-log page)
 */
import { test, expect } from '@playwright/test'
import { signInAs } from './helpers/auth'

test.describe('Property transfer — admin approves pending request', () => {
  test('Master Admin approves RESIDENCE-A12 transfer Devon → Aaliyah', async ({ page }) => {
    await signInAs(page, 'Karis')

    // Navigate to Approvals → Property Transfers tab
    await page.goto('/admin/approvals?tab=property-transfers')
    await expect(page.getByRole('heading', { name: 'Approvals' })).toBeVisible()

    // Find the RESIDENCE-A12 row
    const transferRow = page.locator('tr', { has: page.getByText('RESIDENCE-A12') })
    await expect(transferRow).toBeVisible({ timeout: 15_000 })

    // Click Approve
    const approveBtn = transferRow.getByRole('button', { name: /approve/i })
    await approveBtn.click()

    // Confirm in dialog
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: /confirm|approve/i }).click()

    // Row should disappear
    await expect(transferRow).not.toBeVisible({ timeout: 10_000 })

    // Verify audit log has a property_transfer entry
    await page.goto('/admin/audit-log')
    await expect(page.getByRole('heading', { name: 'Audit Log' })).toBeVisible()
    // At least one row containing "transfer" should be visible
    await expect(page.getByText(/transfer/i).first()).toBeVisible({ timeout: 10_000 })
  })
})
