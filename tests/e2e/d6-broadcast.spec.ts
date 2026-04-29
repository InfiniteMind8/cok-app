/**
 * TODO(phase1+/D.6): Playwright E2E tests for emergency broadcast.
 * These require @playwright/test, a running dev server, and authenticated MASTER_ADMIN session.
 * Install with: pnpm add -D @playwright/test
 *
 * Scenarios:
 * 1. Master Admin opens /admin/broadcast, composes a broadcast, types "BROADCAST" in the confirm
 *    modal, sends — sees result modal with sent count.
 * 2. Active resident user sees a sticky emergency banner after a broadcast has been sent.
 * 3. User clicks "Dismiss" on the banner — banner disappears and does not reappear on reload.
 *
 * Skipped here — kept as documentation for the Prompt D.10 E2E harness.
 */

import { describe, it } from 'vitest'

describe.skip('D.6 emergency broadcast — compose and send (requires live server + MASTER_ADMIN)', () => {
  it('Master Admin composes broadcast, types BROADCAST, sends — result modal shows sent count', () => {
    // 1. Sign in as MASTER_ADMIN
    // 2. Navigate to /admin/broadcast
    // 3. Fill title (≤80 chars) and body (≤2000 chars)
    // 4. Choose severity URGENT
    // 5. Click "Send Broadcast"
    // 6. Assert confirm modal opens with submit button disabled
    // 7. Type "BROADCAST" → assert submit button enabled
    // 8. Click "Confirm & Send" → assert spinner visible
    // 9. Assert done modal: "Broadcast sent, N delivered"
  })
})

describe.skip('D.6 emergency broadcast — in-app banner visibility (requires live server + RESIDENT)', () => {
  it('active resident sees sticky banner for unacknowledged emergency broadcast', () => {
    // 1. Ensure an emergency broadcast exists in DB (seeded or sent by admin)
    // 2. Sign in as RESIDENT with status ACTIVE
    // 3. Navigate to /community (or any resident route)
    // 4. Assert emergency broadcast banner is visible with correct severity color and headline
  })
})

describe.skip('D.6 emergency broadcast — acknowledge dismisses banner (requires live server + RESIDENT)', () => {
  it('clicking Dismiss removes banner and it does not reappear on reload', () => {
    // 1. Sign in as RESIDENT with unacknowledged emergency broadcast
    // 2. Banner is visible
    // 3. Click "Dismiss"
    // 4. Assert banner disappears
    // 5. Reload page — assert banner does not reappear
  })
})
