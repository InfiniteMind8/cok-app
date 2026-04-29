import { test } from '@playwright/test'

// TODO(phase1+/D.14): Activate when test infra supports floor mutation
// Requires: seeded system wallet with floor set near balance
describe.skip('D.14 system wallet floor protection', () => {
  test('near-floor: yellow warning banner is visible on Treasury dashboard', async ({ page }) => {
    // 1. Sign in as MASTER_ADMIN
    // 2. Set treasury_reserve floor to 90% of current balance
    // 3. Navigate to /admin/treasury
    // 4. Expect yellow warning banner on treasury_reserve card
    // 5. Expect headroom < 10% of balance
  })

  test('at-floor: mutation blocked and UI explains the reason', async ({ page }) => {
    // 1. Sign in as MASTER_ADMIN
    // 2. Set treasury_reserve floor = current balance (headroom = 0)
    // 3. Navigate to /admin/treasury
    // 4. Expect red banner on treasury_reserve card with block message
    // 5. Attempt a transfer from treasury_reserve via API; expect FloorBreachError response
  })
})
