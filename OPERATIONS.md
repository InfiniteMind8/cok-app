# City of Karis — Operations Guide

Day-to-day procedures for the admin team running the City of Karis community app.

---

## Daily Checklist

- [ ] Open `/admin/treasury/debug` and confirm **"Reconciliation OK"** (all rows green, no FAILED status)
- [ ] Review `/admin/approvals` — process any pending settlement requests
- [ ] Check Clerk dashboard → Webhooks → Recent Deliveries — no failed deliveries in the last 24 h
- [ ] Glance at `/admin/accounts` for any accounts stuck in `PENDING_KYC` longer than 48 h — follow up with the resident

---

## Weekly Checklist

- [ ] Review all settlements approved that week — verify totals match treasury inflow expectations
- [ ] Check UploadThing dashboard for storage usage (free tier: 2 GB; paid tier: scales with plan)
- [ ] Verify Supabase automated backup ran (Supabase dashboard → Database → Backups)
- [ ] Review `/admin/community` — close any votes that have reached their deadline; resolve stale issues

---

## Monthly Checklist

- [ ] Review the active fee schedule (Admin → Settings → Fee Schedule) — update rates if the leadership has approved changes
- [ ] Check Clerk dashboard → Invitations — revoke any expired or unclaimed invitations
- [ ] Audit `/admin/accounts` — review suspended accounts for reinstatement or permanent deactivation
- [ ] Confirm all system wallets are present (Admin → Treasury — 5 system wallets should appear in the flow table)

---

## Reconciliation Procedure

The debug page at `/admin/treasury/debug` runs a real-time reconciliation check.

**Green / OK:** All transaction entries balance. Total credits = total debits across all wallets.

**FAILED / Mismatch:** One or more transactions have an imbalance.

What to do if you see a mismatch:
1. **Do not touch the database directly.** All fixes must go through the application layer.
2. Note the transaction ID shown in the error row.
3. Export the current database state (Supabase → Table Editor → Export CSV for `Transaction` and `LedgerEntry` tables).
4. Contact the development team with the exported files and the transaction ID.
5. Do not record new treasury deposits or approve settlements until the mismatch is resolved.

A mismatch typically means a Server Action threw an error mid-write. The fix is a compensating journal entry — not a deletion.

---

## Emergency: Reconciliation Mismatch

If the app reports a critical mismatch affecting resident balances:

1. **Pause approvals** — notify the team to hold all settlement approvals and new deposits.
2. **Export state** — Supabase → SQL Editor → run: `SELECT * FROM "LedgerEntry" ORDER BY "createdAt" DESC LIMIT 500;`
3. **Do not run migrations or schema changes** until the ledger is clean.
4. **Contact dev** with the exported data and the first timestamp where the mismatch appears.
5. After the dev team provides a compensating entry SQL, review it before running — it must be a zero-sum entry except for `TREASURY_ADJUSTMENT` type.

---

## Adding a New Admin

1. Go to Admin → Accounts → Create account.
2. Fill in the resident's full name and email.
3. Set **Role** to `ADMIN`.
4. The system will send a Clerk invitation to the email address.
5. On first sign-in, the Clerk webhook creates the account and sets the role.

Note: There is only one `MASTER_ADMIN`. That role is set manually in the database and cannot be assigned through the UI.

---

## Rotating Secrets

When rotating credentials, update both the service dashboard **and** the Vercel environment variable.

| Secret | Where to rotate | Vercel variable to update |
|---|---|---|
| Clerk secret key | Clerk dashboard → API Keys → Roll key | `CLERK_SECRET_KEY` |
| Clerk webhook secret | Clerk dashboard → Webhooks → Roll secret | `CLERK_WEBHOOK_SECRET` |
| Resend API key | Resend dashboard → API Keys → New key | `RESEND_API_KEY` |
| UploadThing token | UploadThing dashboard → API Keys | `UPLOADTHING_TOKEN` |
| Database URL | Supabase → Database → Reset password | `DATABASE_URL`, `DIRECT_URL` |

After updating a Vercel environment variable, trigger a redeployment (Vercel dashboard → Deployments → Redeploy) so the new value takes effect.

---

## Useful URLs

| Resource | URL |
|---|---|
| Reconciliation debug | `/admin/treasury/debug` |
| Clerk dashboard | https://dashboard.clerk.com |
| Supabase dashboard | https://supabase.com/dashboard |
| UploadThing dashboard | https://uploadthing.com/dashboard |
| Resend dashboard | https://resend.com/overview |
| Vercel deployments | https://vercel.com/dashboard |
