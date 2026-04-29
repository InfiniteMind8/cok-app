/**
 * TODO(phase1+/D.7): Playwright E2E tests for onboarding tour.
 * These require @playwright/test, a running dev server, and authenticated sessions.
 * Install with: pnpm add -D @playwright/test
 *
 * Scenarios:
 * 1. Fresh Master Admin (no onboardingTourCompletedAt / DismissedAt) sees the tour on first load,
 *    advances through all 8 steps, clicks Done — tour closes; reload — tour does not reappear.
 * 2. Master Admin who has completed the tour clicks "Show me around" in the sidebar footer —
 *    tour overlay opens at step 1; user skips — overlay closes.
 *
 * Skipped here — kept as documentation for the Prompt D.10 E2E harness.
 */

import { describe, it } from 'vitest'

describe.skip('D.7 onboarding tour — fresh Master Admin sees tour on first login (requires live server + MASTER_ADMIN)', () => {
  it('fresh Master Admin sees tour, advances through all 8 steps, and tour does not reappear on reload', () => {
    // 1. Sign in as fresh Master Admin (DB row has null onboardingTourCompletedAt/DismissedAt)
    // 2. Navigate to /admin/dashboard
    // 3. Assert tour overlay is visible: role="dialog" with aria-label containing "Tour step 1 of 8"
    // 4. Click "Next" 7 times to advance through all steps
    // 5. Assert step counter shows "8/8" and button reads "Done"
    // 6. Click "Done"
    // 7. Assert overlay is gone (no role="dialog")
    // 8. Reload page — assert tour overlay does NOT appear
  })
})

describe.skip('D.7 onboarding tour — replay via "Show me around" (requires live server + MASTER_ADMIN)', () => {
  it('Master Admin can replay tour via "Show me around" in admin sidebar footer', () => {
    // 1. Sign in as Master Admin with onboardingTourCompletedAt set (tour already done)
    // 2. Navigate to /admin/dashboard
    // 3. Assert tour overlay is NOT visible on load
    // 4. Click "Show me around" in the sidebar user footer
    // 5. Assert tour overlay appears at step 1 (aria-label contains "Tour step 1 of 8")
    // 6. Click "Skip tour"
    // 7. Assert overlay closes
  })
})
