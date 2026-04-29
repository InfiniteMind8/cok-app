/**
 * D.10 — Test 2: ledger-transfer
 *
 * Resident A transfers KCRD to Resident B; both balances update;
 * ledger entries balance.
 *
 * SKIPPED: No resident-to-resident KCRD transfer UI exists in Phase 1+.
 * The wallet page offers Deposit and Settlement only.
 * The TRANSFER transaction type is in the schema and fee schedule but
 * has no frontend form. Build the transfer flow in a future prompt and
 * enable this test.
 *
 * TODO(phase1+/D.10): implement resident wallet transfer page then remove skip
 */
import { test } from '@playwright/test'

test.describe('Ledger — resident-to-resident KCRD transfer', () => {
  test.skip('No resident-to-resident transfer UI — TODO(phase1+/D.10)')
  test('resident A transfers 100 KCRD to resident B; both balances update', async () => {
    // Steps once UI is built:
    // 1. signInAs(page, 'Devon')
    // 2. Navigate to wallet → click Transfer
    // 3. Select Aaliyah as recipient, enter 100 KCRD, confirm
    // 4. Assert Devon balance decreased by 100
    // 5. signInAs(page, 'Aaliyah'), navigate to wallet
    // 6. Assert Aaliyah balance increased by 100
    // 7. Assert debit + credit ledger entries sum to zero
  })
})
