/**
 * TODO(phase1+/C.2): Playwright E2E tests for Visitor Groups system.
 * These require @playwright/test to be installed and a running dev server + seeded DB.
 * Install with: pnpm add -D @playwright/test
 *
 * Scenarios:
 * 1. Admin creates group, assigns visitor, sends targeted announcement;
 *    visitor-member sees it, visitor-non-member does not.
 * 2. Visitor attempting to POST castVoteAction receives "Visitors do not have access" error.
 * 3. Visitor can file an issue report (raiseIssueAction is permitted).
 *
 * Skipped here — kept as documentation for future E2E harness.
 */

import { describe, it } from 'vitest'

describe.skip('C.2 Visitor Groups — E2E (requires live server + @playwright/test)', () => {
  it('admin creates group → assigns visitor → sends announcement → member sees it, non-member does not', () => {
    // TODO(phase1+/C.2): implement with Playwright
  })

  it('visitor is denied access to voting server action', () => {
    // TODO(phase1+/C.2): implement with Playwright
  })

  it('visitor can file an issue report', () => {
    // TODO(phase1+/C.2): implement with Playwright
  })
})
