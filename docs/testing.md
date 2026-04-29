# Testing Guide — City of Karis Community App

## Test suites

| Suite | Command | Runner | Coverage |
|---|---|---|---|
| Unit + integration | `pnpm test` | Vitest | Pure functions, DB queries, server actions |
| E2E critical paths | `pnpm test:e2e` | Playwright | 10 full-stack user flows |

---

## Unit tests (`pnpm test`)

Vitest runs all `*.test.ts` files under `lib/` and `components/`.

```bash
pnpm test          # run once
pnpm test:watch    # watch mode
```

Current baseline: **326 passing / 356 total** (30 skipped = Playwright stubs, not counted here).

---

## E2E tests (`pnpm test:e2e`)

### Prerequisites

1. **Environment file** — copy `.env.test.example` to `.env` (or set env vars directly):
   ```bash
   cp .env.test.example .env
   # Edit .env with real credentials
   ```

2. **Required env vars** (minimum):
   - `DATABASE_URL` — a dedicated TEST database (not production)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` — Clerk test instance
   - `NEXT_PUBLIC_DEMO_MODE_ENABLED=true` — enables demo shortcut buttons

3. **Install browsers** (one-time):
   ```bash
   pnpm exec playwright install chromium --with-deps
   ```

### Running tests

```bash
pnpm test:e2e              # headless, all tests
pnpm test:e2e:ui           # interactive UI mode
pnpm test:e2e:debug        # headed + paused for step-by-step debugging
pnpm test:e2e --grep "auth"  # filter by name
```

### How global-setup works

Before the first test, `tests/e2e/global-setup.ts`:
1. Runs `prisma migrate deploy` to ensure schema is current.
2. Runs the main seed (`lib/seed/seed.ts`) — idempotent upserts.
3. Seeds test-specific fixtures (pending approval records).
4. Creates `tests/e2e/fixtures/members-5row.xlsx` for the import test.

> The seeded DB state persists across all tests in a single run.
> Tests that mutate state (approve a request, cast a vote) should be
> re-run against a freshly seeded DB if they need to be repeated.

---

## The 10 critical-path tests

| # | File | Status | Notes |
|---|---|---|---|
| 1 | `auth-sign-in-each-role.spec.ts` | Active | 6 demo roles; requires `DEMO_MODE_ENABLED=true` |
| 2 | `ledger-transfer.spec.ts` | Skipped | No resident-to-resident transfer UI — TODO |
| 3 | `voucher-redemption.spec.ts` | Active | Admin approves seeded voucher request |
| 4 | `settlement-approval.spec.ts` | Active | Admin approves seeded settlement request |
| 5 | `property-transfer.spec.ts` | Active | Admin approves seeded property transfer |
| 6 | `voting.spec.ts` | Active | Aaliyah votes; Marcus cannot vote |
| 7 | `rental-extension.spec.ts` | Skipped | C.3 not started — TODO(phase1+/C.3) |
| 8 | `bulk-import-members.spec.ts` | Active | 5-row xlsx upload + commit |
| 9 | `emergency-broadcast.spec.ts` | Active | Send broadcast; verify email log; Devon dismisses banner |
| 10 | `mfa-enrol.spec.ts` | Active | TOTP enrollment flow (Naomi); handles already-enrolled case |

### Skipped tests explained

- **Test 2 (ledger-transfer)**: The TRANSFER transaction type exists in the schema, but there is no resident-facing UI to initiate a KCRD transfer to another resident. Implement this flow and remove the `test.skip` to activate the test.

- **Test 7 (rental-extension)**: Prompt C.3 (rental cycle + extension request) is not yet implemented. The admin approval UI exists but the resident-side request form does not.

---

## Adding a new test

1. Create `tests/e2e/my-new-flow.spec.ts` (do **not** prefix with `d[0-9]` — those are reserved for per-feature stubs).
2. Use `signInAs(page, firstName)` from `helpers/auth.ts` for authentication.
3. If your test needs a DB fixture, add it to `global-setup.ts` under `seedTestFixtures()`.
4. Run with `pnpm test:e2e --grep "my-new-flow"` to verify.

```ts
// Minimal example
import { test, expect } from '@playwright/test'
import { signInAs } from './helpers/auth'

test('my flow works', async ({ page }) => {
  await signInAs(page, 'Karis')
  await page.goto('/admin/some-page')
  await expect(page.getByRole('heading', { name: 'Some Page' })).toBeVisible()
})
```

---

## CI

The E2E suite runs on every push to `main` via `.github/workflows/e2e.yml`.

**Required GitHub repository secrets:**
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

**Optional secrets** (tests degrade gracefully without them):
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- `RESEND_API_KEY`

The CI job spins up a Postgres 16 service container, builds the Next.js app, and runs `pnpm test:e2e`. Playwright reports are uploaded as artifacts.

---

## Playwright report

After a run, open the HTML report:
```bash
npx playwright show-report playwright-report
```
