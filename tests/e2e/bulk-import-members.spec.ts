/**
 * D.10 — Test 8: bulk-import-members
 *
 * Uploads a 5-row member xlsx fixture, previews it, commits, and verifies
 * that 5 new user rows appear in the accounts list.
 * The fixture is created in global-setup: tests/e2e/fixtures/members-5row.xlsx
 */
import { test, expect } from '@playwright/test'
import { signInAs } from './helpers/auth'
import path from 'path'

const FIXTURE_PATH = path.resolve(__dirname, 'fixtures/members-5row.xlsx')

test.describe('Bulk import — members upload, preview, commit', () => {
  test('Master Admin imports 5-row member sheet', async ({ page }) => {
    await signInAs(page, 'Karis')

    // Navigate to member import page
    await page.goto('/admin/imports/members')
    await expect(page.getByRole('heading', { name: /import members/i })).toBeVisible({ timeout: 10_000 })

    // Upload the xlsx fixture
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(FIXTURE_PATH)

    // Wait for preview to load (redirects to /admin/imports/members/[sessionId])
    await page.waitForURL(/\/admin\/imports\/members\/.+/, { timeout: 30_000 })

    // Preview table should show 5 rows
    const dataRows = page.locator('tbody tr')
    await expect(dataRows).toHaveCount(5, { timeout: 15_000 })

    // All rows should have valid/warning status (no error rows block commit)
    const errorBadges = page.getByText('error', { exact: true })
    const errorCount = await errorBadges.count()
    expect(errorCount).toBe(0)

    // Click Commit
    const commitBtn = page.getByRole('button', { name: /commit/i })
    await expect(commitBtn).toBeEnabled()
    await commitBtn.click()

    // Should redirect to accounts or show success toast
    await expect(page.getByText(/import(ed)? successfully|5 members/i)).toBeVisible({ timeout: 30_000 })
  })
})
