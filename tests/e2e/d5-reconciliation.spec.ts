/**
 * TODO(phase1+/D.5): Playwright E2E tests for treasury reconciliation auto-alerts.
 * These require @playwright/test, a running dev server, and authenticated MASTER_ADMIN session.
 * Install with: pnpm add -D @playwright/test
 *
 * Scenarios:
 * 1. Admin triggers reconciliation with a synthetic imbalanced ledger → MISMATCH report created →
 *    sticky red banner appears on all admin routes → acknowledge clears the banner →
 *    next reconciliation run with balanced ledger → banner does not reappear.
 * 2. "Run reconciliation now" button creates a report and redirects to the detail page
 *    with correct status pill rendered.
 *
 * Skipped here — kept as documentation for the Prompt D.10 E2E harness.
 */

import { describe, it } from 'vitest'

describe.skip('D.5 treasury reconciliation — full flow (requires live server + MASTER_ADMIN)', () => {
  it('mismatch triggers banner on admin routes; acknowledge clears it', () => {
    // 1. Sign in as MASTER_ADMIN
    // 2. Insert a synthetic imbalanced ledger entry (test fixture)
    // 3. GET /api/cron/reconciliation with Bearer CRON_SECRET
    // 4. Navigate to /admin/dashboard — assert red banner visible
    // 5. Click "Acknowledge alert" — assert banner disappears
    // 6. Reload /admin/dashboard — assert no banner
  })

  it('run-now button creates report and redirects to detail page', () => {
    // 1. Sign in as MASTER_ADMIN
    // 2. Navigate to /admin/treasury/reconciliation
    // 3. Click "Run reconciliation now"
    // 4. Assert URL contains /admin/treasury/reconciliation/<reportId>
    // 5. Assert status pill is rendered (OK or MISMATCH)
  })
})
