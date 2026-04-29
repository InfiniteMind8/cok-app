/**
 * D.10 — Test 6: voting
 *
 * Seed has one open vote ("How should we direct the next K 25,000…").
 * Devon already voted (amphitheater). Aaliyah has not voted yet.
 *
 * Scenarios:
 *  a. Aaliyah (RESIDENT) casts a vote on the open proposal.
 *  b. Marcus (VISITOR) navigates to the community page — vote is not
 *     actionable (options are hidden or action is blocked).
 */
import { test, expect } from '@playwright/test'
import { signInAs } from './helpers/auth'

test.describe('Voting — cast vote and visitor restriction', () => {
  test('Aaliyah (resident) casts a vote on open proposal', async ({ page }) => {
    await signInAs(page, 'Aaliyah')

    // Navigate to community / votes section
    await page.goto('/community')
    await expect(page).toHaveURL(/\/community/)

    // The vote card should be visible
    await expect(page.getByText('How should we direct')).toBeVisible({ timeout: 15_000 })

    // Click one of the vote option buttons (second option = "Expanded wellness center")
    const optionBtn = page.getByRole('button', { name: /wellness center/i })
    await expect(optionBtn).toBeVisible()
    await optionBtn.click()

    // After voting, results should show percentages (not clickable buttons)
    await expect(page.getByText('Your vote')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/\d+ votes? cast/i)).toBeVisible()
  })

  test('Marcus (visitor) cannot cast a vote', async ({ page }) => {
    await signInAs(page, 'Marcus')

    // Visitor layout — navigate to wherever community is accessible
    // For visitors, either the route is inaccessible or voting buttons are absent
    await page.goto('/community')

    // Visitor should either be redirected OR see the page without vote buttons
    const url = new URL(page.url())
    if (url.pathname === '/community') {
      // If page loads, vote-action buttons should not be present
      // (visitor role cannot cast votes)
      const voteButtons = page.getByRole('button', { name: /wellness center|amphitheater|library/i })
      // Buttons should either not exist or be disabled
      const count = await voteButtons.count()
      if (count > 0) {
        // All buttons must be disabled
        for (let i = 0; i < count; i++) {
          await expect(voteButtons.nth(i)).toBeDisabled()
        }
      }
    } else {
      // Redirected away — restriction enforced at route level
      expect(url.pathname).not.toBe('/community')
    }
  })
})
