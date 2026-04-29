/**
 * D.10 — Test 4: settlement-approval
 *
 * Global-setup seeds a pending SettlementRequest for Devon (K 250).
 * This test approves it as Master Admin and verifies the status updates.
 */
import { test, expect } from '@playwright/test'
import { signInAs } from './helpers/auth'

test.describe('Settlement — admin approves pending request', () => {
  test('Master Admin approves Devon settlement request', async ({ page }) => {
    await signInAs(page, 'Karis')

    // Navigate to Approvals → Settlements tab (default)
    await page.goto('/admin/approvals?tab=settlements')
    await expect(page.getByRole('heading', { name: 'Approvals' })).toBeVisible()

    // Find Devon's settlement row
    const settlementRow = page.locator('tr', { has: page.getByText('Devon') })
    await expect(settlementRow).toBeVisible({ timeout: 15_000 })
    await expect(settlementRow).toContainText('250')

    // Click Approve
    const approveBtn = settlementRow.getByRole('button', { name: /approve/i })
    await approveBtn.click()

    // Confirm in dialog
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: /confirm|approve/i }).click()

    // Row should disappear after approval
    await expect(settlementRow).not.toBeVisible({ timeout: 10_000 })
  })
})
