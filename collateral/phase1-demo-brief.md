# City of Karis — Phase 1 Platform Brief

**A sovereign digital economy for an intentional residential community.**

---

## What Is the City of Karis Platform?

The City of Karis platform is the financial and governance backbone of the Karis settlement. Every resident has a K Credit wallet — the internal store of value for the community. K Credits flow transparently through a double-entry ledger: purchases, vendor payments, property installments, and settlement requests all leave a permanent, auditable record.

Phase 1 delivers a complete, production-ready web application for the founding cohort of residents.

---

## What Residents Can Do

- **Hold and transact K Credits** — check your balance, review transaction history, and send payments to vendors within the city
- **Track your property** — view your ownership or tenancy record, photo gallery, and installment payment progress in real time
- **Participate in community governance** — read updates from the city leadership, cast votes on community decisions, and raise issues for admin response

---

## What's Under the Hood

**K Credits** are minted by the admin treasury when a resident makes a fiat deposit. Every mint creates an equal and opposite entry — K Credits are always 100% backed by fiat held in the treasury reserve.

**The fee engine** processes every transaction type according to a transparent fee schedule. For purchases, 2.5% is distributed across the Community Fund (1.5%), Operations Fund (0.5%), and Developer Share (0.5%). Settlement requests carry a 1% fee. Barter, payroll, and direct transfers are fee-free. Fee calculations use banker's rounding — the same standard as institutional financial systems.

**The ledger** is append-only. No transaction is ever modified or deleted. Every fiat deposit, K Credit transfer, fee distribution, and settlement is permanently recorded and reconcilable.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 · React 19 · TypeScript · Tailwind CSS |
| Backend | Next.js Server Actions · Prisma ORM · PostgreSQL (Supabase) |
| Auth | Clerk — SSO, invitation-only onboarding, role-based access |
| Storage | UploadThing — property photos, contract documents |
| Email | Resend — invitation and notification delivery |
| Hosting | Vercel (US East / Washington DC region) |

---

## Access

The platform is invitation-only. Residents are onboarded by the City of Karis admin team.

**To request access:** Contact the City of Karis team directly.

**Demo URL:** `https://app.cityofkaris.com`

**Test credentials:** Available on request for qualified prospective residents.

---

## Phase 1 Scope

Phase 1 covers:
- Resident wallet, transaction history, settlement requests
- Property registry with installment tracking, photo gallery, ownership/tenancy records
- Community updates, voting, and issues
- Full admin back-office: treasury, accounts, approvals, community management, fee schedule

Phase 2 (roadmap): real-time push notifications, vendor portal, document e-signing, mobile native app, Stripe/payment gateway integration.

---

*City of Karis · Phase 1 · Built 2026*
