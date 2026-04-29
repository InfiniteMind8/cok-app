/**
 * Auth helpers for E2E tests.
 *
 * All sign-in uses the demo account shortcuts, which require:
 *   NEXT_PUBLIC_DEMO_MODE_ENABLED=true
 *   A live Clerk test instance with the demo user IDs configured
 */
import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export type DemoRole =
  | 'Master Admin'   // karis@cityofkaris.com — Karis Munroe
  | 'Admin'          // naomi@cityofkaris.com  — Naomi Wells
  | 'Resident'       // devon@example.com      — Devon McKenzie (first Resident button)
  | 'Vendor'         // anjali / aaliyah — second Resident/Vendor button; use name to disambiguate
  | 'Visitor'        // marcus@example.com     — Marcus Bowen

/**
 * Sign in via a demo shortcut button.
 * @param firstNameSubstring  - first name shown on the button (e.g., 'Karis', 'Devon', 'Aaliyah')
 */
export async function signInAs(page: Page, firstNameSubstring: string): Promise<void> {
  await page.goto('/sign-in')
  await expect(page.getByText('Demo accounts')).toBeVisible({ timeout: 15_000 })

  const btn = page.getByRole('button', { name: new RegExp(firstNameSubstring, 'i') })
  await btn.click()

  // Wait for redirect away from /sign-in
  await page.waitForURL((url) => !url.pathname.startsWith('/sign-in'), { timeout: 30_000 })
}

/** Sign out by navigating to the sign-out endpoint or clearing session cookie. */
export async function signOut(page: Page): Promise<void> {
  // Navigate to sign-in which triggers Clerk sign-out in the demo flow
  await page.goto('/sign-in')
  // Small wait to let clerk clear session cookie
  await page.waitForTimeout(500)
}
