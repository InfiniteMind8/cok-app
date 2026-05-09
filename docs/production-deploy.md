# Production Deploy Runbook

This runbook covers what must be true before, during, and after a production deploy of the City of Karis community app, plus how to roll back. It is the canonical pre-launch checklist for Phase 1+ (prompt F.1).

Cross-references:
- Email DNS setup → [`docs/email-setup.md`](./email-setup.md)
- MFA configuration → [`docs/mfa.md`](./mfa.md)
- Sentry / observability → [`docs/observability.md`](./observability.md)
- Storage encryption + signed URLs → [`docs/data-protection.md`](./data-protection.md)
- Backup / restore → [`docs/backup-and-restore.md`](./backup-and-restore.md)
- Cron schedules → [`docs/cron.md`](./cron.md)
- Testing / E2E → [`docs/testing.md`](./testing.md)

---

## 1. Pre-deploy checklist

### 1.1 Secrets in vault

All secrets live only in the deployment platform's secret store (Vercel project env vars or equivalent). `.env.local` and `.env` are local-only and gitignored.

Required production env vars (full list in `.env.example`, grouped by domain):

| Domain | Vars | Notes |
|---|---|---|
| Database | `DATABASE_URL`, `DIRECT_URL` | Supabase pooler (6543) + direct (5432). |
| Auth | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Production Clerk instance — separate from dev. |
| Email | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME` | Domain must be verified in Resend (see §1.2). |
| Storage | `STORAGE_DRIVER`, `STORAGE_ENCRYPTION_KEY`, `STORAGE_S3_*` | Use `s3` driver in prod with SSE-S3 enabled bucket. Encryption key: `openssl rand -hex 32`, stored in vault + offline backup. |
| App | `NEXT_PUBLIC_APP_URL` | Public origin used in transactional emails / audit links. |
| Demo | `NEXT_PUBLIC_DEMO_MODE_ENABLED` | Must be `"false"` (or omitted) in production. |
| Showcase | `NEXT_PUBLIC_DEMO_SHOWCASE_ENABLED` | Set to `"false"` post-launch to 404 the public `/demo/*` tour. |
| Imports | `IMPORT_MAX_ROWS` | Default `1000`; raise only after re-testing transactional pattern. |
| Cron | `CRON_SECRET` | `openssl rand -hex 32`; must match the cron scheduler's bearer token. |
| Observability | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `DEPLOY_ENV`, `NEXT_PUBLIC_DEPLOY_ENV`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, `SENTRY_RELEASE`, `NEXT_PUBLIC_SENTRY_RELEASE` | `DEPLOY_ENV=production`. Auth token used at build-time only for source map upload. |
| Rate limit | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | **Required in production.** Without these, rate limiting falls back to in-memory and does not enforce across edge isolates (R-D9-01). |
| Legacy | `UPLOADTHING_TOKEN` | Optional — only required if any legacy UploadThing surface is still wired. Bulk-import companion-zip flow degrades gracefully when absent (D-D2-04). |

### 1.2 Domain configuration

1. **Email DNS (SPF / DKIM / DMARC)** — Resend domain must be verified. Procedure in [`docs/email-setup.md`](./email-setup.md). Without verified DNS, transactional email silently fails or is spam-filtered.
2. **App domain** — DNS A/CNAME pointed at the deployment platform; HTTPS certificate provisioned (Vercel handles automatically).
3. **Clerk production instance** — created in dashboard, dev/prod kept separate; production keys placed in vault. Backup-code MFA strategy enabled (R-D3-02).

### 1.3 Storage

- S3 / R2 / B2 bucket created.
- Server-side encryption: SSE-S3 (or stronger) on by default.
- Bucket access keys with least-privilege policy (PutObject, GetObject, DeleteObject) — no admin permissions.
- Local encryption key (`STORAGE_ENCRYPTION_KEY`) generated, stored in password manager, plus offline backup. Loss = permanent loss of all locally-encrypted attachments (R-D12-03).

### 1.4 Database

- Supabase project on **Pro** tier — free-tier 1-day backup window is insufficient (R-D12-02).
- PITR enabled. Daily snapshots confirmed in Supabase dashboard.
- Latest migrations applied via `pnpm exec prisma migrate deploy` (the build pipeline does this automatically — see `vercel.json`).

### 1.5 Secret hygiene confirmation

- [ ] `.gitignore` excludes `.env`, `.env.local`, `.env.*.local`, `.env.test`. Confirm via `git ls-files | grep -E '^\.env'` returns nothing.
- [ ] E.2 secrets scan output (`qa/secrets-scan.txt`) shows no real credentials in source. Re-run before tagging release: `git grep -E '(sk_live|whsec_|re_[a-z0-9]{12,}|AKIA[0-9A-Z]{16})' -- ':!*.test.*' ':!.env*'` should return nothing.
- [ ] No secret committed in tests, fixtures, or seed scripts. Test stubs (`whsec_test`, etc.) do not count.

### 1.6 Cron scheduler

`vercel.json` declares one cron path. The scheduler must call:

| Path | Schedule | Header |
|---|---|---|
| `/api/cron/leases` | `0 1 * * *` (01:00 UTC daily) | `Authorization: Bearer $CRON_SECRET` |
| `/api/cron/reconciliation` | per `docs/cron.md` | `Authorization: Bearer $CRON_SECRET` |

If the scheduler is external (not Vercel cron), document its identity and IP allow-list.

---

## 2. Deploy steps

### 2.1 Vercel (default)

1. Confirm the latest commit is on the deploy branch (e.g. `main`).
2. Push. Vercel build runs automatically with `vercel.json`'s pipeline:
   ```
   pnpm install --frozen-lockfile
   pnpm exec prisma generate && pnpm exec prisma migrate deploy && pnpm next build
   ```
3. Watch the build log for any warnings. F.1 acceptance is **zero warnings**.
4. After deploy, the new revision is live at the production domain.

### 2.2 Manual / self-hosted alternative

```bash
# 1. Pull
git fetch origin && git checkout <commit>
# 2. Install
pnpm install --frozen-lockfile
# 3. Apply migrations
pnpm exec prisma generate && pnpm exec prisma migrate deploy
# 4. Build
pnpm build
# 5. Start
pnpm start
```

Process supervisor (systemd / pm2) restarts the Node process on failure. Confirm `NODE_ENV=production` is set.

---

## 3. Post-deploy verification

### 3.1 Headers (curl)

```bash
curl -sI https://<production-url>/
```

Must return all six headers exactly:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; ...
```

CSP must enumerate Clerk, Sentry, Upstash, and storage domains. Reference: `qa/headers-scan-f1.txt` for the locally-verified payload.

### 3.2 securityheaders.com

Submit the production URL to <https://securityheaders.com/>. Acceptance: **A grade or above**. Capture the result page as `qa/securityheaders-<date>.png`.

### 3.3 Smoke flows (manual)

| # | Flow | Verify |
|---|---|---|
| 1 | Sign in as a known role | Clerk redirects to /admin or /community per role; no console errors |
| 2 | Property transfer (admin) | Approval succeeds; audit log row created; email sent (check Resend dashboard) |
| 3 | Resident wallet view | KCRD balance renders; KAmount + currency selector work |
| 4 | Issue creation (resident) | Form submits; attachment uploads via `/api/attachments/upload` |
| 5 | Emergency broadcast (master admin) | Banner appears in admin and resident layouts; email sent |

Document any deviation in `qa/evidence-index.md` under F.1.

### 3.4 Observability

- Sentry: production project receives at least one event from `/api/sentry-test` (master admin only). PII scrub confirmed (no email/name in event data).
- Resend: outbound emails appear in dashboard with delivered status.
- Database: `EmailLog` row created per sent email; `AuditLog` row created per privileged action.

### 3.5 Backup confirmation

Within 24 h of deploy: confirm Supabase has produced a daily snapshot of the production DB. Reference [`docs/backup-and-restore.md`](./backup-and-restore.md).

---

## 4. Rollback

### 4.1 Application rollback (Vercel)

1. Open the Vercel project → **Deployments**.
2. Find the previous good deployment.
3. Promote it to production (`...` → "Promote to Production").
4. Verify by re-running §3.1 headers scan against the production URL.

The previous deployment uses the previous build's compiled code, but the **current database schema**. If the new deploy added migrations that the old code does not understand, roll the database back too (§4.2) before promoting.

### 4.2 Database rollback

1. Identify the migration that must be reverted (`prisma/migrations/<timestamp>_<name>/`).
2. **Do not** delete the migration directory — write a forward-only revert migration that undoes the schema change.
3. Apply via `pnpm exec prisma migrate deploy`.

If the change is data-only (no schema change) and recoverable from snapshot:
1. Use Supabase PITR or daily snapshot — procedure in [`docs/backup-and-restore.md`](./backup-and-restore.md) §6.
2. Confirm recovery point is before the bad deploy.
3. Run smoke flows (§3.3) post-restore.

### 4.3 Secret rotation (if leak suspected)

If a secret is exposed:

1. Generate a new value in the upstream provider (Clerk, Resend, Sentry, Upstash, Supabase, S3).
2. Update the value in the deployment platform's secret store.
3. Trigger a redeploy.
4. Revoke the old value at the provider.
5. Search audit logs and provider logs for any unauthorized use during the leak window.
6. File an entry in `qa/risk-register.md` documenting the incident, impact, and mitigation.

Special cases:
- **`STORAGE_ENCRYPTION_KEY`** — rotation requires re-encrypting all existing attachments. Procedure in [`docs/data-protection.md`](./data-protection.md). Do not rotate in production without a planned maintenance window.
- **`CRON_SECRET`** — rotate the value in vault and the cron scheduler simultaneously, otherwise scheduled jobs fail with 401.

---

## 5. Pending owner actions (project-owner only)

The following acceptance items cannot be performed by the build agent and must be confirmed by the project owner before public launch:

- [ ] Resend domain DNS verified in Resend dashboard (R-A1-01).
- [ ] Clerk production instance configured: production keys, MFA strategy, demo users (if NEXT_PUBLIC_DEMO_MODE_ENABLED used in staging) (R-D3-02, R-D10-03).
- [ ] Upstash Redis database created; production URL/token in vault (R-D9-01).
- [ ] Storage bucket created with SSE-S3 + restricted IAM policy.
- [ ] Supabase Pro plan enabled (R-D12-02).
- [ ] STORAGE_ENCRYPTION_KEY generated, stored in password manager, plus offline backup (R-D12-03).
- [ ] Smoke flows (§3.3) executed against staging deployment; results captured in `qa/evidence-index.md`.
- [ ] securityheaders.com A-grade scan against production URL captured.
- [ ] System wallet floors set to non-null values for treasury wallets (R-D14-01).
- [ ] D.12 restore drill executed and logged (R-D12-01).

Each item links to its risk-register entry; close the entry when the action is complete.
