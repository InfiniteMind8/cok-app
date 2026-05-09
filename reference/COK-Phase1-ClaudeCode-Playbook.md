# City of Karis — Phase 1 MVP Playbook for Claude Code

**Version:** 1.0
**Date:** April 2026
**Owner:** Amani Saif
**For:** Dr. Karis Munroe / City of Karis (COK)

This playbook contains everything needed to build the Phase 1 MVP of the COK Community App in 5–7 hours of focused Claude Code sessions. Run the prompts in order, in the same workspace, with the brand skill loaded.

---

## Table of Contents

1. [Pre-flight checklist](#1-pre-flight-checklist)
2. [Stack lock & key decisions](#2-stack-lock--key-decisions)
3. [The brand skill (create this first)](#3-the-brand-skill-create-this-first)
4. [Prompt 1 — Foundation](#prompt-1--foundation)
5. [Prompt 2 — Ledger & fee engine](#prompt-2--ledger--fee-engine)
6. [Prompt 3 — Master Admin dashboard](#prompt-3--master-admin-dashboard)
7. [Prompt 4 — Resident & Visitor mobile UI](#prompt-4--resident--visitor-mobile-ui)
8. [Prompt 5 — Property module](#prompt-5--property-module)
9. [Prompt 6 — Community layer](#prompt-6--community-layer)
10. [Prompt 7 — Polish, brand pass, demo data](#prompt-7--polish-brand-pass-demo-data)
11. [Prompt 8 — Deploy](#prompt-8--deploy)
12. [Demo script](#demo-script)
13. [Path to production](#path-to-production)
14. [Revenue-share contract clause](#revenue-share-contract-clause)

---

## 1. Pre-flight checklist

Complete before opening Claude Code. Estimated time: 30 minutes.

**Accounts and keys (have these in a notes file):**

- [ ] Supabase project created → `DATABASE_URL` and `DIRECT_URL`
- [ ] Clerk app created → `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, sign-in URL configured
- [ ] Vercel account, GitHub connected
- [ ] Resend account → `RESEND_API_KEY`, verified sending domain (or use the test domain for demo)
- [ ] Uploadthing account → `UPLOADTHING_TOKEN`
- [ ] Optional: Sentry account → `SENTRY_DSN`
- [ ] Optional: domain registered (e.g. `app.cityofkaris.com`)

**Local environment:**

- [ ] Node.js 20+ installed
- [ ] pnpm or npm latest
- [ ] Git installed and authenticated
- [ ] Empty workspace folder created: `~/projects/cok-app`
- [ ] Claude Code installed and authenticated

**Assets staged in workspace:**

- [ ] `assets/COK-Logo-Main-Metallic-WithGuyana-NoBKG.png`
- [ ] `assets/COK-CommunityApp-AccountFunctions-V1-REF.pdf` (functional spec)
- [ ] `assets/COK-Main-REF.pdf` (brand spec)

**Decisions confirmed:**

- [ ] Demo will be deployed at a single URL (web only, mobile-responsive PWA)
- [ ] All financial flows are simulated for demo (no real money rails yet)
- [ ] Five seeded users: 1 Master Admin, 1 Admin, 1 Vendor, 2 Residents, 1 Visitor
- [ ] One seeded property assigned to each Resident
- [ ] Active vote, sample updates, sample issues all seeded

---

## 2. Stack lock & key decisions

**Web framework:** Next.js 15 (App Router), TypeScript strict mode.
**Styling:** Tailwind CSS v4, shadcn/ui components, Radix primitives.
**Database:** PostgreSQL via Supabase. Prisma as ORM.
**Auth:** Clerk (handles MFA, social, magic link out of the box).
**File uploads:** Uploadthing.
**Email:** Resend.
**Hosting:** Vercel.
**Mobile experience:** Mobile-first responsive PWA. Native app wrapping deferred to Phase 1.5.
**State:** Server components by default; React Server Actions for mutations; minimal client state via Zustand only where needed.
**Validation:** Zod everywhere — form schemas, API contracts, env vars.
**Testing for demo:** Vitest unit tests for the ledger only (because that's where bugs are catastrophic). E2E tests deferred to Tier 2.

**Repository structure (single Next.js app, no monorepo):**

```
cok-app/
├── app/
│   ├── (auth)/            # Clerk sign-in/up routes
│   ├── (resident)/        # Mobile-first resident & visitor experience
│   │   ├── wallet/
│   │   ├── property/
│   │   ├── community/
│   │   ├── profile/
│   │   └── layout.tsx     # Bottom tab bar
│   ├── (admin)/           # Master Admin web dashboard
│   │   ├── dashboard/
│   │   ├── approvals/
│   │   ├── treasury/
│   │   ├── accounts/
│   │   ├── properties/
│   │   ├── community/
│   │   └── layout.tsx     # Sidebar layout
│   ├── api/               # Webhooks only (Clerk, Uploadthing)
│   └── layout.tsx
├── components/
│   ├── ui/                # shadcn primitives
│   ├── resident/          # Resident-specific components
│   ├── admin/             # Admin-specific components
│   └── shared/            # Brand-aware shared components
├── lib/
│   ├── ledger/            # The fee engine and ledger service — sacred ground
│   ├── db.ts              # Prisma client
│   ├── auth.ts            # Clerk helpers + role checks
│   ├── seed/              # Seed scripts
│   └── utils.ts
├── prisma/
│   └── schema.prisma
├── public/
│   ├── logo.png
│   └── manifest.json      # PWA manifest
└── ...
```

---

## 3. The brand skill (create this first)

Before running any prompt, create this file at `.claude/skills/cok-brand/SKILL.md` in the project root. Every subsequent prompt instructs Claude Code to read it.

**Why this matters:** Claude Code generates a lot of UI across many files over many hours. Without a single source of truth for brand tokens, drift is inevitable. The skill enforces consistency.

```markdown
---
name: cok-brand
description: Use this skill whenever generating UI, copy, or design tokens for the City of Karis (COK) Community App. Required reading for any prompt that produces visible output. Encodes brand colors, typography, voice, logo rules, and UI patterns.
---

# City of Karis — Brand Skill

## Voice and Tone

City of Karis is **elegant, calm, confident, welcoming**. Avoid:
- Corporate jargon ("synergy", "leverage", "robust solution")
- Religious or mystical undertones ("blessed", "sacred", "destined")
- Tech bro language ("disrupt", "10x", "game-changer")
- Generic real estate clichés ("luxury finishes", "prime location", "state-of-the-art")

Prefer specific, grounded benefits. Instead of "luxury living," say "off-grid solar with 72-hour battery backup." Instead of "world-class amenities," say "telemedicine consultation within 15 minutes."

Example tagline phrasings to draw from:
- "Beautiful, Empowered Living in Guyana"
- "Where global standards meet Guyanese soul"
- "Come Home to Higher Standards"

## Color Palette

Use as Tailwind CSS variables in `app/globals.css`:

```css
@theme inline {
  /* Primary — Deep green: sustainability, Guyanese nature */
  --color-karis-green-50:  oklch(0.97 0.02 155);
  --color-karis-green-100: oklch(0.92 0.04 155);
  --color-karis-green-500: oklch(0.45 0.08 155);
  --color-karis-green-700: oklch(0.32 0.07 155);
  --color-karis-green-900: oklch(0.20 0.05 155);  /* deep brand green */

  /* Accent — Warm gold/amber: oil wealth, sunlight, grace */
  --color-karis-gold-300:  oklch(0.85 0.10 80);
  --color-karis-gold-500:  oklch(0.72 0.13 75);   /* primary gold */
  --color-karis-gold-700:  oklch(0.55 0.12 70);

  /* Neutral — Warm stone/taupe: upscale elegance */
  --color-karis-stone-50:  oklch(0.98 0.005 70);
  --color-karis-stone-100: oklch(0.95 0.01 70);
  --color-karis-stone-300: oklch(0.85 0.015 70);
  --color-karis-stone-500: oklch(0.65 0.02 70);
  --color-karis-stone-900: oklch(0.22 0.01 70);

  /* Status colors (for emergencies, issue priorities) */
  --color-status-yellow: oklch(0.82 0.15 90);
  --color-status-orange: oklch(0.70 0.18 50);
  --color-status-red:    oklch(0.58 0.21 25);
  --color-status-green:  oklch(0.65 0.16 145);
}
```

**Default surfaces:**
- App background: `karis-stone-50`
- Card background: white with `karis-stone-100` border
- Primary CTA: `karis-green-900` background, white text
- Secondary CTA: `karis-gold-500` background, `karis-green-900` text
- Headings: `karis-green-900`
- Body text: `karis-stone-900` at 90% opacity

## Typography

Load these from Google Fonts via `next/font`:

- **Display / wordmark:** Cormorant Garamond (variable weight). Used for the "City of Karis" wordmark, page hero titles, and quote-style content.
- **Headings:** Fraunces (variable weight, optical sizing). Used for h1–h3.
- **Body:** Inter (variable weight). Used for everything else.

Avoid futuristic, tech, monospace, or rounded display fonts. Lean timeless and humanist.

## Logo Usage

The COK logo lives at `/public/logo.png` (metallic gold version, no background).

- Always show on a dark or stone background (logo is gold metallic).
- Minimum height: 40px on mobile, 56px on desktop.
- Never recolor, distort, or apply effects.
- In header bars, pair with the wordmark "City of Karis" in Cormorant Garamond when there's room; logo alone otherwise.

## UI Patterns

**Mobile (resident/visitor) navigation:** Bottom tab bar with 4 tabs — Wallet, Property, Community, Profile. Tab bar uses `karis-green-900` background, gold accent for active tab. Visitor accounts hide the Property tab.

**Admin navigation:** Left sidebar, full-height, `karis-stone-900` background. Sections: Dashboard, Approvals, Treasury, Accounts, Properties, Community, Settings.

**Cards:** Subtle border (`karis-stone-100`), rounded-xl, no harsh shadows. Use `shadow-sm` at most. Empty states are styled, never blank.

**Buttons:** Default to lowercase or sentence case ("View wallet", not "VIEW WALLET" or "View Wallet"). Generous padding. Brand primary buttons have a subtle gold underline accent on hover.

**Status indicators:** Use small dot + label rather than full-color pills for status. E.g., a `karis-status-green` dot followed by "Approved" in `karis-stone-900`.

**Currency display:** K Credits shown as "K 1,250.00" with the K in `karis-gold-700`. Always two decimal places. Never abbreviate ("K 1.25K" is forbidden).

**Numbers:** Tabular figures (`font-variant-numeric: tabular-nums`) on all wallet, balance, and ledger displays.

## Forbidden patterns

- Emoji in production UI (except 🇬🇾 in country contexts when explicitly needed)
- Gradients except where brand-justified (e.g., gold-to-amber on hero accents only)
- Drop shadows beyond `shadow-sm` and `shadow-md`
- Icons that don't come from `lucide-react`
- Mixing currency symbols (USD/$ never appears next to K Credit values)

## Copy patterns

- "K Credits" not "credits", "tokens", or "coins"
- "Master Admin" not "super admin" or "owner"
- "Resident" capitalized when referring to the role
- "Settlement" for K → fiat, "Deposit" for fiat → K
- Empty wallet line: "No transactions yet. Your activity will appear here."
- First-time greeting: "Welcome to City of Karis."
```

---

## Prompt 1 — Foundation

**Goal:** Working Next.js app with auth, schema, seed data, and base layouts. Nothing user-facing complete; foundation for everything that follows.

**Estimated time:** 45 minutes.

**Run this prompt:**

```
You are building Phase 1 of the City of Karis (COK) Community App, a digital platform for an off-grid community in Guyana with an internal cashless economy based on K Credits. This is the foundation session.

Before doing anything, read these skills:
- /mnt/skills/public/frontend-design/SKILL.md
- ./.claude/skills/cok-brand/SKILL.md

Also read these reference files for context:
- ./assets/COK-CommunityApp-AccountFunctions-V1-REF.pdf
- ./assets/COK-Main-REF.pdf

Then build:

1. **Scaffold a Next.js 15 App Router project** in the current directory with TypeScript strict, Tailwind CSS v4, ESLint, and the `src/` directory disabled (use root-level `app/`). Initialize with pnpm. Install shadcn/ui (init with neutral base color, we will override) and add these components: button, card, input, label, form, select, dialog, sheet, table, tabs, badge, avatar, dropdown-menu, toast, skeleton, separator, scroll-area.

2. **Apply the brand tokens** from the cok-brand skill into `app/globals.css`. Set up `next/font` for Cormorant Garamond, Fraunces, and Inter. Configure them as CSS variables `--font-display`, `--font-heading`, `--font-body` and apply on `<html>`.

3. **Install and configure:**
   - Prisma + @prisma/client
   - Clerk (`@clerk/nextjs`) — wire `<ClerkProvider>` in root layout, add middleware, create `(auth)/sign-in/[[...sign-in]]/page.tsx` and equivalent for sign-up using `<SignIn />` and `<SignUp />` components, branded with the COK logo and stone-50 background
   - Uploadthing
   - Resend
   - Zod
   - date-fns
   - lucide-react

4. **Create the Prisma schema** at `prisma/schema.prisma` matching the schema in section "Schema appendix" below. Run `pnpm prisma migrate dev --name init`.

5. **Generate the Prisma client** and create `lib/db.ts` with a singleton pattern.

6. **Create `lib/auth.ts`** with these helpers:
   - `getCurrentUser()` — fetches Clerk user, joins to our `User` table, returns null if unauthenticated
   - `requireRole(role: Role | Role[])` — throws/redirects if user doesn't have role
   - A Clerk webhook handler at `app/api/webhooks/clerk/route.ts` that creates a `User` row and a `Wallet` row when a user signs up. Default role is VISITOR.

7. **Create the two layout shells:**
   - `app/(resident)/layout.tsx` — mobile-first, bottom tab bar with Wallet / Property / Community / Profile. Hide Property tab for VISITOR role. Use brand colors. Logo top-left in header. Use the Cormorant Garamond wordmark "City of Karis" next to the logo on screens wider than `sm`.
   - `app/(admin)/layout.tsx` — sidebar layout for desktop, sections per the brand skill. Restrict access to MASTER_ADMIN role only via middleware check. Show "Master Admin" label, the user's avatar, and a sign-out button at the bottom of the sidebar.

8. **Create a root landing page** at `app/page.tsx` that:
   - If signed out, shows a hero section with the logo, the wordmark, the tagline "Beautiful, Empowered Living in Guyana", and "Sign in" / "Join the founding cohort" CTAs.
   - If signed in as MASTER_ADMIN, redirects to `/dashboard`.
   - If signed in as RESIDENT or VISITOR, redirects to `/wallet`.
   - If signed in as ADMIN or VENDOR, shows a "Coming soon — Phase 2" placeholder with their name and role.

9. **Create the seed script** at `lib/seed/seed.ts` and wire `pnpm seed` in package.json. Seed:
   - 3 system wallets (community_fund, operations_fund, developer_share) with isSystem=true
   - 1 Master Admin: Karis Munroe (karis@cityofkaris.com)
   - 1 Admin: Naomi Wells
   - 1 Vendor: Anjali Pereira (Pereira Wellness Studio)
   - 2 Residents: Devon McKenzie, Aaliyah Singh
   - 1 Visitor: Marcus Bowen
   - The Master Admin's wallet should have K 5,000 in it; Residents K 1,500 each; Visitor K 200; Vendor K 800
   - Treasury starting balance: K 50,000 backing

10. **Create the PWA manifest** at `public/manifest.json` with name "City of Karis", short_name "Karis", theme_color matching karis-green-900, and icons referencing `/logo.png`. Link it in root layout.

11. **Set up env validation** at `lib/env.ts` using Zod, validating: `DATABASE_URL`, `DIRECT_URL`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `RESEND_API_KEY`, `UPLOADTHING_TOKEN`. Import this from a server-only file so it runs at boot.

12. **Verify it boots.** Run `pnpm dev`, manually confirm the landing page renders with brand fonts and colors. Stop the server. Report back what you built and any decisions you made.

Constraints:
- Do not invent features beyond what's listed.
- Do not add a database adapter package other than Prisma.
- Do not add Redux, Jotai, or any state library — server components only for now.
- Every file you create must use TypeScript and pass `pnpm typecheck`.
- Every UI component you write must reference brand tokens from globals.css, not hardcoded hex colors.
- The brand wordmark "City of Karis" appears in Cormorant Garamond, never another font.
```

---

## Prompt 2 — Ledger & fee engine

**Goal:** The financial heart of the system. Double-entry append-only ledger, configurable fee schedule with revenue-share splits, atomic transaction service. **This is the most important prompt — do not skip the verification step.**

**Estimated time:** 60 minutes.

**Run this prompt:**

```
You are continuing the City of Karis app. The foundation from session 1 is complete. This session builds the ledger and fee engine — the core of the cashless economy.

Read these skills first:
- ./.claude/skills/cok-brand/SKILL.md

The principles you must honor (these are non-negotiable):

1. **Append-only double-entry ledger.** Every K Credit movement is a Transaction with two or more LedgerEntry rows whose signed amounts sum to zero. Nothing is ever updated or deleted; corrections happen via reversing transactions.

2. **A single service controls all credit movement.** No code outside `lib/ledger/` can write to LedgerEntry or Transaction. Every other module that needs to move credits calls `transferCredits()`.

3. **Fees are configuration, stamped at transaction time.** Each transaction records the `feeScheduleId` it was charged under. Fee schedules are never edited — new schedules are created with a new `effectiveAt`.

4. **System wallets are real wallets.** community_fund, operations_fund, developer_share live in the same `wallets` table with `isSystem=true`. Standard wallet logic works for them.

5. **The invariant always holds.** Sum of all wallet balances + Treasury reserve = Treasury balance issued. A reconciliation function asserts this and is run after every transaction in development mode.

Build:

1. **Create `lib/ledger/types.ts`** with TypeScript types:
   - `TransferRequest` — { fromWalletId, toWalletId, amount, transactionType, description, metadata? }
   - `TransferResult` — { transactionId, ledgerEntries[], feeBreakdown, newSenderBalance, newRecipientBalance }
   - `TransactionType` enum matching the Prisma enum
   - `FeeSplit` — { communityFund, operationsFund, developerShare, total }

2. **Create `lib/ledger/fee-engine.ts`:**
   - `getActiveFeeSchedule(at: Date = new Date())` — returns the latest FeeSchedule with effectiveAt <= now
   - `calculateFee(transactionType, grossAmount, schedule): FeeSplit` — returns the four-way split based on the schedule
   - Use Decimal.js (`decimal.js`) for ALL money arithmetic. Never use floats. Install if not present.
   - Round at the entry level using banker's rounding to 2 decimal places.

3. **Create `lib/ledger/service.ts` with `transferCredits()`:**
   - Validates inputs (amount > 0, wallets exist, sender has sufficient balance)
   - Looks up the active fee schedule
   - Calculates fee split
   - Opens a Prisma `$transaction()`
   - Creates a Transaction row with feeScheduleId stamped
   - Creates LedgerEntry rows: debit sender (gross), credit recipient (gross - total fee), credit each system wallet for its split
   - Validates entries sum to zero before commit (throw if not)
   - Returns full TransferResult
   - On any error inside the transaction, the whole thing rolls back

4. **Create `lib/ledger/balance.ts`:**
   - `getWalletBalance(walletId)` — sum of all LedgerEntry.amount for that wallet, using Decimal.js
   - `getWalletSummary(walletId)` — returns Current Balance, Total Deposited, Total Earned, Total Eligible for Conversion (use TransactionType to categorize)
   - All functions tabular-num formatted output via a `formatKCredit()` helper

5. **Create `lib/ledger/reconciliation.ts`:**
   - `reconcileTreasury()` — sums all wallet balances, compares to issued treasury credits, returns { isBalanced: boolean, discrepancy: Decimal, details }
   - In development, this runs after every transferCredits() call and throws if not balanced
   - In production, it runs nightly via a cron-style endpoint

6. **Create the deposit and settlement flows:**
   - `lib/ledger/deposits.ts` with `recordDeposit({ userId, fiatAmount, currency, paymentMethod, proofUrl, treasuryAdminId })` — creates a special-type Transaction that mints K Credits into the user's wallet, with the corresponding Treasury reserve increase. No fee on deposits.
   - `lib/ledger/settlements.ts` with:
     - `requestSettlement({ userId, amount })` — creates a SettlementRequest in PENDING_APPROVAL state, no ledger movement yet
     - `approveSettlement({ settlementId, masterAdminId })` — moves to APPROVED state, still no ledger movement
     - `executeSettlement({ settlementId, treasuryAdminId, proofUrl })` — calls transferCredits() to move K Credits from user wallet to a "settlement_burn" system wallet (with the settlement fee taken), records fiat payout, marks SETTLED

7. **Create the fee schedule seed.** In `lib/seed/seed.ts`, insert this initial FeeSchedule with effectiveAt set to one minute ago:

   | Transaction Type | Total | Community Fund | Operations Fund | Developer Share |
   |---|---|---|---|---|
   | PURCHASE | 2.5% | 1.5% | 0.5% | 0.5% |
   | VENDOR_SETTLEMENT | 1.0% | 0.5% | 0.5% | 0% |
   | RESIDENT_SETTLEMENT | 1.0% | 0.5% | 0.5% | 0% |
   | VISITOR_SETTLEMENT | 1.0% | 0.5% | 0.5% | 0% |
   | BARTER | 0% | 0% | 0% | 0% |
   | PAYROLL | 0% | 0% | 0% | 0% |
   | DEPOSIT | 0% | 0% | 0% | 0% |
   | TRANSFER | 0% | 0% | 0% | 0% |

8. **Write Vitest unit tests** at `lib/ledger/__tests__/`:
   - `fee-engine.test.ts` — all 8 transaction types, edge cases (zero amount, large amount, fractional cents)
   - `service.test.ts` — successful purchase deducts correct amounts, rolls back on insufficient balance, idempotency works, system wallets receive splits
   - `reconciliation.test.ts` — passing and failing scenarios
   - `settlement.test.ts` — full lifecycle from request → approve → execute

   Run `pnpm test` and confirm all tests pass before moving on.

9. **Create a small admin-only debug page** at `app/(admin)/treasury/debug/page.tsx` that lists all wallets, their balances, and the reconciliation status with a green or red indicator. This is invaluable during development.

10. **Demonstrate it works.** Create a script `lib/seed/demo-transactions.ts` that runs 5 sample transactions:
    - Resident Devon deposits K 500 (treasury → wallet)
    - Resident Devon purchases K 100 from Vendor Anjali (fee splits should appear in system wallets)
    - Resident Aaliyah barters K 50 with Devon (no fee)
    - Vendor Anjali requests settlement of K 75 (just creates request)
    - Master Admin approves Anjali's settlement (just changes state)
    Run this after seed. Print the resulting wallet balances and verify reconciliation passes.

Constraints:
- decimal.js for ALL math, no exceptions
- No floats, ever, in financial code
- LedgerEntry rows are append-only — no UPDATE or DELETE permissions ever
- Tests must pass before you report done
```

---

## Prompt 3 — Master Admin dashboard

**Goal:** The control center for Karis. Treasury overview, approvals queue, account creation, deposit recording, property registry.

**Estimated time:** 75 minutes.

**Run this prompt:**

```
Continue the City of Karis app. Foundation and ledger are complete. Now build the Master Admin dashboard.

Read first:
- ./.claude/skills/cok-brand/SKILL.md
- /mnt/skills/public/frontend-design/SKILL.md

Build inside `app/(admin)/`:

1. **Dashboard page** at `app/(admin)/dashboard/page.tsx`:
   - Top section: Treasury Balance card (large, gold accent), Community Investment Fund card (with a "Disburse" button placeholder)
   - Grid of four stat cards: Total Credits in Circulation, Total Active Members, Pending Approvals (count, links to /approvals), Open Issues (count, links to /community/issues)
   - "Treasury flow by user type" section: a table showing Deposits Total and Settlements Total per role (Resident, Vendor, Visitor, Admin)
   - "Total Credits in Wallets" section: same table but for circulating credits per role
   - All numbers from real ledger queries. Use server components.

2. **Approvals queue** at `app/(admin)/approvals/page.tsx`:
   - Tabs: Settlements, Account Upgrades, Property Updates (Phase 2 placeholder), Vendor Items (Phase 2 placeholder)
   - Settlements tab: table of pending settlement requests with columns Request ID, User, Amount, Submitted, Eligible Balance, Action. The Action column has Approve / Decline buttons that call server actions. Approve transitions state via `lib/ledger/settlements.ts`.
   - Account upgrades tab: list of pending visitor → resident upgrade requests (we'll add the request mechanism later; for now just a placeholder if empty)
   - Each approve action shows a confirmation dialog with the full details before committing
   - Toasts on success/failure

3. **Treasury operations** at `app/(admin)/treasury/page.tsx`:
   - Card showing current Treasury Reserve (fiat backing) with an "Update Treasury Backing" button that opens a dialog (records a TreasuryAdjustment row)
   - "Record Deposit" button that opens a sheet/dialog with form: select user (combobox), amount in fiat, currency (default USD), payment method, proof of payment upload (Uploadthing), notes. On submit, calls `recordDeposit()` from the ledger service. Shows the resulting K Credits issued (1:1 for now).
   - Recent deposits table below
   - "Execute approved settlement" button: takes a Master-Admin-approved settlement, marks executed (proof of fiat payout upload), wallet auto-debits via the ledger service.

4. **Accounts management** at `app/(admin)/accounts/page.tsx`:
   - Table of all users with columns: Name, Member ID, Role, Status, Wallet Balance, Joined, Actions
   - Filters: role (multi-select), status (Active/Suspended), search by name
   - "Create Account" button opens a dialog with form: full name, email, role, KYC fields (date of birth, government ID number, country, phone). On submit, this creates a Clerk invitation AND pre-creates the user record with role, so when they sign up they're auto-linked. Show the invitation URL in a success toast.
   - Row actions: View (drawer with full details), Suspend (dialog with reason), Restore, Upgrade Visitor (dialog to choose target role)
   - Member IDs are auto-generated as `K-` + 6 base32 characters when the user is created

5. **Properties registry** at `app/(admin)/properties/page.tsx`:
   - Table of all properties with columns: Property ID, Type, Owner, Tenant, Total Price, Paid %, Status
   - "Add Property" button → form with: property code, type (Ownership/Rental/Admin), category (Commercial/Residential/Mixed), address, total price (for ownership), specifications (JSON-ish key-value editor), photo upload (multiple via Uploadthing)
   - Each property has a detail page at `[propertyId]/page.tsx` with:
     - Tabs: Overview, Installments, Owner, Tenant, Documents, Updates (Phase 2)
     - Overview: photos, specs, type
     - Installments: table editor — add installment with number, due date, amount, progress note
     - Owner tab: assign user, contract upload, contract date, payment records (number, amount, proof)
     - Tenant tab: similar but with rental cycle (daily/weekly/monthly/annual) and cycle payment
     - Documents: list of all uploaded docs with type tags

6. **Community management** at `app/(admin)/community/page.tsx`:
   - Tabs: Updates, Votes, Issues
   - Updates tab: list of community updates, "New Update" button (Headline, Category, Photo, Update message, send via). Submitting publishes immediately and triggers notifications.
   - Votes tab: list of active and past votes, "New Vote" button (Headline, Description, Add Options dynamically each with a description). Closes vote button.
   - Issues tab: list of all issues raised by Residents, Vendors, Visitors, and Admins. Filter by source role, seriousness, urgency, status. Click row to open issue with reply box.

7. **Settings page** at `app/(admin)/settings/page.tsx`:
   - Fee schedule viewer (read-only display of active schedule, with link to "create new schedule" — Phase 2 since changes are rare)
   - System wallets summary (community fund, operations fund, developer share balances)
   - Audit log feed (recent admin actions)

Constraints:
- Every mutation goes through a Server Action defined in a server-only file
- Every Server Action is wrapped with `requireRole(['MASTER_ADMIN'])`
- All financial mutations call into `lib/ledger/` services — never write LedgerEntry directly from the UI layer
- Tables use shadcn/ui Table primitives with sticky headers and pagination
- Forms use react-hook-form + zod
- Empty states have a copy line and an icon, never blank
- Loading states use Skeleton components
- All photos render at correct aspect ratios with `next/image`
- Mobile responsive even though admin is desktop-primary — at minimum readable on tablet
```

---

## Prompt 4 — Resident & Visitor mobile UI

**Goal:** The mobile-first PWA experience that founding residents will fall in love with. Wallet, transactions, settlement requests, profile, member QR.

**Estimated time:** 75 minutes.

**Run this prompt:**

```
Continue the City of Karis app. Now build the resident and visitor mobile-first experience.

Read first:
- ./.claude/skills/cok-brand/SKILL.md
- /mnt/skills/public/frontend-design/SKILL.md

This is the experience that will define how members feel about Karis. Spend the most attention on visual polish here.

Build inside `app/(resident)/`:

1. **Wallet (home tab)** at `app/(resident)/wallet/page.tsx`:
   - Hero card at top: large K Credit balance in tabular nums, "K" prefix in gold, two-line subtitle showing member's full name and member ID (small, stone-500)
   - Subtle gold gradient line under the balance — the only gradient in the app
   - Two action buttons side by side: "Deposit" (primary green) and "Request settlement" (secondary, gold border)
   - "Deposit" opens a sheet explaining "To add K Credits, visit the Treasury Office or contact your Admin. Your deposit will appear here once recorded." with a "Contact Admin" button that drafts a message
   - "Request settlement" opens a sheet with: amount input (max = current balance), purpose (free text), submit. On submit, creates a SettlementRequest. Show estimated fee (1%) below the amount in real-time.
   - Below: 3-card grid (or stack on narrow mobile): Total Deposited, Total Earned, Eligible for Conversion. Each shows the value with a tiny info tooltip explaining what it means.
   - Recent Transactions section: list of last 10 transactions, each row showing: icon (lucide based on type), description, date (relative if <7 days), amount (red for outgoing, green for incoming, with K prefix in gold). Tap row to open transaction detail sheet.
   - Transaction detail sheet shows: full description, date/time, counterparty, fee breakdown (if applicable), reference ID, "View receipt" button (generates a styled PDF receipt — use react-pdf-renderer)
   - "View all transactions" link at bottom → `/wallet/transactions` with infinite scroll
   - Bottom: small line "Your K Credits are backed 1:1 by Treasury reserves." in stone-500

2. **Settlement Requests** at `app/(resident)/wallet/settlements/page.tsx`:
   - List of all settlement requests with status pills (Pending Approval / Approved / Settled / Declined)
   - Tap row to see full timeline: Submitted → Approved by Master Admin → Settled by Treasury Admin (with timestamps and proof links once available)
   - "Cancel request" available only when status = Pending Approval

3. **Property tab** at `app/(resident)/property/page.tsx` (Resident only — hide tab for Visitors):
   - If no property: empty state with "Your property will appear here once assigned. Contact your Admin if you believe this is an error."
   - If property:
     - Hero: photo carousel of the property
     - Type pill, address, member ID
     - Big card: "Ownership progress" with circular progress (% paid), Total Price, Paid to Date, Outstanding, Next Installment date and amount
     - "Installment schedule" expandable list: each installment shows number, due date, amount, status (Paid/Due/Upcoming), proof link if paid
     - For tenants instead: "Rental status" card with cycle, current cycle paid status, next cycle due date, recent cycles
     - "Documents" section: tappable list of contracts and title deeds
     - "Updates" placeholder card: "Construction updates from your Admin will appear here. Coming in Phase 2."

4. **Community tab** at `app/(resident)/community/page.tsx`:
   - Tabs at top: Updates, Voting, Notifications
   - Updates: feed of community updates from Admins. Each update is a card with headline, photo (if any), category badge (gold), date, message (truncated with "Read more"). Newest first.
   - Voting: list of active votes. Each vote card shows headline, description, options with vote percentages once user has voted. Tap to vote on an option.
   - Notifications: list of personal notifications (settlement updates, vote invitations, system alerts). Mark all read button.
   - "Raise an issue" floating action button in bottom-right (above tab bar) → opens dialog with seriousness (yellow/orange/red), urgency (yellow/orange/red), category (dropdown: Maintenance, Security, Treasury, Property, Other), message. Submits to Admins and Master Admin.

5. **Profile tab** at `app/(resident)/profile/page.tsx`:
   - Profile photo (with upload via Uploadthing), full name, member ID, member since date, role pill
   - Personal introduction text field (Residents only — visible in future Phase 2 community directory)
   - **Member QR card** — large, full-width card with the member ID encoded as a QR code (use `qrcode.react`). Beneath the QR: "Show this code at the gate or to vendors." Tapping the card expands it to fullscreen for easier scanning.
   - KYC section (read-only summary of submitted info, with "Update KYC" link)
   - Settings: Notification preferences, App version, "Sign out"
   - Footer: small "City of Karis" wordmark in Cormorant Garamond, year 2026, version

6. **PWA polish:**
   - Add `app/manifest.ts` (Next.js native manifest) with name, short_name, theme colors, display: standalone, icons sourced from logo
   - Add an iOS-friendly install prompt banner that appears once for iOS Safari users with "Add to Home Screen for the full Karis experience"
   - Touch-target minimum 44px enforced
   - Disable zoom on numeric inputs in iOS via the right viewport meta

7. **Empty states everywhere.** No blank screens. Every list, every section has a styled empty state with a copy line consistent with the brand voice.

8. **Loading states everywhere.** Suspense boundaries with branded skeleton components. The bottom tab bar never shows a skeleton — it stays solid during navigation.

Constraints:
- Bottom tab bar is sticky, blur background, gold underline accent on active tab, height 64px iOS-style
- All currency values use the `formatKCredit()` helper from the ledger module — never `toFixed(2)` directly in UI
- All dates use `formatDistance` from date-fns for relative, `format` for absolute
- All animations subtle: 150–250ms, ease-out, no bouncy transitions
- Test on iPhone SE width (320px) and iPad width (768px) — must work at both
- Visitor accounts see the same Wallet, Community, Profile tabs but no Property tab. The settlement flow is identical.
```

---

## Prompt 5 — Property module

**Goal:** Polish the property experience for residents. This was started in Prompt 4 but deserves dedicated attention because it's emotionally significant for buyers.

**Estimated time:** 30 minutes.

**Run this prompt:**

```
Continue the City of Karis app. Refine and polish the resident-facing property experience.

Read first:
- ./.claude/skills/cok-brand/SKILL.md

The Property tab from Prompt 4 is functional but needs depth. Enhance:

1. **Property hero carousel** — full-width, swipeable on mobile, 16:9 aspect, dot indicators in gold. Tap any photo to enter fullscreen lightbox.

2. **Specifications display** — render `property.specifications` (JSON) as a clean key-value list with a subtle separator between rows. Examples: "Bedrooms: 3", "Bathrooms: 2.5", "Lot size: 0.4 acres", "Solar capacity: 12 kWh".

3. **Installment progress visualization:**
   - Replace the simple progress card with a horizontal milestone strip
   - Each installment is a node on the timeline; paid ones in green with checkmark, current one pulsing gold, future ones stone
   - Tap any node to see installment details and proof of payment if applicable
   - Below the timeline, the % paid number is large and prominent, with a one-line description of what the next milestone unlocks (from `progressNote`)

4. **Contract section:**
   - Card with contract date, contract type, "View document" button
   - Show all related documents: title deed, contract amendments, payment receipts archive

5. **Add a "Property updates" section** as a placeholder card with elegant empty state: "Construction updates from your assigned Admin will appear here, with photos and percentage completion across foundations, structure, and finishing. Coming with Phase 2."

6. **Seed real demo data:**
   - Update `lib/seed/seed.ts` to assign Devon's property (Residence-A12) with: type Ownership, Total K 285,000, 60% paid, 6 installments of K 47,500 with 4 paid and 2 upcoming, type Residential, 3-bedroom villa specifications, 4 stock-style photos (use Unsplash URLs themed for tropical modern architecture)
   - Aaliyah's property (Residence-B07) with: type Rental, monthly cycle, K 1,800 / month, 4 cycles paid, type Residential, 2-bedroom apartment, 3 photos

7. **Receipt PDF generation:**
   - At `lib/pdf/installment-receipt.tsx` create a react-pdf-renderer template for installment receipts
   - Branded header: COK logo, "City of Karis" wordmark in Cormorant Garamond styling
   - Receipt details: installment #, property code, amount, date, member name, member ID, signed by Treasury Admin
   - Watermark: subtle "City of Karis" repeated diagonally at 5% opacity
   - Wire this from the installment detail dialog "Download receipt" button

Constraints:
- Photos are eager-loaded for the first one (LCP), lazy-loaded after
- The progress timeline is built with CSS Grid + named lines, no third-party timeline library
- All copy uses the brand voice — grounded, specific, calm
```

---

## Prompt 6 — Community layer

**Goal:** Make the community feel real — published updates, an active vote, sample issues, working notifications.

**Estimated time:** 45 minutes.

**Run this prompt:**

```
Continue the City of Karis app. Build out the community layer end-to-end.

Read first:
- ./.claude/skills/cok-brand/SKILL.md

Build:

1. **Notifications service** at `lib/notifications/service.ts`:
   - `notify({ userId, type, title, body, link, priority })` — creates a Notification row
   - `notifyMany(userIds, payload)` — bulk
   - `notifyAllOfRole(role, payload)` — for community-wide updates
   - Server action `markRead(notificationIds)` and `markAllRead()`
   - Wire the existing flows to call `notify()`:
     - Settlement approved → notify the requesting user
     - Settlement settled → notify the requesting user with proof link
     - New community update → notifyAllOfRole(['RESIDENT', 'VISITOR'])
     - New vote → notifyAllOfRole(['RESIDENT'])
     - Issue raised → notify all MASTER_ADMIN and ADMIN

2. **Community updates publishing:**
   - Master Admin can already create updates (Prompt 3). Wire the publish action to call `notifyAllOfRole`.
   - Each update card on resident side shows: category badge, date, headline, optional photo, message, "Acknowledge" button (records UpdateAcknowledgement row, shows count to admin).

3. **Voting flow end-to-end:**
   - Master Admin creates a vote with options (already built)
   - Residents see the vote in their Community tab
   - Voting is one option per resident, recorded as VoteSubmission
   - After voting, the resident sees results: each option with a horizontal bar showing percentage, total participants count
   - Master Admin can see all votes including raw participant list (with privacy note)
   - Closing a vote freezes results and moves it to "past votes"

4. **Issues / complaints:**
   - Any user can raise an issue from the FAB or Profile menu
   - Issue model already in schema: seriousness, urgency, category, message, status (Open/InProgress/Resolved), reporter, assignedTo
   - Master Admin and Admin see issues in their dashboard with filters
   - Admin or Master Admin can: assign to themselves, change status, post replies (IssueReply model)
   - User sees the issue thread on their side with replies — tap from a notification or from a "My issues" link in profile
   - Issues from Admins are routed to Master Admin only (route based on reporter role)

5. **Demo content seeding:**
   Append to `lib/seed/seed.ts`:
   - 4 community updates ranging from 12 days ago to today, with categories like "Infrastructure", "Welcome", "Wellness", "Events":
     1. "Solar phase 2 commissioning complete" (12 days ago, Infrastructure, with construction photo URL placeholder)
     2. "Welcome to our newest founding members" (8 days ago, Welcome, with names of Devon and Aaliyah)
     3. "New telemedicine schedule starting Monday" (3 days ago, Wellness)
     4. "Karis Annual Festival — call for artist nominations" (today, Events)
   - 1 active vote: "How should we direct the next K 25,000 from the Community Investment Fund?" with three options:
     - "Expand the wellness center with a hydrotherapy room"
     - "Build a covered amphitheater for the outdoor stage"
     - "Fund a community library with curated Guyanese literature"
     Each with a 60-word description
   - Have Devon vote for the amphitheater so the demo shows a 'voted' state for one user
   - 2 sample issues:
     1. From Devon (Resident): seriousness yellow, urgency yellow, category Maintenance: "The path light at the corner of Block A flickers at night." Status: InProgress. One reply from Admin.
     2. From Marcus (Visitor): seriousness yellow, urgency orange, category Treasury: "I deposited fiat at Treasury but my K Credits haven't appeared yet." Status: Resolved. Reply: "Resolved — deposit was processed within 2 hours. Apologies for the delay."
   - 6–8 notifications for Devon spread across the past week so his notifications tab feels alive

6. **Notification badges:**
   - Bottom tab bar Community tab shows a small gold dot when there are unread notifications
   - Reset on view

Constraints:
- All update/vote/issue content must use the brand voice — read it back to yourself before submitting
- Photos referenced must work — use Unsplash placeholders with fixed seeds for reproducibility
- Vote percentages calculated server-side, never trusted from client
```

---

## Prompt 7 — Polish, brand pass, demo data

**Goal:** The difference between a credible demo and a forgettable one. This prompt is mostly about taste.

**Estimated time:** 45 minutes.

**Run this prompt:**

```
Continue the City of Karis app. Final polish pass before deployment.

Read first:
- ./.claude/skills/cok-brand/SKILL.md
- /mnt/skills/public/frontend-design/SKILL.md

Tasks (do all of them, then report what you changed):

1. **Brand audit:**
   - Walk every page and verify it uses brand color tokens (no hardcoded hex codes anywhere outside `globals.css`)
   - Verify the wordmark "City of Karis" only appears in Cormorant Garamond
   - Verify K Credits are always formatted with the K in gold
   - Verify there are no emoji in the UI (only allowed: 🇬🇾 in country contexts)
   - Verify there are no gradients except the gold accent line under wallet hero balance
   - Run `pnpm lint` and `pnpm typecheck`, fix any errors

2. **Copy pass:**
   - Read every visible string. Rewrite anything that sounds corporate, generic, or AI-generated. Apply the brand voice (elegant, calm, confident, welcoming).
   - Empty states should sound human, not robotic. Examples:
     - Bad: "No data found"
     - Good: "Your activity will appear here once you make your first transaction."
   - Error messages should be helpful and warm, never blame the user.

3. **Mobile QA:**
   - Test the resident experience at 320px, 375px, 414px, and 768px widths in your dev tools
   - Verify the bottom tab bar is comfortable, the wallet hero card breathes, and tap targets are >= 44px
   - Test the modals and sheets — they should slide up smoothly on mobile

4. **Performance pass:**
   - Add `loading.tsx` for each route segment with branded skeletons
   - Verify next/image is used everywhere (no raw <img>)
   - Verify each font is loaded with `display: swap` and only the weights actually used
   - Verify no client components when a server component would suffice

5. **Accessibility:**
   - Tab through the entire resident flow with keyboard only — verify focus rings are visible (use a gold focus ring)
   - All images have alt text
   - All form fields have associated labels
   - Color contrast on all text passes WCAG AA (especially gold-on-stone combinations)

6. **Beef up demo data:**
   - Run `pnpm seed` then `pnpm seed:demo` (the demo-transactions script)
   - Then add 30 additional transactions across Devon and Aaliyah's wallets over the past 60 days, with realistic descriptions:
     - "Pereira Wellness — 90-min massage" (vendor purchase, K 85)
     - "Karis Atelier — perfume oils set" (vendor purchase, K 220)
     - "Supermarket — weekly groceries" (admin-run service, K 145)
     - "Telemedicine consult — Dr. Patel" (vendor purchase, K 60)
     - "Babysitting — 4 hours" (barter, K 0 fee)
     - "Solar credit — surplus generation" (system credit, +K 35)
     - And similar — feel free to invent appropriate ones
   - These give the wallet history depth so it feels like a lived-in app, not an empty shell

7. **A landing page hero:**
   - The signed-out landing page (`app/page.tsx`) should now be properly designed — full-bleed hero with a tasteful background (a stone/green gradient, no photo), the logo centered, the wordmark large in Cormorant Garamond, the tagline below in Fraunces, and two CTAs. Beneath the hero, three small sections:
     - "Beautiful, empowered living" — short paragraph
     - "Off-grid by design" — short paragraph
     - "A community app, not just an app" — short paragraph
   - Footer with social handles (@cityofkaris, @karisguyana) and "Guyana 🇬🇾" mark

8. **Sign-in pages:**
   - Match the brand aesthetic. Stone-50 background, logo top-center, sign-in form centered, the wordmark below the form. No corporate Clerk default styling visible.

9. **Add a `/about/founders` page** (publicly accessible) that shows:
   - The "Founders' Monument" concept
   - List of founding members (real or seed) with photo, name, location returning from, brief intro
   - This is a Phase 2 feature shown as a teaser — display "Joining the founders cohort? Visit cityofkaris.com to apply."

10. **Final demo check:**
    - Sign in as Master Admin → verify dashboard loads with real numbers, approve Anjali's pending settlement, record a deposit
    - Sign out, sign in as Devon (Resident) → verify wallet, property, community, vote on the active vote
    - Sign out, sign in as Marcus (Visitor) → verify the property tab is hidden, wallet works, can raise an issue
    - Take three screenshots showing the wallet, the property page, and the dashboard

11. **Write a `DEMO.md` script** at the root of the repo with the recommended walkthrough order for a 5-minute live demo. See section "Demo script" in the playbook for the structure.
```

---

## Prompt 8 — Deploy

**Goal:** A live URL the founder can share with prospective members.

**Estimated time:** 30 minutes.

**Run this prompt:**

```
Continue the City of Karis app. Final session — deploy to Vercel and verify.

Tasks:

1. **Pre-flight:**
   - Run `pnpm build` locally and fix any errors
   - Verify `lib/env.ts` validates all required env vars
   - Confirm `.env.example` exists with every variable documented but no real secrets

2. **GitHub setup:**
   - Initialize git, .gitignore correctly configured for Next.js + Prisma
   - Push to a new private GitHub repo `cok-app` under the user's account
   - Confirm with the user before pushing if there's any sensitive data

3. **Vercel setup:**
   - Import the repo into Vercel (CLI or instruct the user)
   - Configure env vars in Vercel: all from `lib/env.ts`
   - Build command: `pnpm build`
   - Install command: `pnpm install`
   - Add `prisma migrate deploy` as a build step before `next build`

4. **Database setup:**
   - Confirm the Supabase project is on the correct region (closest to Guyana — likely us-east-1)
   - Run `pnpm prisma migrate deploy` against production DB
   - Run a production seed: `pnpm seed:production` (we'll create this — same as demo seed but tagged so it can be wiped once real data starts flowing)

5. **Custom domain:**
   - If the user has registered `app.cityofkaris.com`, add it as a Vercel custom domain
   - Verify SSL provisioned

6. **Clerk webhook:**
   - Go to Clerk dashboard, set the webhook endpoint to `https://app.cityofkaris.com/api/webhooks/clerk`
   - Subscribe to: user.created, user.updated, session.created
   - Save the signing secret as `CLERK_WEBHOOK_SECRET` in Vercel

7. **Smoke test the production deployment:**
   - Sign in as Master Admin → dashboard loads
   - Create a test deposit → succeeds
   - Sign in as Resident → wallet loads
   - Submit a settlement request → appears in admin queue
   - Approve it → resident sees the status change

8. **Generate share-ready collateral:**
   - Two short Loom-friendly walkthroughs scripts (one for residents, one for admins)
   - A one-page PDF "What's in the Phase 1 demo" that the founder can send to prospective residents along with the app URL

9. **Documentation:**
   - `README.md` with setup, architecture decisions, the ledger principles, and a "what's NOT in this MVP" section that lists everything deferred to Phase 2
   - `OPERATIONS.md` with the daily/weekly checklist for running the app (reconciliation check, backup verification, Clerk member sync)

10. **Report back:**
    - Production URL
    - GitHub repo URL
    - Test credentials for each role
    - List of any issues found during smoke test
    - Recommended Phase 1.5 next steps prioritized
```

---

## Demo script

A recommended walkthrough for a 5-minute live demo. Follow this order — it tells the strongest story.

1. **(30s) Open the public landing page** at the production URL. "This is what a prospective resident sees first. Notice the brand — elegant, grounded, specific, not glitzy. The pitch is in three lines."

2. **(60s) Sign in as Devon (Resident).** Land on the wallet. "This is Devon, a returning Guyanese architect. K 1,500 on hand, transactions over the last 60 days — every cup of coffee, every wellness session, all settled in K Credits. Notice the recent barter line — no fee, because the community encourages those exchanges."

3. **(60s) Tap on the Property tab.** "Devon owns Residence A-12. He sees his ownership progress — 60% paid, four installments in, two to go. He can download every receipt as a branded PDF. The construction updates section is the Phase 2 hook — once we wire the Admin construction reports, he sees photos every week."

4. **(45s) Tap Community → vote on the active vote.** "The Community Investment Fund — funded automatically by 1.5% of every transaction — has K 25,000 to allocate. Residents like Devon vote. The Master Admin uses the result as a strong signal."

5. **(30s) Tap Profile → show the member QR.** "This is Devon's gate pass, vendor identifier, and ID — all in one. Phase 1.5 wires the gate scanner."

6. **(60s) Sign out, sign in as Master Admin.** Land on dashboard. "Karis sees everything from here. Treasury reserve, total credits in circulation by role, pending approvals." Click Approvals → demonstrate approving Anjali's settlement. "One tap. Treasury Admin sees it next, executes the fiat payout, and the system auto-debits Anjali's wallet. Every step audited, every entry double-signed."

7. **(45s) Show the Treasury Settings page.** "Here's the fee schedule. 2.5% on every purchase, split three ways: 1.5% to the Community Investment Fund, 0.5% to keep the app running, 0.5% as developer revenue share, capped and time-limited. This is the financial flywheel of the community."

8. **(30s) Close.** "Phase 1 is what you just saw. Phase 2 adds the marketplace, vendor payroll, the barter exchange, the Calendly-integrated services, the gate scanner, and the construction update pipeline. Phase 3 polishes everything for scale and adds native iOS and Android apps."

---

## Path to production

What separates this Tier 1 demo from a Tier 2 production system that actually onboards founding members with real K Credits:

| Requirement | Demo (Tier 1) | Production (Tier 2) |
|---|---|---|
| Authentication | Clerk default | Clerk with MFA enforced for Master Admin and Admin roles |
| KYC | Manual fields | Persona or Sumsub integration with document verification and PEP screening |
| Fiat deposit rail | Manual recording by Treasury Admin | Stripe + a Guyana-local rail (MMG, GTT Mobile Money, or partner bank) |
| Settlement payout | Manual fiat transfer outside the app | Bank transfer integration with reconciliation |
| Database | Supabase free tier | Supabase Pro with daily backups, point-in-time recovery |
| Monitoring | None | Sentry + BetterStack uptime + custom reconciliation alerts |
| Backups | None | Daily automated, 30-day retention, quarterly restore drills |
| Audit | App-level audit log | App-level audit log + immutable WORM storage of monthly statements |
| Security review | None | External code audit of `lib/ledger/` ($15–25K third party) |
| Legal | Demo disclaimer | Terms of Service, Privacy Policy, K Credit terms drafted by Guyanese counsel |
| SLA | None | 99.5% uptime, 4-hour critical bug response |

Estimated additional time and cost to go from Tier 1 to Tier 2: **6–10 weeks, $40K–$60K** on top of the Tier 1 build.

---

## Revenue-share contract clause

A starting-point clause for the developer agreement. Have a lawyer review.

> **Schedule B — Transaction Fee Revenue Share**
>
> 1. **Fee Structure.** The COK Community App shall apply a transaction fee of two and one-half percent (2.5%) to each Qualifying Transaction, defined as any K Credit transfer originating from a Resident, Vendor, or Visitor wallet for the purpose of purchasing goods or services within the App.
>
> 2. **Fee Allocation.** Each Qualifying Transaction fee shall be allocated as follows:
>    - One and one-half percent (1.5%) to the Community Investment Fund;
>    - One-half percent (0.5%) to the Operations Fund (covering hosting, maintenance, security, and ongoing development);
>    - One-half percent (0.5%) to the Developer Revenue Share, payable to the Developer.
>
> 3. **Settlement Fee.** A separate fee of one percent (1.0%) shall apply to all K Credit-to-fiat settlements, allocated equally between the Community Investment Fund and the Operations Fund. The Developer Revenue Share does not apply to settlement fees.
>
> 4. **Excluded Transactions.** No fee shall be applied to Deposits, Payroll Payments, Pure Barter Exchanges, or Internal Treasury Operations.
>
> 5. **Cap and Sunset.** The Developer Revenue Share is subject to:
>    - A monthly cap of eight thousand United States Dollars (USD $8,000); any amount exceeding the cap in any calendar month shall roll into the Operations Fund;
>    - A cumulative cap of two hundred thousand United States Dollars (USD $200,000); upon reaching this amount, the Developer Revenue Share shall sunset and the 0.5% allocation shall thereafter flow to the Operations Fund;
>    - A maximum term of thirty-six (36) calendar months from the App's production launch date, after which the Developer Revenue Share shall automatically sunset regardless of cumulative amount.
>
> 6. **Payment Terms.** The Developer Revenue Share shall accrue continuously and be paid out monthly within ten (10) business days of month-end, by wire transfer to the Developer's designated account, with a statement of accrual.
>
> 7. **Audit Rights.** The Developer shall have the right to audit the Operations Fund and Developer Revenue Share ledger entries no more than once per calendar quarter, on five (5) business days' notice, at the Developer's expense unless a discrepancy of greater than 1% is found, in which case the Treasury bears reasonable audit costs.
>
> 8. **Configuration Changes.** Any change to the fee structure during the term shall require written agreement of both parties; emergency reductions of the Developer Revenue Share for community welfare may be made unilaterally by the Master Admin but only by an amount not exceeding 50% of the current rate and for no longer than 90 days, after which the rate restores automatically.

---

## Schema appendix

Reference Prisma schema. Keep this aligned with `prisma/schema.prisma`.

```prisma
// Roles and account state
enum Role {
  MASTER_ADMIN
  ADMIN
  VENDOR
  RESIDENT
  VISITOR
}

enum AccountStatus {
  ACTIVE
  SUSPENDED
  PENDING_KYC
}

enum TransactionType {
  DEPOSIT
  PURCHASE
  TRANSFER
  BARTER
  PAYROLL
  RESIDENT_SETTLEMENT
  VENDOR_SETTLEMENT
  VISITOR_SETTLEMENT
  TREASURY_ADJUSTMENT
  FEE_SPLIT
  REVERSAL
}

enum SettlementStatus {
  PENDING_APPROVAL
  APPROVED
  DECLINED
  SETTLED
  CANCELLED
}

enum PropertyType {
  OWNERSHIP
  RENTAL
  ADMIN
}

enum PropertyCategory {
  COMMERCIAL
  RESIDENTIAL
  MIXED
}

enum IssueLevel {
  YELLOW
  ORANGE
  RED
}

enum IssueStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

model User {
  id              String        @id @default(cuid())
  clerkId         String?       @unique
  memberId        String        @unique // K-XXXXXX
  email           String        @unique
  fullName        String
  role            Role
  status          AccountStatus @default(PENDING_KYC)
  profilePhotoUrl String?
  introduction    String?       @db.Text
  kyc             Json?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  wallet          Wallet?
  ownedProperties PropertyOwnership[]
  rentedProperties PropertyTenancy[]
  notifications   Notification[]
  issuesReported  Issue[]       @relation("IssueReporter")
  issuesAssigned  Issue[]       @relation("IssueAssignee")
  votes           VoteSubmission[]
  // ...
}

model Wallet {
  id        String         @id @default(cuid())
  userId    String?        @unique
  user      User?          @relation(fields: [userId], references: [id])
  isSystem  Boolean        @default(false)
  systemKey String?        @unique // 'community_fund' | 'operations_fund' | 'developer_share' | 'treasury_reserve' | 'settlement_burn'
  entries   LedgerEntry[]
  createdAt DateTime       @default(now())
  @@index([systemKey])
}

model FeeSchedule {
  id          String        @id @default(cuid())
  effectiveAt DateTime
  rules       Json          // { PURCHASE: { total: 0.025, communityFund: 0.015, operationsFund: 0.005, developerShare: 0.005 }, ... }
  createdBy   String
  createdAt   DateTime      @default(now())
  transactions Transaction[]
  @@index([effectiveAt])
}

model Transaction {
  id              String          @id @default(cuid())
  type            TransactionType
  description     String
  reference       String?         // external reference, e.g. settlement ID
  feeScheduleId   String?
  feeSchedule     FeeSchedule?    @relation(fields: [feeScheduleId], references: [id])
  initiatedBy     String?
  metadata        Json?
  createdAt       DateTime        @default(now())
  entries         LedgerEntry[]
  @@index([createdAt])
  @@index([type])
}

model LedgerEntry {
  id            String      @id @default(cuid())
  transactionId String
  transaction   Transaction @relation(fields: [transactionId], references: [id])
  walletId      String
  wallet        Wallet      @relation(fields: [walletId], references: [id])
  amount        Decimal     @db.Decimal(20, 8) // signed; debits negative, credits positive
  description   String?
  createdAt     DateTime    @default(now())
  @@index([walletId])
  @@index([transactionId])
}

model Deposit {
  id              String   @id @default(cuid())
  userId          String
  fiatAmount      Decimal  @db.Decimal(20, 2)
  currency        String   @default("USD")
  paymentMethod   String
  proofUrl        String?
  recordedBy      String   // Treasury Admin user id
  transactionId   String   @unique
  createdAt       DateTime @default(now())
  @@index([userId])
}

model SettlementRequest {
  id              String           @id @default(cuid())
  userId          String
  amount          Decimal          @db.Decimal(20, 8)
  status          SettlementStatus @default(PENDING_APPROVAL)
  purpose         String?
  approvedBy      String?
  approvedAt      DateTime?
  declinedReason  String?
  settledBy       String?
  settledAt       DateTime?
  proofUrl        String?
  transactionId   String?
  createdAt       DateTime         @default(now())
  @@index([userId])
  @@index([status])
}

model Property {
  id              String              @id @default(cuid())
  code            String              @unique // e.g. Residence-A12
  type            PropertyType
  category        PropertyCategory
  address         String?
  totalPrice      Decimal?            @db.Decimal(20, 2)
  specifications  Json?
  photos          String[]
  documents       Json?               // [{ type, url, name, uploadedAt }]
  ownerships      PropertyOwnership[]
  tenancies       PropertyTenancy[]
  installments    PropertyInstallment[]
  createdAt       DateTime            @default(now())
}

model PropertyOwnership {
  id            String                  @id @default(cuid())
  propertyId    String
  userId        String
  ownershipPct  Decimal                 @default(100)
  contractDate  DateTime
  contractUrl   String?
  payments      PropertyPayment[]
  property      Property                @relation(fields: [propertyId], references: [id])
  user          User                    @relation(fields: [userId], references: [id])
}

model PropertyInstallment {
  id            String          @id @default(cuid())
  propertyId    String
  number        Int
  dueDate       DateTime
  amount        Decimal         @db.Decimal(20, 2)
  progressNote  String?
  property      Property        @relation(fields: [propertyId], references: [id])
  payments      PropertyPayment[]
}

model PropertyPayment {
  id              String              @id @default(cuid())
  installmentId   String
  ownershipId     String
  amount          Decimal             @db.Decimal(20, 2)
  paidAt          DateTime
  proofUrl        String?
  installment     PropertyInstallment @relation(fields: [installmentId], references: [id])
  ownership       PropertyOwnership   @relation(fields: [ownershipId], references: [id])
}

model PropertyTenancy {
  id              String      @id @default(cuid())
  propertyId      String
  userId          String
  cycle           String      // 'daily' | 'weekly' | 'monthly' | 'annual'
  cyclePayment    Decimal     @db.Decimal(20, 2)
  contractDate    DateTime
  contractUrl     String?
  property        Property    @relation(fields: [propertyId], references: [id])
  user            User        @relation(fields: [userId], references: [id])
  cyclePayments   TenancyCyclePayment[]
}

model TenancyCyclePayment {
  id          String          @id @default(cuid())
  tenancyId   String
  cycleNumber Int
  amount      Decimal         @db.Decimal(20, 2)
  paidAt      DateTime
  proofUrl    String?
  tenancy     PropertyTenancy @relation(fields: [tenancyId], references: [id])
}

model CommunityUpdate {
  id              String      @id @default(cuid())
  category        String
  headline        String
  message         String      @db.Text
  photoUrl        String?
  publishedBy     String
  publishedAt     DateTime    @default(now())
  acknowledgements UpdateAcknowledgement[]
}

model UpdateAcknowledgement {
  id              String          @id @default(cuid())
  updateId        String
  userId          String
  acknowledgedAt  DateTime        @default(now())
  update          CommunityUpdate @relation(fields: [updateId], references: [id])
  @@unique([updateId, userId])
}

model Vote {
  id              String           @id @default(cuid())
  headline        String
  description     String           @db.Text
  isOpen          Boolean          @default(true)
  createdBy       String
  createdAt       DateTime         @default(now())
  closedAt        DateTime?
  options         VoteOption[]
  submissions     VoteSubmission[]
}

model VoteOption {
  id          String           @id @default(cuid())
  voteId      String
  label       String
  description String           @db.Text
  vote        Vote             @relation(fields: [voteId], references: [id])
  submissions VoteSubmission[]
}

model VoteSubmission {
  id          String      @id @default(cuid())
  voteId      String
  optionId    String
  userId      String
  submittedAt DateTime    @default(now())
  vote        Vote        @relation(fields: [voteId], references: [id])
  option      VoteOption  @relation(fields: [optionId], references: [id])
  user        User        @relation(fields: [userId], references: [id])
  @@unique([voteId, userId])
}

model Issue {
  id            String      @id @default(cuid())
  reporterId    String
  assigneeId    String?
  seriousness   IssueLevel
  urgency       IssueLevel
  category      String
  message       String      @db.Text
  status        IssueStatus @default(OPEN)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  reporter      User        @relation("IssueReporter", fields: [reporterId], references: [id])
  assignee      User?       @relation("IssueAssignee", fields: [assigneeId], references: [id])
  replies       IssueReply[]
}

model IssueReply {
  id        String   @id @default(cuid())
  issueId   String
  authorId  String
  message   String   @db.Text
  createdAt DateTime @default(now())
  issue     Issue    @relation(fields: [issueId], references: [id])
}

model Notification {
  id        String    @id @default(cuid())
  userId    String
  type      String
  title     String
  body      String?
  link      String?
  priority  String    @default("yellow") // yellow | orange | red
  readAt    DateTime?
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id])
  @@index([userId, readAt])
}

model TreasuryAdjustment {
  id          String   @id @default(cuid())
  amount      Decimal  @db.Decimal(20, 2)
  currency    String   @default("USD")
  reason      String
  recordedBy  String
  createdAt   DateTime @default(now())
}
```

---

## Closing notes

Run the prompts in order. After each one, verify it works before continuing — Claude Code is far more productive when each session has a clean foundation than when it has to fix the last session's loose ends mid-stream.

The two prompts that most justify slowing down are **Prompt 2 (Ledger)** and **Prompt 7 (Polish)**. The first is correctness; the second is taste. Everything else is mostly mechanical execution that Claude Code handles well.

When you're ready to move toward Tier 2 production, we'll add: KYC integration, real fiat rails, MFA enforcement, the security audit, monitoring, backups, the construction-updates pipeline, native mobile apps, and the broader Phase 2 feature set.

— *End of playbook —*
