# Cron Jobs

## Lease lifecycle cron — `/api/cron/leases`

**Purpose**: Nightly job that advances `nextPaymentDue`, flips lease status
(`ACTIVE → ENDING_SOON → EXPIRED`), and emails residents whose lease entered
`ENDING_SOON` that day.

### Schedule

Runs daily at 01:00 UTC. Configured in `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/leases", "schedule": "0 1 * * *" }
  ]
}
```

### Authorization

The endpoint requires a shared secret in the `Authorization` header:

```
Authorization: Bearer <CRON_SECRET>
```

Vercel Cron passes this automatically when `CRON_SECRET` is set in the project
environment variables. The secret is generated once and stored as an env var:

```
CRON_SECRET=<random 32-char hex string>
```

Add to `.env` (local) and Vercel project settings (production / preview).

### Manual trigger

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://<your-domain>/api/cron/leases
```

### Response

```json
{ "ok": true, "processed": 42, "updated": 3, "endingSoonEmailed": 1 }
```

- `processed` — total ACTIVE/ENDING_SOON tenancies checked
- `updated` — tenancies whose status or nextPaymentDue changed
- `endingSoonEmailed` — residents emailed because their lease entered ENDING_SOON

### What it does

For every `ACTIVE` or `ENDING_SOON` tenancy:

1. If `nextPaymentDue` is in the past, advance it by one cycle until it is
   in the future (uses `computeNextPaymentDue` from `lib/lease/cycle.ts`).
2. Recompute `leaseStatus` from `endDate` vs. today:
   - No end date → `ACTIVE`
   - End date > 14 days away → `ACTIVE`
   - End date ≤ 14 days away → `ENDING_SOON`
   - End date in the past → `EXPIRED`
3. If the status changed `ACTIVE → ENDING_SOON`, email the resident with a
   reminder using the `rental-extension-decision` email template.

### Error handling

- Individual email failures are swallowed (`.catch(() => {})`) to prevent one
  bad address from stopping the whole batch.
- DB update failures bubble up and cause the job to return a 500.

### Adding new cron jobs

1. Add a new route under `app/api/cron/<job-name>/route.ts`.
2. Apply the same `Authorization: Bearer $CRON_SECRET` guard at the top.
3. Add an entry to `vercel.json` `crons` array.
4. Document the job here.
