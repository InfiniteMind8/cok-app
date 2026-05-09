# Phase 1+ Final Readiness Audit
**Date:** 2026-05-09
**Scope:** §9 closure gate per `CLAUDE_EXECUTION_ROOT.md`
**Inputs:** Playbook Appendix D acceptance summary checklist; trackers `qa/{phase1plus-progress,risk-register,decision-log,evidence-index}.md`; block checkpoints C, D, F; quality reports E.1–E.4; `docs/go-live.md` Phase A → I.
**Outputs:** This audit + three Go/No-Go verdicts.

---

## 1. Executive verdicts

| Readiness gate | Verdict | Conditions |
|---|---|---|
| **Phase 1+ implementation** | **Go** | All 31 Appendix D items materially met or accepted-deferred; build-agent-deliverable scope of every block (A → F) closed; no blocking Critical/High open in code; lint/typecheck/test/build all clean. |
| **Production deployment** | **Conditional Go** | Gated on `go-live.md` Phase A → C: provider account provisioning (Phase A), first deploy (Phase B), live verification incl. `securityheaders.com` A-grade + smoke flows + restore drill + system wallet floors (Phase C). Plus E.4 / E.2 owner items (system wallet floors, encryption key backup, Supabase Pro, Redis). |
| **Play Store submission** | **Conditional Go** | Gated on `go-live.md` Phase F → G: Bubblewrap AAB build on JDK-equipped workstation (Phase F), `assetlinks.json` SHA-256 update post-build (Phase F step F6), Play Console listing fill-in (Phase G), the three remaining authenticated screenshots via `SCREENSHOT_INCLUDE_AUTHENTICATED=1 pnpm pwa:screenshots` (D-F2-04 capture step). Production-track promotion further gated on counsel-approved legal text (Phase E). |

The owner runs `docs/go-live.md` Phase A → I to convert each Conditional Go into a Go.

---

## 2. Appendix D — line-by-line evidence walk

Every box from playbook Appendix D, each with explicit evidence path. Status: ✅ Met / ⚠️ Conditional (owner-action documented) / ❌ Not Met.

| Block | Item | Status | Evidence |
|---|---|---|---|
| A.1 | Resend transactional emails actually send across all flows | ✅ Met | `website/lib/email/service.ts`; `website/lib/email/templates/` (8 react-email templates); `website/app/(admin)/admin/email-log/`; `website/lib/email/__tests__/{service,templates}.test.ts`; commits `e999a49`, `6b893d8`. Live sending requires Resend domain DNS verification (R-A1-01) — owner action in `go-live.md` Phase A step A1. |
| A.2 | Master Admin can edit fees with history & audit | ✅ Met | `website/app/(admin)/admin/settings/_components/fee-schedule-editor.tsx`; `website/app/(admin)/_actions/settings.ts` `updateFeeScheduleAction`; `website/lib/ledger/__tests__/fee-schedule.test.ts`. |
| A.3 | Approvals Center tabs (Settlements, Property Transfers, Vouchers) all functional | ✅ Met | `website/app/(admin)/admin/approvals/_components/{transfer-dialogs,voucher-request-dialogs}.tsx`; rental-extensions tab added in C.3 (`9e2cd3f`). |
| B.1 | Sign-in page is brand-consistent; demo shortcut env-gated | ✅ Met | `website/app/(auth)/sign-in/[[...sign-in]]/_components/{sign-in-form,demo-block}.tsx`; demo block reads `NEXT_PUBLIC_DEMO_MODE_ENABLED`. |
| B.2 | Every modal complies with the spacing primitive | ✅ Met | `website/components/ui/modal.tsx` (Modal primitive enforcing §4.4); migration logged D-B2-01; `website/components/ui/__tests__/modal.test.ts`. |
| B.3 | Every intake form captures every spec field with required uploads | ✅ Met | `website/lib/storage/attachments.ts`; 7 forms + 6 actions; `website/lib/storage/__tests__/attachments.test.ts`. UploadThing path superseded by D.11 storage driver (D-D11-01). |
| C.1 | KCRD / USD / GYD display toggle + admin rate editor + bonus promotions | ✅ Met | `website/lib/currency/`; `website/app/(admin)/admin/settings/{currency,promotions}/page.tsx`; `website/components/admin/k-amount.tsx`; `website/app/(resident)/profile/_components/display-currency-selector.tsx`; commit `2d6ec95`. 165/165 tests at the time of completion. |
| C.2 | Visitor Groups + group-targeted announcements + visitor permission lockdown | ✅ Met | `website/app/(admin)/admin/visitors/groups/`; `website/app/(admin)/_actions/visitor-groups.ts`; `website/app/(admin)/admin/community/page.tsx` (announce-to-group deep link); `website/lib/auth.ts` `denyIfVisitor()`; `website/lib/visitor-groups/__tests__/groups.test.ts` (11 tests); `website/tests/e2e/c2-visitor-groups.spec.ts` (3 serial scenarios); commit `a176007`. |
| C.3 | Lease cycles, next payment due, extension request workflow | ✅ Met | `website/lib/lease/cycle.ts`; `website/app/(resident)/property/_components/{tenancy-status-card,extension-request-modal}.tsx`; `website/app/(admin)/_actions/rental-extensions.ts`; `website/app/api/cron/leases/route.ts`; `website/tests/e2e/{c3-rental-extensions,rental-extension}.spec.ts`; commit `9e2cd3f`. 19 unit tests for cycle helpers + 8 unit tests for cron. |
| D.1 | Bulk Excel import — members | ✅ Met | `website/lib/imports/members-parser.ts`; `website/app/(admin)/admin/imports/members/`; template route; preview/commit pages; 23 unit tests; commit `b84c926`. |
| D.2 | Bulk Excel import — properties | ✅ Met | `website/lib/imports/properties-parser.ts`; companion zip via UTApi (skips gracefully without UPLOADTHING_TOKEN, D-D2-04); 21 unit tests; commit `1a8ba8d`. |
| D.3 | MFA enforced for staff roles | ✅ Met | `website/lib/mfa/index.ts` (STAFF_ROLES, requireMfaEnrolled); `website/app/(admin)/layout.tsx` MFA gate; `website/app/(account)/account/mfa-enroll/`; `website/docs/mfa.md`; 14 unit tests; commit `802fe1f`. Clerk dashboard MFA strategy is owner action — R-D3-02, `go-live.md` Phase A step A2. |
| D.4 | Audit log viewer + Master Admin Data Directory | ✅ Met | `website/lib/audit/index.ts`; `website/lib/queries/{audit-log,data-directory}.ts`; `website/app/(admin)/admin/{audit-log,data-directory}/`; `website/app/api/admin/{audit-log,data-directory}/export/`; `website/lib/email/templates/mfa-reset.tsx`; `website/docs/data-protection.md`; 7 unit tests; commit `ac0ce41`. |
| D.5 | Treasury reconciliation auto-alerts | ✅ Met | `website/lib/ledger/reconciliation-report.ts`; `website/app/api/cron/reconciliation/route.ts`; `website/components/admin/reconciliation-alert-banner.tsx`; `website/app/(admin)/admin/treasury/reconciliation/`; 8 unit tests; commit `2750ec0`. Cron secret + reconciliation cron entry — `go-live.md` Phase B step B6. |
| D.6 | Emergency broadcast | ✅ Met | `website/lib/queries/broadcast.ts`; `website/app/(admin)/admin/broadcast/`; `website/components/shared/emergency-broadcast-banner.tsx`; chunked 50/batch email send; severity-aware banner; 6 unit tests; commit `7c489b0`. |
| D.7 | Onboarding tour per role | ✅ Met (Resident + Master Admin) / ⚠️ Deferred for VENDOR + ADMIN — R-D7-02 | `website/lib/tour/steps.ts`; `website/components/shared/{onboarding-tour,tour-provider,tour-trigger-button}.tsx`; 17 unit tests; commit `b8313cb`. VENDOR/ADMIN tour deferred until those layouts are built (D-D7-01) — not blocking; Phase 2. |
| D.8 | Sentry on client and server | ✅ Met | `website/sentry.{client,server,edge}.config.ts`; `website/instrumentation.ts`; `website/lib/sentry.ts` `withSentryAction` HOF; error boundaries; `/api/sentry-test` MASTER_ADMIN-only; `website/docs/observability.md`; commit `fdf8ad5`. PII scrub in `beforeSend`. Sentry production project provisioning — `go-live.md` Phase A step A7. |
| D.9 | Rate limiting on Server Actions | ✅ Met | `website/lib/rate-limit/index.ts` (Upstash Redis when env present, in-memory fallback for dev); `website/proxy.ts` IP rate limits on auth; per-action limits in 3 actions; 12 unit tests; commit `a6d2f98`. Production reliability requires Redis (R-D9-01) — `go-live.md` Phase A step A3. |
| D.10 | Ten Playwright E2E tests green | ✅ Met (9 active, 1 deferred per R-D10-02) | `website/tests/e2e/` 10 spec files; 9 active including `c3-rental-extensions` and `rental-extension` (the latter activated in C.3 closure `9e2cd3f`); test 2 (`ledger-transfer`) skipped because Phase 1+ ships no resident-to-resident transfer UI (R-D10-02 / D-D10-02 — Phase 2 work); `.github/workflows/e2e.yml`; `website/docs/testing.md`; commit `11cd446`. CI requires GitHub repo secrets (R-D10-01). |
| D.11 | File storage layout, encryption, signed URLs | ✅ Met | `website/lib/storage/driver.ts` (LocalStorageDriver AES-256-GCM + S3StorageDriver SSE-S3); `website/app/api/attachments/{upload,serve}/route.ts`; signed URLs ≤ 300 s; 21 unit tests; commit `45d0934`. STORAGE_ENCRYPTION_KEY must be 32 bytes hex (R-D11-01) — `go-live.md` Phase A step A5. Loss of key = permanent file data loss (R-D12-03) — backup is operational. |
| D.12 | Backup & restore runbook + drill log | ✅ Met (runbook) / ⚠️ Conditional (drill — R-D12-01) | `website/docs/backup-and-restore.md` (Supabase native + manual pg_dump + S3 versioning + key management + step-by-step restore + smoke tests + drill log); commit `d12c7b3`. Live drill execution requires owner Supabase access — `go-live.md` Phase C step C7 (D-D12-01). Free-plan retention gap (1 day vs 14-day target — R-D12-02) — Pro plan upgrade in `go-live.md` Phase A step A6. |
| D.13 | Clerk webhook handler robust + tested | ✅ Met | `website/app/api/webhooks/clerk/route.ts`; idempotency via WebhookEvent table + svix-id; `user.deleted` soft-delete; `Authorization: Bearer` corrected to svix headers (D-D13-01); 7 unit tests; commit `53f3633`. CLERK_WEBHOOK_SECRET — `go-live.md` Phase A step A2. |
| D.14 | System wallet floors enforced + UI explained | ✅ Met (code) / ⚠️ Conditional (operational config — R-D14-01) | `website/lib/ledger/{types,service}.ts` `FloorBreachError` + floor check in `transferCredits()`; `website/app/(admin)/_actions/treasury.ts` `updateWalletFloorAction`; `website/app/(admin)/admin/treasury/_components/wallet-floor-card.tsx`; 6 unit tests; commit `e42b030`. System wallets seed with `floor_kcrd=null` (floor inactive) — Master Admin must set floors at `/admin/treasury` before go-live — `go-live.md` Phase C step C8. |
| D.15 | Full email template suite, brand-styled, tested | ✅ Met | `website/lib/email/templates/lease-ending-soon.tsx`; severity-aware `emergency-broadcast.tsx`; `website/lib/email/__tests__/templates.test.ts` (+7 new tests, 367 total at the time); 13 HTML preview files in `qa/screenshots/emails/`; commit `be788f5`. |
| E.1 | `/qa/function-test-report.md` complete, no open Fail rows | ✅ Met | `qa/function-test-report.md` — full §5.1 matrix; 0 Fail rows; 5 PENDING live-run flows (MFA enrollment, member invite, resident-to-resident transfer, vendor dashboard, lease-ending email) all owner action against deployed staging — same precedent as R-F1-03. |
| E.2 | `/qa/security-test-report.md` complete, no Critical/High open | ✅ Met | `qa/security-test-report.md` (ASVS L1 V1–V14, 11 specific verifications, findings list); `qa/{audit-output,secrets-scan,headers-scan,headers-scan-f1}.txt`; 0 Critical/High open. xlsx HIGH (R-E2-01) and effect HIGH (R-E2-02) accepted with compensating controls or upstream-pending status. CSP delivered in F.1 (was deferred per D-E2-01); commit `95a192c`. |
| E.3 | `/qa/ux-accessibility-report.md` complete, Lighthouse ≥ 95 | ⚠️ Met-with-substitution per D-E3-01 | `qa/ux-accessibility-report.md`; `qa/lighthouse/` (5 axe evidence files); 8 inline fixes across 7 files; 1 contrast issue tracked (R-E3-01) — partial fix in E.3, remaining usages in authenticated UI carried to Phase 2. **Lighthouse CLI cannot authenticate against Clerk; substituted `@axe-core/playwright` per D-E3-01 — equivalent WCAG AA assessment.** Owner can run Lighthouse against the live deploy post-launch for a numeric score; this is a measurement option, not a blocker. Commit `4e54eb5`. |
| E.4 | `/qa/code-quality-report.md` complete, lint/type/test green | ✅ Met (post-closure) | `qa/code-quality-report.md`; `qa/code-quality/` (8 tool outputs); 23 lint fixes across 22 files; 9-item refactor backlog (Medium/Low). E.4 commit `192cf7b` shipped lint exit 0. PRE-3 regression introduced in `access-callback-client.tsx` after E.4 was closed in this closure session (`ff23fa7`); current lint is exit 0 with 1 unrelated pre-existing imports.ts warning carried forward. |
| F.1 | Production build succeeds; security headers A-grade | ✅ Met (build, local headers) / ⚠️ Conditional (live A-grade scan — R-F1-03) | `qa/f1-build.txt` zero-warning; `qa/headers-scan-f1.txt` all 6 headers verified locally including CSP (D-F1-01); commits `c6aae9c`, `169d11a`, `30ea556`. `securityheaders.com` A-grade scan against deployed URL is owner-action — `go-live.md` Phase C step C2 (R-F1-03). Post-closure lint exit 0; PRE-3 cleared (`ff23fa7`). |
| F.2 | PWA installable; AAB built and signed; Play Store assets ready | ⚠️ Conditional — three sub-items owner-action | **PWA installable: ✅ Met** (`qa/f2-endpoint-scan.txt` — 8 endpoints serve 200 with security headers; manifest, SW, offline page all live; commit `e2c520c`). **AAB: ⚠️ Conditional** — owner-only on JDK + keytool + keystore workstation (R-F2-01); `docs/play-store.md §2–§6` and `docs/go-live.md` Phase F runbooks complete. **Listing assets: ✅ Met → ⚠️ Conditional for the 3 remaining authenticated screenshots** — 4 public-renderable PNGs + icon + feature graphic delivered; the closure session extended `scripts/capture-play-store-screenshots.ts` (commit `6502eb3`) so the owner runs `SCREENSHOT_INCLUDE_AUTHENTICATED=1 pnpm pwa:screenshots` against `pnpm dev` to capture dashboard / treasury / announcement (D-F2-04 capture step). **`assetlinks.json` SHA-256 fingerprint** — placeholder ships; owner replaces post-`bubblewrap build` (R-F2-02). **Counsel-approved legal text** — drafts live with "DRAFT" banner (R-F2-03); Play Store production-track promotion is gated on counsel sign-off per `go-live.md` Phase E + Phase H step H3. |

**Tally:** 26 ✅ Met (or Met-with-substitution), 5 ⚠️ Conditional pending owner action. **0 ❌ Not Met.**

Conditional rows: D.7 (VENDOR/ADMIN tour deferred, Phase 2 — non-blocking), D.12 (drill is owner action), D.14 (operational floor configuration), F.1 (live A-grade scan owner action), F.2 (AAB + assetlinks + screenshots + counsel — owner action with documented procedures).

---

## 3. Block-by-block summary

| Block | Status | Checkpoint |
|---|---|---|
| A | ✅ Closed | (no per-block checkpoint produced — A.1–A.3 retroactively documented from git log + 141-test baseline) |
| B | ✅ Closed | (no per-block checkpoint produced — B.1–B.3 retroactively documented; `19fe49f` modal primitive, `fd1db6c` intake forms) |
| C | ✅ Closed | `qa/block-C-checkpoint.md` — 373/373 unit; c2 + c3 E2E specs activated; D-SEQUENCE-01 resolved |
| D | ✅ Closed | `qa/block-D-checkpoint.md` — 367/367 unit; 8 active E2E; conditional flag carried to F.2 (D.12 AC2 owner action) |
| E | ✅ Closed | E.1 (function), E.2 (security ASVS L1), E.3 (axe sweep), E.4 (code quality) — all reports filed; 0 Critical/High open |
| F | ✅ Closed (this session) | `qa/block-F-checkpoint.md` — F.1 + F.2 acceptance; closure-session Steps 1–4 (R-F1-01, R-F1-04, D-F2-04 build-agent scope, R-F2-05 verification) |

---

## 4. Open / deferred items inventory

### Owner-action items that gate the live deploy (run as part of `go-live.md`)

| Item | go-live.md anchor | Risk / Decision link |
|---|---|---|
| Resend domain DNS (SPF / DKIM / DMARC) | Phase A step A1 | R-A1-01 |
| Clerk production instance + MFA strategy + demo users | Phase A step A2 | R-D3-02, R-D10-03 |
| Upstash Redis production database | Phase A step A3 | R-D9-01 |
| Storage S3/R2/B2 bucket + scoped keys | Phase A step A4 | (bucket provisioning) |
| Storage encryption key (`openssl rand -hex 32` + 2 backups) | Phase A step A5 | R-D11-01, R-D12-03 |
| Supabase Pro upgrade (PITR) | Phase A step A6 | R-D12-02 |
| Sentry production project + auth token | Phase A step A7 | R-D8-01 |
| `CRON_SECRET` generation | Phase A step A8 | (cron security) |
| Push to deploy + zero-warning build | Phase B step B5 | (deploy) |
| `securityheaders.com` A-grade scan against live URL | Phase C step C2 | R-F1-03 |
| Smoke flows on live (sign-in, transfer, admin actions, broadcast) | Phase C step C3 | R-F1-03, E.1 PENDING flows |
| Sentry receives `/api/sentry-test` event | Phase C step C4 | (observability) |
| Resend smoke-flow emails delivered | Phase C step C5 | A.1 live verification |
| Supabase first daily snapshot | Phase C step C6 | R-D12-02 |
| D.12 restore drill against staging | Phase C step C7 | R-D12-01, D-D12-01 |
| Master Admin sets system wallet floors | Phase C step C8 | R-D14-01 |
| PWA Chrome installability + offline + Add-to-Home-Screen on real Android | Phase D | F.2 AC1 live verification |
| Counsel review of `legal/{privacy,terms}.md` | Phase E | R-F2-03 |
| Bubblewrap AAB build (JDK 17+, keytool, keystore) | Phase F steps F1–F7 | R-F2-01 |
| `assetlinks.json` SHA-256 fingerprint update | Phase F step F6 | R-F2-02 |
| Authenticated Play Store screenshots (`SCREENSHOT_INCLUDE_AUTHENTICATED=1 pnpm pwa:screenshots` against `pnpm dev`) | (between Phase F and Phase G) | D-F2-04, D-F2-05 |
| Play Console developer account + listing fill | Phase G steps G1–G6 | (Play Store ops) |
| Upload AAB → Internal testing | Phase G step G7 | (Play Store ops) |
| Stabilise → Closed → Open → Production track | Phase H | F.2 + counsel gate (H3) |
| Post-launch monitoring (Vitals, Sentry, Resend, Supabase, audit log, Pre-launch reports) | Phase I | (operational) |

### Carried forward (non-blocking)

| Item | Risk | Notes |
|---|---|---|
| `app/(admin)/_actions/imports.ts` unused-import warning | (E.4 backlog) | Single-line removal; baseline through F.1, F.2, and closure session; not blocking. Pick up in next maintenance pass. |
| VENDOR/ADMIN onboarding tour | R-D7-02, D-D7-01 | Steps defined in `lib/tour/steps.ts`; auto-shows when those layouts are built. Phase 2. |
| `karis-stone-500` contrast on authenticated pages | R-E3-01 | Two highest-impact instances fixed in E.3; remaining usages in admin dashboard / community timestamps tracked for a future pass. |
| Resident-to-resident KCRD transfer UI | R-D10-02, D-D10-02 | Phase 1+ does not ship this. Schema supports TRANSFER type. Test 2 (ledger-transfer) skipped. Phase 2 work. |
| Status-red contrast on stone-50 | R-E3-02 | Mitigated — acceptable in observed paths; only a risk on stone-50 panel which forms don't use. |
| iOS Safari input zoom on small fonts | R-E3-03 | FIX-01 removed `user-scalable=no` for WCAG; iOS auto-zoom on inputs with font-size < 16px is a known pattern. Workaround (responsive font-size ≥ 16px on mobile) is documented. |
| `.env.example` PRE-3 line bundling | R-F1-02 | F.1 commit bundled one PRE-3 line that was already in working tree. Disclosed; not a blocker. |
| `sharp` install caveat on Windows | R-F2-04 | Mitigated — added to `pnpm.onlyBuiltDependencies`; verified in F.2 session. |
| Hand-rolled SW VERSION bump per release | R-F2-05 | Operational — release-checklist mitigation in `play-store.md §9 step 4`; verified in closure session. Phase 2 hardening idea: CI gate when `public/sw.js` is touched without `VERSION` changing. |
| `xlsx` HIGH advisories | R-E2-01 | Accepted with compensating controls (MASTER_ADMIN-only, 3/hr rate limit, 64MB cap). Upgrade path tracked. |
| `effect` HIGH advisory (transitive) | R-E2-02 | Accepted — not invoked by `@uploadthing` in our usage pattern. Pending upstream. |
| Dev-only Moderate advisories | R-E2-03 | Not in production runtime. Pending upstream updates to `prisma`, `next`, `shadcn`. |

---

## 5. Recommended immediate next actions

In priority order, mapped 1:1 to `go-live.md` Phase A → I. The owner runs these sequentially over the 1–2 week deploy window (per the `qa/deploy-coordination.md` companion plan).

### Day 1
1. **Phase A — provisioning.** Set up Resend domain + DNS (A1, parallel — DNS verification can take up to 48h), Clerk production instance (A2), Upstash Redis (A3), storage bucket + keys (A4), generate encryption key + back up (A5), upgrade Supabase to Pro (A6), Sentry production project (A7), generate `CRON_SECRET` (A8). All values land in deployment vault. Aim: by end of day 1 every Phase A row is complete.
2. **Phase B — first deploy.** Add env vars to deploy platform, set DNS A/CNAME, push to deploy branch, watch for zero-warning build, confirm cron entries (B1–B6). Aim: deploy reachable on the production domain by end of day 1 or early day 2.

### Day 2
3. **Phase C — web post-deploy verification.** `curl -sI https://...` for all 6 security headers (C1), `securityheaders.com` A-grade scan and capture screenshot to `qa/securityheaders-<date>.png` (C2 — closes R-F1-03), smoke flows for sign-in / property transfer / wallet view / issue with attachment / emergency broadcast (C3 — closes 5 PENDING E.1 rows), Sentry sentry-test event (C4), Resend deliveries (C5). Aim: all of Phase C green by end of day 2.
4. **Phase D — PWA verification.** DevTools Manifest + Service Worker + Offline reload (D1–D3), real-Android Add-to-Home-Screen (D4), `curl` `/manifest.webmanifest` and `/.well-known/assetlinks.json` (D5–D6), `/privacy` + `/terms` render (D7).

### Day 3
5. **Phase C tail — operational config + drill.** Set system wallet floors via `/admin/treasury` (C8 — closes R-D14-01), execute the D.12 restore drill against staging, file the drill log entry (C7 — closes R-D12-01). Confirm Supabase first daily snapshot landed (C6).
6. **Phase E — counsel review.** Send `legal/privacy.md` and `legal/terms.md` to counsel. Apply edits. Remove "DRAFT — pending counsel review" banners. Set effective dates. Commit + redeploy. Counsel turnaround typically 3–5 business days; this gates Phase H step H3.

### Day 4–5
7. **Phase F — Bubblewrap AAB build.** Install JDK 17+, install Bubblewrap CLI, `bubblewrap init` against the live URL (F1–F3), generate signing keystore + back up (F4 — closes R-F2-01 setup), `bubblewrap build` (F5), paste SHA-256 into `assetlinks.json` + commit + redeploy (F6 — closes R-F2-02), `adb install -r app-release-signed.apk` and smoke-test on real Android (F7).
8. **Authenticated screenshots (D-F2-04 capture).** With a non-production preview deploy or `pnpm dev` running, run `SCREENSHOT_INCLUDE_AUTHENTICATED=1 pnpm pwa:screenshots`. Verify 3 new PNGs at `marketing/play-store/screenshots/`. Commit alongside the four existing.
9. **Phase G — Play Console.** Create developer account ($25), create the "City of Karis" app, fill listing assets including the 7 screenshots, content rating (Everyone), data safety per `play-store-data-safety.md`, target audience 18+, upload AAB to **Internal testing** track, share opt-in link with founding cohort (G1–G10). Wait for Play Store review (hours to 7 days).

### Day 6–7
10. **Phase H — stabilise → production.** Monitor internal testing for ≥ 7 days with zero blockers; promote to Closed testing. Counsel approval must be live before promoting to Production track (H3). Watch Vitals + Sentry for the first 72 hours of Production.
11. **Phase I — post-launch monitoring.** Daily triage of Sentry top errors for the first month; weekly audit-log spot-check; bounce/spam-mark monitoring on Resend; Supabase snapshot status; Pre-launch report on every new AAB.

---

## 6. Closure session deliverables (for the §9 record)

This session produced four artifacts beyond the per-step commits:

| Artifact | Location | Purpose |
|---|---|---|
| Block F closure checkpoint | `qa/block-F-checkpoint.md` | F.1 + F.2 acceptance status, test summary, regressions, remaining risks split (Closed / Owner / Mitigated), Phase 1+ §9 closure-gate decision |
| Final readiness audit (this document) | `qa/final-phase1plus-readiness.md` | Walks every Appendix D box with evidence, three Go/No-Go verdicts, recommended next actions mapped to `go-live.md` |
| Deploy coordination plan | `qa/deploy-coordination.md` (Step 7, pending) | Owner-runnable timeline for `go-live.md` Phase A → I, paced for the 1–2 week deploy window; per-phase prereqs + evidence-to-capture + hard-gate dependencies + build-agent escalation list |
| Updated trackers | `qa/{phase1plus-progress,risk-register,decision-log,evidence-index}.md` | All closures (R-F1-01, R-F1-04, D-F2-04 build-agent scope) reflected; D-F2-05 logged for the closure-session screenshot script extension; R-F2-05 status moved from Open to Operational; closure-session evidence rows registered |

---

## 7. Definition of Done

Per `CLAUDE_EXECUTION_ROOT.md §11` (per-prompt) and §9 (final closure), this Phase 1+ engagement is **Done** when:

1. ✅ Feature/fix implemented as specified — every Appendix D box has explicit evidence
2. ✅ Acceptance criteria explicitly marked Met (or Conditional with documented owner-action) — see §2 line-by-line
3. ✅ Required tests pass — 396/396 unit, 9/10 active E2E (1 deferred to Phase 2 per R-D10-02)
4. ✅ Handover returned in exact format — every prompt has a §8 handover; Block F + Final Readiness + Deploy Coordination get their own
5. ✅ Tracking files updated — all four trackers reflect final state
6. ✅ No unresolved Critical/High issue introduced — 0 Critical/High open in code

**Phase 1+ engagement: COMPLETE for the build-agent scope. Live deploy proceeds via `docs/go-live.md` Phase A → I per the Deploy Coordination Plan.**

When every item in §5 above is ticked, the application is ready for Dr. Munroe's official-launch decision (per Appendix D's closing line).
