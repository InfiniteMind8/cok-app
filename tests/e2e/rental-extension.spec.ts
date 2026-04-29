/**
 * D.10 — Test 7: rental-extension
 *
 * SKIPPED: Prompt C.3 (Rental cycle + extension request) is Not Started.
 * The resident-side extension request form does not exist yet.
 * The admin approval UI (rental-extension-dialogs.tsx) is present but
 * there is no resident-facing "request extension" flow to trigger it.
 *
 * TODO(phase1+/C.3): implement resident extension request, then complete:
 *  1. Sign in as Aaliyah (RESIDENCE-B07 rental)
 *  2. Navigate to her property / lease page
 *  3. Click "Request extension" → fill end date + reason → submit
 *  4. Sign in as Karis (Master Admin)
 *  5. Navigate to Approvals → Rental Extensions
 *  6. Approve the request
 *  7. Verify tenancy.endDate updated in the UI
 *  8. Verify resident sees updated end date on their property card
 */
import { test } from '@playwright/test'

test.describe('Rental extension — request and approve', () => {
  test.skip('C.3 not implemented — TODO(phase1+/C.3)')
  test('resident requests extension; admin approves; end date updates', async () => {
    // Implementation deferred to C.3
  })
})
