# City of Karis — Community App

The resident-facing portal and admin back-office for the City of Karis settlement. Residents hold K Credits (an internal store-of-value token), transact with vendors, submit settlement requests, pay property installments, and participate in community governance. Admins manage accounts, treasury, approvals, and community content.

> **➡ For the current state of the project, read [`PROJECT-HANDOVER.md`](PROJECT-HANDOVER.md).** It is the canonical single source of truth as of 2026-05-09. Phase 1+ is engineering-complete — the README below is the original Phase 1 quickstart and the architecture / "What's NOT in Phase 1" sections are partially outdated (most of those items shipped in Phase 1+). The handover supersedes them. New sessions should read the handover first; its §13 lists the exact 8 files to read in order.

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/YOUR_USERNAME/cok-app.git
cd cok-app/website
pnpm install

# 2. Copy env file and fill in values (see Environment Variables below)
cp .env.example .env

# 3. Apply database migrations
pnpm exec prisma migrate deploy

# 4. Seed infrastructure (system wallets + genesis fee schedule)
pnpm seed:production

# 5. Start dev server
pnpm dev
```

Open `http://localhost:3000`. Sign in via Clerk — your account is created automatically via webhook on first sign-in.

---

## Architecture

### Stack

- **Next.js 16** App Router with route groups: `(admin)` → `/admin/*`, `(resident)` → `/wallet`, `/property`, `/community`, `/profile`
- **Prisma 7** with `@prisma/adapter-pg` — connection pooling via Supabase session pooler
- **Clerk** — authentication, user management, webhook-driven account sync
- **UploadThing** — photo and document storage
- **Resend** — transactional email
- **Vitest** — 36 unit tests covering fee engine, ledger math, and transaction logic

### Ledger Invariants

The ledger is append-only. No transaction is ever modified or deleted.

| Rule | Detail |
|---|---|
| Zero-sum | Every debit has a matching credit. Sum of all wallet balances = 0. |
| Single exception | `TREASURY_ADJUSTMENT` entries are one-sided (fiat deposit → K Credits creation). |
| Fee engine | Fees use banker's rounding (round-half-to-even) to prevent accumulation bias. |
| Fee distribution | `totalPct` splits across `communityFundPct`, `operationsFundPct`, `developerSharePct`. Must sum exactly. |

### Fee Schedule

A `FeeSchedule` row contains a JSON `rules` object keyed by `TransactionType`. The active schedule is the row with the highest `effectiveAt` that is ≤ `now`. All new transactions read the active schedule at creation time; changing the schedule does not retroactively affect past transactions.

---

## Environment Variables

| Variable | Source |
|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → Session pooler URI (port 5432) |
| `DIRECT_URL` | Same as `DATABASE_URL` (used by Prisma for migrations) |
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys |
| `CLERK_WEBHOOK_SECRET` | Clerk dashboard → Webhooks → signing secret |
| `RESEND_API_KEY` | Resend dashboard → API Keys |
| `UPLOADTHING_TOKEN` | UploadThing dashboard → API Keys |

---

## Deployment (Vercel)

1. Push this repo to GitHub (private).
2. Import the repo at vercel.com → New Project.
3. Add all 7 environment variables in Project Settings → Environment Variables.
4. First deploy runs automatically. The `vercel.json` `buildCommand` runs:
   - `prisma generate` — regenerates the Prisma client in CI
   - `prisma migrate deploy` — applies pending migrations (safe, non-destructive)
   - `next build` — compiles the app
5. After deploy, update the Clerk webhook endpoint URL to `https://YOUR_VERCEL_URL/api/webhooks/clerk`.
6. Run the production seed once from your local machine (with `.env` pointing to the production DB):
   ```bash
   pnpm seed:production
   ```

---

## What's NOT in Phase 1

The following features are deferred to Phase 2. They are architecturally supported (no breaking changes needed) but not implemented:

- **Push notifications** — `Notification` rows exist; real-time delivery (FCM/APNs/WebPush) is not wired up
- **Vendor portal** — vendors have wallets and accounts but no dedicated UI beyond the resident wallet view
- **Payroll workflows** — `PAYROLL` transaction type exists in the ledger; no admin UI for bulk payroll runs
- **Document e-signing** — contract URLs are stored; no in-app signing (DocuSign/HelloSign integration)
- **In-app messaging** — no resident-to-resident or resident-to-admin chat
- **Map view** — no satellite/plot view of the settlement
- **Stripe / payment gateway** — fiat deposits are recorded manually by admin; no online payment flow
- **Mobile native app** — Expo/React Native shell deferred; mobile-responsive web is the Phase 1 target
- **Two-factor authentication** — Clerk supports it; not enforced in Phase 1
- **Audit log viewer** — all mutations are DB-logged; no admin UI to browse the audit trail
- **Bulk CSV export** — ledger data accessible via Supabase dashboard; no in-app export
