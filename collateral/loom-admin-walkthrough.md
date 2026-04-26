# Loom Script — Admin Walkthrough (~5 minutes)

**Goal:** Show the leadership team (and potential investors) what the admin side of the platform looks like — treasury control, account management, and community governance tools.

**Recording setup:** Full-screen browser, 1920×1080, zoom browser to 110%. Use a Master Admin account. Have at least 2–3 pending settlement requests and a few accounts pre-created so the screens aren't empty.

---

## [0:00 – 0:30] Intro

> "This is the admin side of the City of Karis platform. I'll walk through the six key areas: the treasury dashboard, account management, approvals, community tools, and settings. Let's start with the dashboard."

Sign in as Master Admin. The app redirects to `/admin/dashboard`.

---

## [0:30 – 1:15] Dashboard

> "The dashboard gives you the treasury at a glance."

Point out:
- **Treasury hero card** — total K Credits in circulation, treasury reserve balance
- **Stat cards** — total members, pending approvals, community fund balance
- **Treasury flow table** — recent deposits and fee accumulations

> "Everything flows through the ledger in real time. There's no reconciliation lag — the moment a transaction is approved, the balances update."

Scroll down to show the flow table. Point out the system wallet rows (Community Fund, Operations Fund, etc.).

---

## [1:15 – 2:00] Accounts — Create a New Account

Navigate to Admin → Accounts.

> "This is where you manage every member of the city. Let me show you how to onboard a new resident."

Click **Create account**. Fill in:
- Full name: "Demo Resident"
- Email: a test email
- Role: Resident
- KYC status: Active

> "The moment we save this, a Clerk invitation goes to their email. When they sign in for the first time, the webhook creates their wallet automatically. Their Member ID — COK-XXXX — is generated on creation."

Submit the form. Show the new account appearing in the table with the Member ID.

---

## [2:00 – 2:45] Treasury — Record a Deposit

Navigate to Admin → Treasury.

> "When a resident deposits fiat, we record it here. This is the only one-sided entry in the ledger — it creates K Credits from nothing, representing the fiat held in the treasury."

Click **Record deposit**. Select the newly created demo account. Enter an amount (e.g., 1000).

> "Notice the description field — we always note the payment reference so the ledger is auditable. When we save this, K Credits are minted directly to the resident's wallet."

Submit the deposit. Navigate to the resident's account to show the updated balance.

---

## [2:45 – 3:30] Approvals — Process a Settlement Request

Navigate to Admin → Approvals.

> "Settlement requests are where residents ask to convert K Credits back to fiat. Each one shows the gross amount, the fee breakdown, and the net payout."

Click on a pending request. Show the detail:
- Resident name and Member ID
- Amount, fee, net payout
- Request timestamp

> "We can approve or reject. On approval, the ledger automatically debits the resident's wallet, distributes the fees to the system wallets, and marks the request as settled."

Click **Approve** (or show the button without clicking if using a live DB with real amounts).

---

## [3:30 – 4:15] Community — Publish an Update + Manage a Vote

Navigate to Admin → Community.

**Updates tab:**
> "We publish announcements from the Updates tab. These appear on every resident's Community tab instantly."

Click **New update**. Type a short title and body. Publish it.

**Votes tab:**
> "Votes give the community a voice on city decisions. Let me show a live vote."

Navigate to an active vote. Show the current tally. Click **Close vote**.

> "Once closed, the result is locked in and residents can see the final outcome."

**Issues tab:**
> "Residents raise issues here — maintenance, requests, feedback. We can reply directly in the thread and mark it resolved."

Open an issue. Show the reply field. Type a brief response and click Reply.

---

## [4:15 – 5:00] Settings — Fee Schedule

Navigate to Admin → Settings.

> "The fee schedule controls what percentage of each transaction type goes where. This is the Genesis schedule — the one we seeded at launch."

Show the fee table:
- PURCHASE: 2.5% (Community 1.5%, Operations 0.5%, Developer 0.5%)
- VENDOR_SETTLEMENT: 1.0%
- BARTER, PAYROLL, DEPOSIT, TRANSFER: 0%

> "If the leadership decides to adjust rates, we create a new schedule with a future effective date. The old schedule stays active until that date — no retroactive changes, full audit trail."

Scroll to show any historical schedules if present.

> "That's the full admin picture. Treasury control, account management, approvals, community governance, and fee configuration — all in one place."

---

## Recording Notes

- Do not approve real settlement requests on camera — use a demo request with a small amount, or pause before clicking Approve and cut the recording there
- The fee schedule page is read-only for demonstration — no risk of accidental changes
- Keep the demo DB clean: delete any test accounts created during recording afterward
