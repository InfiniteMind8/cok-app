# City of Karis — 5-Minute Demo Script

A live walkthrough of the Phase 1 community app. Eight steps, five minutes. Designed for a single presenter with a laptop.

---

## Before You Start

1. Run `pnpm seed` → `pnpm seed:demo` → `pnpm seed:history` (one-time, idempotent)
2. Open `localhost:3000` in a browser (Chrome or Safari, full screen)
3. Sign in as **Devon McKenzie** (`devon@example.com`)
4. Open a second incognito window signed in as **Karis Munroe** (`karis@cityofkaris.com`) — Master Admin

---

## Step 1 — Landing Page (30 sec)

**What to say:** "City of Karis is a real estate community in Guyana. This is what a prospective member sees when they land on the site."

**What to click:** Navigate to `localhost:3000` signed out.

**Visual moment:** Full-bleed hero with radial green gradient, 96px brand logo, "Beautiful, Empowered Living in Guyana" in Fraunces serif, two CTAs (Sign in / Join the founding cohort).

**Key point:** Click "Meet the founders" → show the `/about/founders` page. "Every founding member's name will be engraved in the Founders' Monument at the centre of Phase 1."

---

## Step 2 — Sign In & Resident Wallet (45 sec)

**What to say:** "Let's step inside as Devon McKenzie — a founding resident and architect."

**What to click:** Sign in as Devon → lands on `/wallet`.

**Visual moment:** K Credit balance card in dark green with gold accent. Stat cards below showing total deposited, earned, and eligible for conversion.

**Key point:** Scroll down to the transaction list. "Every K Credit Devon has spent or earned in the community is here — going back two months. The wallet is a living ledger."

---

## Step 3 — Transaction History (30 sec)

**What to say:** "Devon's been active — groceries at the Karis Supermarket, wellness sessions at Pereira, a jewellery purchase at Karis Atelier, bartering with Aaliyah."

**What to click:** Tap "View all" on the transaction list → `/wallet/transactions`.

**Visual moment:** Full transaction history sorted newest first. Mix of PURCHASE, BARTER, and DEPOSIT entries with dates spanning 60 days.

**Key point:** "These are real ledger entries — double-entry accounting, zero-sum at every step. The community fund grows automatically with every purchase."

---

## Step 4 — Property (45 sec)

**What to say:** "Devon is purchasing Residence A-12. Let's see where that stands."

**What to click:** Navigate to `/property`.

**Visual moment:** Photo carousel of the residence. Ownership progress bar showing 4 of 6 installments paid (66%). Specifications: 3 bed, 2.5 bath, 0.4 acres, private pool, solar.

**Key point:** "Each installment is tied to a construction milestone. Devon can see exactly what's been built and what's coming next."

---

## Step 5 — Community (45 sec)

**What to say:** "The community tab is the heartbeat of Karis — updates, issues, and governance."

**What to click:** Navigate to `/community`. Show the Updates tab — four posts including the solar commissioning and the festival callout.

**What to click:** Switch to the Voting tab. Show the K 25,000 Community Investment Fund vote. "Devon has already voted for the amphitheater."

**Visual moment:** Vote options with descriptions. Bar showing vote distribution.

**Key point:** "Every resident gets a say in how community funds are spent. Governance is built in, not bolted on."

---

## Step 6 — Issues (30 sec)

**What to say:** "Devon filed a maintenance issue six days ago — the garden crew missed the A-block. Naomi has already replied."

**What to click:** Switch to the Issues tab → open Devon's maintenance issue.

**Visual moment:** Issue thread with Devon's detailed report and Naomi's response confirming Thursday visit.

**Key point:** "Issues go directly to the admin team and are tracked to resolution. No WhatsApp groups, no lost messages."

---

## Step 7 — Admin Dashboard (45 sec)

**What to say:** "Now let's step into the Admin view — this is what Karis Munroe sees."

**What to click:** Switch to the Karis incognito window → `/dashboard`.

**Visual moment:** Four stat cards: Total K Credits issued, treasury reserve, active wallets, pending approvals. Below: recent transaction activity table and pending approvals queue.

**What to click:** Navigate to `/treasury` → show the full ledger reconciliation. "The treasury is always in balance. Every K Credit issued is backed 1:1 by reserve."

**Key point:** Navigate to `/accounts` → find Devon's account → click through to see wallet summary and transaction history from the admin side. "Full visibility, always."

---

## Step 8 — Profile & QR (30 sec)

**What to say:** "Back to Devon — every resident carries a digital membership card."

**What to click:** Switch back to Devon's window → `/profile`.

**Visual moment:** Profile photo, member ID, role badge, member-since date. Below: the QR membership card — scannable for identity verification at any Karis venue or service.

**Key point:** "The QR card is the resident's key. At the gate, at the wellness centre, at the market — one scan confirms membership and unlocks access."

---

## Closing (15 sec)

**What to say:** "That's the Phase 1 resident experience — wallet, property, community, governance, and identity — in a single app. Built for launch. Ready for the first residents."

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Master Admin | `karis@cityofkaris.com` | *(Clerk dev account)* |
| Resident | `devon@example.com` | *(Clerk dev account)* |
| Resident | `aaliyah@example.com` | *(Clerk dev account)* |
| Vendor | `anjali@pereirawellness.com` | *(Clerk dev account)* |
| Visitor | `marcus@example.com` | *(Clerk dev account)* |

> Passwords are set in the Clerk dashboard under the development instance.
