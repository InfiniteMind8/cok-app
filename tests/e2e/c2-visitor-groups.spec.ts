import { test, expect } from '@playwright/test'
import { signInAs, signOut } from './helpers/auth'

// Unique names per run to avoid collisions with previous test data
const GROUP_NAME = `Heritage Walk ${Date.now()}`
const ANNOUNCEMENT_HEADLINE = `C2 Visitor Group Announcement ${Date.now()}`

/**
 * C.2 — Visitor Groups E2E
 *
 * Serial: test 2 and 3 depend on test 1 having seeded the group + announcement.
 *
 * Covers:
 *   1. Admin creates group → assigns visitor → sends targeted announcement via
 *      the "Send announcement to this group" deep-link (C.2.1 UX wired in this prompt)
 *   2. Visitor member sees the targeted announcement; Voting tab is absent; My Groups tab present
 *   3. Visitor can raise an issue (raiseIssueAction permits VISITOR role)
 */
test.describe.serial('C.2 — Visitor Groups', () => {
  test('admin creates group, assigns Marcus, and sends targeted announcement', async ({ page }) => {
    await signInAs(page, 'Karis')

    // ── Create visitor group ──────────────────────────────────────────────
    await page.goto('/admin/visitors/groups')
    await page.getByRole('button', { name: /new group/i }).click()

    // Label text is "Group name"; fill by placeholder
    await page.getByPlaceholder(/Corporate Training 1/i).fill(GROUP_NAME)
    await page.getByPlaceholder(/Purpose and context/i).fill(
      'E2E test group for C.2 visitor groups scenario',
    )
    await page.getByRole('button', { name: /create group/i }).click()
    await expect(page.getByText('Visitor group created')).toBeVisible()

    // ── Navigate to the new group's detail page ───────────────────────────
    // After modal closes, the group appears in the list as a clickable link
    await page.getByRole('link', { name: GROUP_NAME }).click({ timeout: 10_000 })
    await expect(page).toHaveURL(/\/admin\/visitors\/groups\/[^/]+$/)

    // ── Assign Marcus Bowen to the group ─────────────────────────────────
    // Shadcn Select: click the trigger (renders as combobox), then pick Marcus
    await page.getByText('Select a visitor to assign…').click()
    await page.getByRole('option', { name: /Marcus Bowen/i }).click()
    await page.getByRole('button', { name: /^assign$/i }).click()
    await expect(page.getByText('Visitor assigned to group')).toBeVisible()

    // ── Use the "Send announcement to this group" deep-link ───────────────
    // This navigates to /admin/community?announce=group&groupId=...
    // NewUpdateSheet receives defaultGroupId and pre-selects the audience.
    await page.getByRole('link', { name: /send announcement to this group/i }).click()
    await expect(page).toHaveURL(/\/admin\/community\?announce=group/)

    // ── Open the New Update sheet ─────────────────────────────────────────
    await page.getByRole('button', { name: /new update/i }).click()
    await expect(page.getByText('New community update')).toBeVisible({ timeout: 5_000 })

    // Audience is pre-set to VISITOR_GROUP → description reads "Targeted: Visitor group"
    await expect(page.getByText('Targeted: Visitor group')).toBeVisible()

    // ── Fill the announcement form ────────────────────────────────────────
    await page.getByPlaceholder("What's happening?").fill(ANNOUNCEMENT_HEADLINE)
    await page
      .getByPlaceholder(/Infrastructure, Health, Events/i)
      .fill('Events')
    await page
      .getByPlaceholder('Full update message…')
      .fill(
        'This is a C.2 E2E test announcement targeted at the Heritage Walk visitor group. Only group members should see this.',
      )

    // ── Publish ───────────────────────────────────────────────────────────
    await page.getByRole('button', { name: /publish update/i }).click()
    await expect(page.getByText('Update published')).toBeVisible()
  })

  test('visitor member sees targeted announcement; My Groups tab present; no Voting tab', async ({ page }) => {
    await signInAs(page, 'Marcus')
    await page.goto('/community')

    // Visitor tab set: updates | my-groups | notifications (no voting)
    await expect(page.getByRole('link', { name: /my groups/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /^voting$/i })).not.toBeVisible()

    // The targeted announcement must be visible in the default Updates tab
    await expect(page.getByText(ANNOUNCEMENT_HEADLINE)).toBeVisible({ timeout: 15_000 })
  })

  test('visitor can file an issue report', async ({ page }) => {
    await signInAs(page, 'Marcus')
    await page.goto('/community')

    // ── Open raise-issue FAB ──────────────────────────────────────────────
    await page.getByRole('button', { name: /raise an issue/i }).click()
    await expect(page.getByText('Raise an issue')).toBeVisible({ timeout: 5_000 })

    // ── Fill the form ─────────────────────────────────────────────────────
    await page
      .getByPlaceholder('Brief description of the issue')
      .fill('C.2 E2E — Visitor issue report (Marcus Bowen test)')

    // Seriousness: two LevelPicker groups appear; click first "Low" button
    const lowButtons = page.getByRole('button', { name: /^low$/i })
    await lowButtons.first().click()  // seriousness = YELLOW
    await lowButtons.last().click()   // urgency = YELLOW

    // Category select
    await page.getByText('Select category…').click()
    await page.getByRole('option', { name: 'Maintenance' }).click()

    // Description (min 10 chars)
    await page
      .getByPlaceholder('Describe the issue in detail…')
      .fill('E2E test: visitor (Marcus) reporting a maintenance issue via the Raise Issue FAB.')

    // ── Submit ────────────────────────────────────────────────────────────
    await page.getByRole('button', { name: /^raise issue$/i }).click()
    await expect(page.getByText('Issue raised')).toBeVisible()
  })
})
