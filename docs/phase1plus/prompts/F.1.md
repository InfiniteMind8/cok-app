# Prompt F.1 — Production build hardening

**Block:** F — Production readiness
**Status:** Done (2026-05-09)

## Brief
Final pre-PWA gate. Ensure the application builds cleanly against a production configuration, every secret is sourced from environment, security headers (including CSP) are set, and a publishable production deploy runbook exists.

## Acceptance Criteria
1. Production build (`pnpm build`) succeeds with zero warnings.
2. All six security headers verified live: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, Content-Security-Policy. `securityheaders.com` A-grade against the deployed URL (project-owner action).
3. `/docs/production-deploy.md` exists and covers pre-deploy, deploy, post-deploy verification, rollback, and pending project-owner actions.

## Implementation
- **CSP**: directive set added to `website/next.config.ts` `securityHeaders` array. Source allowlists enumerate Clerk, Sentry, Upstash, and storage (S3/R2/B2) domains. `style-src 'unsafe-inline'` accepted per playbook (D-F1-01); tighten with nonce strategy in a future phase.
- **Sentry warning**: deprecated `disableLogger` option removed from `withSentryConfig` (Turbopack does not honour it; the warning was the last item between the build and a zero-warning state).
- **Env audit**: `website/.env.example` extended with `NEXT_PUBLIC_APP_URL`, `IMPORT_MAX_ROWS`, `CRON_SECRET`. The `NEXT_PUBLIC_DEMO_MODE` reference in `app/dev-preview/modal/{page.tsx,_client.tsx}` was a typo for `NEXT_PUBLIC_DEMO_MODE_ENABLED`; corrected so the env name aligns with `.env.example`.
- **Runbook**: `website/docs/production-deploy.md` created. Pre-deploy checklist groups vars by domain; rollback covers app, DB, and secret rotation; "pending owner actions" closes a feedback loop with the risk register.

## Out of scope
- F.2 (PWA / TWA / Play Store).
- Live `securityheaders.com` A-grade scan — requires deployed staging URL (PENDING owner action).
- Smoke test (sign-in / transfer / admin) — runbook §3.3 is the procedure (PENDING owner action; precedent D-D12-01).
- Resolving pre-existing PRE-3 lint regression in `app/access/callback/_components/access-callback-client.tsx` — untracked, not F.1's modification surface.

## Evidence
See [`qa/evidence-index.md`](../../../qa/evidence-index.md) entries for prompt F.1.
