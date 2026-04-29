# Phase 1+ Progress Tracker

| Prompt | Status | Acceptance Met | Commit(s) | Test Status | Evidence | Blockers |
|---|---|---|---|---|---|---|
| A.1 — Resend email delivery | Done | Yes | (pending git commit) | 52/52 pass, typecheck clean | `lib/email/__tests__/`, `qa/evidence-index.md` | DNS domain verification requires Dr. Munroe action (see `docs/email-setup.md`) |
| A.2 — Fee schedule editor | Done | Yes | (pending git commit) | 60/60 pass, typecheck clean | `lib/ledger/__tests__/fee-schedule.test.ts`, `qa/evidence-index.md` | Migration requires connected DB (`prisma migrate deploy`) — see R-004 |
| A.3 — Approvals Center tabs | Done | Yes | (pending git commit) | 76/76 pass, typecheck clean, build 31 routes | `app/(admin)/_actions/__tests__/`, `qa/evidence-index.md` | Migration `20260428000003_a3_approvals_center` requires connected DB — see R-005 |
| B.1 — Brand sign-in page | Done | Yes | (pending git commit) | 93/93 pass, typecheck clean, build 34 routes | `app/(auth)/sign-in/[[...sign-in]]/__tests__/`, `qa/evidence-index.md` | Screenshots deferred to E.3 (no live server in this session); Playwright deferred to D.10 per D-009 |
| B.2 — Modal/popup edge pass | Done | Yes | 19fe49f | 96/96 pass, typecheck clean, build 35 routes | `components/ui/__tests__/modal.test.ts`, `qa/evidence-index.md` | Screenshots deferred to E.3; Playwright focus-trap deferred to D.10 per D-013 |
| B.3 — Intake form completion | Done | Yes | (pending git commit) | 141/141 pass, typecheck clean, build 32 routes | `app/(admin)/_actions/__tests__/`, `lib/storage/__tests__/`, `qa/evidence-index.md` | Migration `20260428000004_b3_intake_forms` requires connected DB — see R-008; UploadThing size literals capped at closest power-of-2 — see D-015; Playwright deferred to D.10 — see D-016 |
| C.1 — Multi-currency display | Done | Yes | 2d6ec95 | 165/165 pass, typecheck clean | `lib/ledger/__tests__/currency.test.ts`, `qa/evidence-index.md` | None |
| C.2 — Visitor Groups system | Done | Yes | 76c273b | 181/181 pass, typecheck clean | `lib/visitor-groups/__tests__/groups.test.ts`, `lib/queries/__tests__/community-feed-filter.test.ts`, `qa/evidence-index.md` | Migration `20260428215229_add_visitor_groups` requires `prisma migrate deploy` on connected DB — see R-C2-03 |
| C.3 — Rental cycle + extension | Done | Yes | `4df41fc`, `7a477d2` | 218/218 pass, 7 skip (E2E stubs), typecheck clean, build 23 routes | `lib/lease/__tests__/cycle.test.ts`, `app/(admin)/_actions/__tests__/rental-extensions.test.ts`, `app/api/cron/leases/__tests__/route.test.ts`, `qa/evidence-index.md` | Migration `20260429000001_c3_rental_cycle` requires `prisma migrate deploy` on connected DB — see R-C3-02 |
| D.1 — Bulk Excel import (members) | Done | Yes | `b84c926` | 241/250 pass, 9 skip (E2E stubs), typecheck clean | `lib/imports/members-parser.ts`, `lib/imports/__tests__/`, `qa/evidence-index.md` | None |
| D.2 — Bulk Excel import (properties) | Done | Yes | `1a8ba8d` | 262/273 pass, 11 skip (E2E stubs), typecheck clean | `lib/imports/properties-parser.ts`, `app/(admin)/admin/imports/properties`, `qa/evidence-index.md` | None |
| D.3 — MFA enforcement staff roles | Done | Yes | `802fe1f` | 276/292 pass, 16 skip (E2E stubs), typecheck clean | `lib/mfa/`, `app/(account)/account/mfa-enroll`, `qa/evidence-index.md` | Clerk TOTP_OR_BACKUP_CODE dashboard setup required (R-D3-02) |
| D.4 — Audit log viewer + data directory | Done | Yes | `ac0ce41` | 283/304 pass, 21 skip (E2E stubs), typecheck clean | `lib/audit/index.ts`, `lib/queries/audit-log.ts`, `app/(admin)/admin/audit-log`, `qa/evidence-index.md` | None |
| D.5 — Treasury reconciliation auto-alerts | Done | Yes | `2750ec0` | 291/314 pass, 23 skip (E2E stubs), typecheck clean | `lib/ledger/reconciliation-report.ts`, `app/api/cron/reconciliation/route.ts`, `components/admin/reconciliation-alert-banner.tsx`, `app/(admin)/admin/treasury/reconciliation`, `qa/evidence-index.md` | Migration requires `prisma migrate deploy` on connected DB (R-D5-01) |
| D.6 — Emergency broadcast | Done | Yes | `7c489b0` | 297/323 pass | `lib/queries/broadcast.ts`, `app/(admin)/admin/broadcast`, `components/shared/emergency-broadcast-banner.tsx`, `qa/evidence-index.md` | None |
| D.7 — Onboarding tour | Done | Yes | `b8313cb` | 314/342 pass | `lib/tour/steps.ts`, `components/shared/onboarding-tour.tsx`, `app/(admin)/layout.tsx`, `app/(resident)/layout.tsx`, `qa/evidence-index.md` | VENDOR/ADMIN tour deferred (no dedicated layout) |
| D.8 — Sentry monitoring | Done | Yes | `fdf8ad5` | 314/342 pass | `sentry.*.config.ts`, `instrumentation.ts`, `lib/sentry.ts`, error boundaries, `/api/sentry-test`, `qa/evidence-index.md` | pnpm approve-builds for @sentry/cli required in CI (R-D8-01) |
| D.9 — Rate limiting on Server Actions | Done | Yes | `a6d2f98` | 326/356 pass | `lib/rate-limit/index.ts`, `proxy.ts`, `imports.ts`, `broadcast.ts`, `accounts.ts`, `qa/evidence-index.md` | Redis required for reliable auth rate limiting in production (R-D9-01) |
| D.10 — Playwright E2E coverage | Not Started | — | — | — | — | — |
| D.11 — File storage strategy | Not Started | — | — | — | — | — |
| D.12 — Backup & restore runbook | Not Started | — | — | — | — | — |
| D.13 — Webhook handler Clerk events | Not Started | — | — | — | — | — |
| D.14 — System wallet floor protection | Not Started | — | — | — | — | — |
| D.15 — Full email template suite | Not Started | — | — | — | — | — |
| E.1 — Technical function test sweep | Not Started | — | — | — | — | — |
| E.2 — Security test sweep | Not Started | — | — | — | — | — |
| E.3 — UX/accessibility test sweep | Not Started | — | — | — | — | — |
| E.4 — Code quality inspection | Not Started | — | — | — | — | — |
| F.1 — Production build hardening | Not Started | — | — | — | — | — |
| F.2 — PWA → Play Store packaging | Not Started | — | — | — | — | — |
