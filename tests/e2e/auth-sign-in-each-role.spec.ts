/**
 * D.10 — Test 1: auth-sign-in-each-role
 *
 * Signs in as each of the six demo roles via the demo shortcut buttons.
 * Verifies the redirect lands on a role-appropriate page (not sign-in).
 *
 * Requires: NEXT_PUBLIC_DEMO_MODE_ENABLED=true
 */
import { test, expect } from '@playwright/test'
import { signInAs } from './helpers/auth'

const DEMO_USERS: Array<{ firstName: string; expectedPathPrefix: string }> = [
  { firstName: 'Karis',  expectedPathPrefix: '/admin' },
  { firstName: 'Naomi',  expectedPathPrefix: '/admin' },
  { firstName: 'Devon',  expectedPathPrefix: '/' },
  { firstName: 'Anjali', expectedPathPrefix: '/' },
  { firstName: 'Aaliyah', expectedPathPrefix: '/' },
  { firstName: 'Marcus', expectedPathPrefix: '/' },
]

test.describe('Auth — sign in as each demo role', () => {
  for (const { firstName, expectedPathPrefix } of DEMO_USERS) {
    test(`signs in as ${firstName} and leaves /sign-in`, async ({ page }) => {
      await signInAs(page, firstName)

      const url = new URL(page.url())
      expect(url.pathname).not.toBe('/sign-in')
      expect(url.pathname.startsWith(expectedPathPrefix)).toBeTruthy()
    })
  }
})
