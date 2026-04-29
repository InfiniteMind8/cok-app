/**
 * TODO(phase1+/D.9): Playwright E2E tests for rate limiting.
 * These require @playwright/test to be installed and a running dev server.
 *
 * Scenarios:
 * 1. Hammer /sign-in with bad credentials 6 times from the same IP →
 *    the 6th page load returns 429 "Too many requests" from middleware.
 * 2. Sign in as MASTER_ADMIN, upload a valid xlsx 4 times within 1 hour →
 *    4th upload returns "Too many requests. Please try again in N seconds."
 *
 * Skipped here — kept as documentation for D.10 E2E harness.
 */

import { describe, it } from 'vitest'

describe.skip('D.9 Rate Limiting — E2E (requires live server + @playwright/test)', () => {
  it('sign-in: 6th attempt from same IP within 15 minutes returns 429', () => {
    // TODO(phase1+/D.10): implement with Playwright
    // 1. Navigate to /sign-in 5 times (expect Clerk sign-in page each time)
    // 2. Navigate to /sign-in a 6th time within the 15-min window
    // 3. Assert response status is 429 OR page body contains "Too many requests"
    // Note: in dev (no Redis), the in-memory limiter resets per process restart.
  })

  it('bulk-import: 4th upload within 1 hour is rejected with rate-limit error', () => {
    // TODO(phase1+/D.10): implement with Playwright
    // 1. Sign in as MASTER_ADMIN
    // 2. Upload a valid xlsx file 3 times (each should complete successfully)
    // 3. Upload a 4th xlsx file within the same 1-hour window
    // 4. Assert the upload response contains error "Too many requests. Please try again in N seconds."
  })
})
