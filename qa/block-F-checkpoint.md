# Block F Checkpoint
**Date:** 2026-05-09
**Block:** F (F.1, F.2) + closure session (Steps 1–4 of 2026-05-09 closure)
**Status:** ✅ CLEARED — Phase 1+ §9 final-readiness gate open; deploy gated only on owner-action items

---

## 1. Completed Prompts

| Prompt | Title | Commits | Unit Tests at Completion |
|---|---|---|---|
| F.1 | Production build hardening | `c6aae9c`, `169d11a`, `30ea556` | 396/396 |
| F.2 | PWA and Play Store packaging | `e2c520c` | 396/396 |
| Closure | PRE-3 lint fix (R-F1-01) | `ff23fa7` | 396/396 |
| Closure | website/qa/ dedupe (R-F1-04) | `04982a6` | 396/396 |
| Closure | Auth-screenshot script extension (D-F2-04) | `6502eb3` | 396/396 |
| Closure | R-F2-05 SW VERSION verification | (no commit — verification only) | 396/396 |

**Final unit baseline:** **396/396 passing** through every step. No drift introduced by F.1, F.2, or any of the four closure-session steps.

---

## 2. Acceptance Status Per Prompt

### F.1 — Production build hardening

| AC | Verdict | Evidence | Notes |
|---|---|---|---|
| AC1 — `pnpm build` zero warnings | ✅ Met | `qa/f1-build.txt` | Achieved by removing deprecated `disableLogger` from `withSentryConfig` per D-F1-02 |
| AC2 — Content-Security-Policy header live | ✅ Met | `qa/headers-scan-f1.txt`; `website/next.config.ts` | Full CSP composition logged in D-F1-01 (Clerk, Sentry, Upstash, storage hosts; `'unsafe-inline'` retained per playbook §F.1 step 3) |
| AC3 — Five other security headers live | ✅ Met | `qa/headers-scan-f1.txt` | HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy — all confirmed |
| AC4 — `.env.example` audited | ✅ Met | F.1 commit `c6aae9c` | Added `NEXT_PUBLIC_APP_URL`, `IMPORT_MAX_ROWS`, `CRON_SECRET`; one PRE-3 line bundled (R-F1-02 disclosed) |
| AC5 — Production deploy runbook | ✅ Met | `website/docs/production-deploy.md` | Pre-deploy / deploy / post-deploy / rollback / pending-owner-action sections |
| AC6 — Smoke flows + securityheaders.com A grade | ⚠️ Conditional | R-F1-03; `production-deploy.md` §5 | Owner-only — requires deployed staging URL. Same precedent as D-D12-01 (restore drill). |

### F.2 — PWA and Play Store packaging

| AC | Verdict | Evidence | Notes |
|---|---|---|---|
| AC1 — PWA installable (manifest + SW + offline) | ✅ Met | `qa/f2-endpoint-scan.txt`; `app/manifest.ts`; `public/sw.js`; `app/offline/page.tsx` | Hand-rolled service worker chosen over `next-pwa`/`@serwist` per D-F2-01; eight PWA endpoints serve 200 with full security headers |
| AC2 — Signed AAB on test Android device | ⚠️ Conditional | R-F2-01; `docs/play-store.md §2–§6`; `docs/go-live.md` Phase F | Owner-only — JDK + keytool + Android signing keystore. Bubblewrap runbook complete. Same precedent as D-D12-01 / R-F1-03. |
| AC3 — Listing assets brand-correct (≥4 1080×1920 screenshots, icon, feature graphic) | ✅ Met (4/7) → ⚠️ Conditional (7/7) | `marketing/play-store/screenshots/` (4 PNGs); `marketing/play-store/{icon-512,feature-graphic}.png` | 4 public-renderable shots delivered (sign-in / privacy / terms / offline). Closure session `6502eb3` extended `scripts/capture-play-store-screenshots.ts` for the remaining 3 (dashboard / treasury / announcement) gated behind `SCREENSHOT_INCLUDE_AUTHENTICATED=1`; capture run is owner-only against `pnpm dev` (D-F2-04 / D-F2-05). 4/7 meets Play Console minimum; 7/7 once owner runs the script. |
| AC4 — `docs/play-store.md` complete runbook | ✅ Met | `website/docs/play-store.md` | §0–§11 cover prerequisites, Bubblewrap install/init/build, key management, Asset Links, Play Console upload, content rating, Data Safety, target audience, AAB tracks, post-submission, rollback, common rejection reasons |
| AC5 — Privacy + Terms drafts live at `/privacy` + `/terms` | ✅ Met (drafts) → ⚠️ Conditional (counsel-approved) | R-F2-03; `website/legal/{privacy,terms}.md`; `app/{privacy,terms}/page.tsx` | Drafts render with "DRAFT — pending counsel review" banner per D-F2-02. Counsel review is owner-action — same precedent as R-F2-01 / R-F1-03. |
| AC6 — Asset Links template + TWA manifest | ✅ Met (templates) → ⚠️ Conditional (signed fingerprint) | R-F2-02; `website/public/.well-known/assetlinks.json`; `marketing/play-store/twa-manifest.json` | Templates ship with placeholder SHA-256; owner replaces post-`bubblewrap build`. Procedure documented in `play-store.md` §5. |

### Closure session — Steps 1–4

| Step | Verdict | Evidence | Notes |
|---|---|---|---|
| Step 1 — PRE-3 lint fix (R-F1-01) | ✅ Met | `ff23fa7`; `qa/f3-{lint,test,typecheck,build}.txt` | Lint exit 0 (was exit 1); 0 errors (was 1); 1 pre-existing imports.ts warning unchanged. R-F1-01 marked Resolved. |
| Step 2 — website/qa/ dedupe (R-F1-04) | ✅ Met | `04982a6`; root `qa/` 35 entries unchanged before/after | 4 files + 1 dir deleted; 187 lines from HEAD-tracked content removed. R-F1-04 marked Resolved. |
| Step 3 — Auth-screenshot script extension (D-F2-04) | ✅ Met (script) / ⚠️ Conditional (capture run) | `6502eb3`; `scripts/capture-play-store-screenshots.ts` | Script extended with three authenticated shot definitions opt-in via `SCREENSHOT_INCLUDE_AUTHENTICATED=1`; capture run is owner-only against `pnpm dev` per the in-script docblock. Newly surfaced constraint documented: `/api/auth/token` short-circuits in `NODE_ENV=production` (D-F2-05). |
| Step 4 — R-F2-05 SW VERSION verification | ✅ Met | `qa/risk-register.md` R-F2-05 reworded | `.github/workflows/` has only `e2e.yml` (no release CI); `play-store.md §9 step 4` is canonical for future-release SW VERSION bumps; status moved from "Open" to "Operational". |

**Summary:** 2/2 prompts conditionally Met (F.1 + F.2; conditions are owner-action items). All four closure-session steps Met or Met-with-owner-action. No prompt blocked. No regression introduced.

---

## 3. Test Summary

### Unit Tests (Vitest)
- **Final baseline:** **396/396 passing** (43 test files)
- **Drift through F.1 → F.2 → closure Steps 1–4:** zero
- **Closure verification (Step 5):** 396/396 passing — re-run captured `qa/f3-test.txt` (Step 1) is still authoritative; subsequent steps did not modify runtime code

### Build (`pnpm build`)
- **Status:** clean, zero warnings (`qa/f1-build.txt`, `qa/f2-build.txt`, `qa/f3-build.txt`)
- **Routes:** 40 prerendered + middleware
- Steps 2/3/4 did not change build output (Step 2 deleted docs, Step 3 modified a non-build script, Step 4 was tracker-only)

### Typecheck (`pnpm typecheck`)
- **Status:** exit 0 across F.1, F.2, and all four closure steps (`qa/f1-typecheck.txt`, `qa/f2-typecheck.txt`, `qa/f3-typecheck.txt`, plus Step 5 closure re-run)

### Lint (`pnpm lint`)
- **F.1 / F.2 baseline:** **exit 1** — 1 error + 1 warning (1 PRE-3 error in `access-callback-client.tsx`, 1 unrelated unused-import warning in `app/(admin)/_actions/imports.ts`)
- **Post-Step 1:** **exit 0** — 0 errors + 1 unchanged pre-existing imports.ts warning
- **Closure verification (Step 5):** identical to post-Step 1 (`qa/f3-lint.txt` still authoritative)
- **Net change:** strict improvement; the imports.ts warning is unrelated to F.1/F.2 scope and carried forward as a minor follow-up

### E2E Tests (Playwright)
- **Suite location:** `website/tests/e2e/` (10 spec files)
- **Active specs (8):** unchanged from Block D / E checkpoints — auth-sign-in-each-role, voucher-redemption, settlement-approval, property-transfer, voting, bulk-import-members, emergency-broadcast, mfa-enrol
- **Closure-session additions:** none (closure work was code-clean / docs / scripts)
- **Skipped specs (2):** `ledger-transfer.spec.ts` (R-D10-02 — no resident-to-resident KCRD transfer UI in Phase 1+) and `rental-extension.spec.ts` was previously test 7 — implemented in C.3 closure (`9e2cd3f`); now active under `c3-rental-extensions.spec.ts`. The remaining skipped spec is ledger-transfer only.
- **CI:** `.github/workflows/e2e.yml` configured (R-D10-01 — owner provisions GitHub repo secrets)

### Endpoint Scan (production build)
- **F.2 baseline (`qa/f2-endpoint-scan.txt`):** 8 PWA endpoints (`/manifest.webmanifest`, `/sw.js`, `/.well-known/assetlinks.json`, `/privacy`, `/terms`, `/offline`, `/icons/icon-192.png`, `/icons/icon-512-maskable.png`) all return 200 with all 6 security headers + CSP
- Closure session did not change endpoint serving or routing

---

## 4. Regressions and Cross-Cutting Fixes

| Fix / Resolution | Step | Description |
|---|---|---|
| PRE-3 `react-hooks/set-state-in-effect` regression | Closure Step 1 | Pre-existing regression in `access-callback-client.tsx` (introduced after E.4 by uncommitted PRE-3 demo work) resolved by deriving the missing-ticket error at render time. Lint exit 1 → exit 0. |
| Stale `website/qa/` tracker tree | Closure Step 2 | `website/qa/{decision-log,evidence-index,phase1plus-progress,risk-register}.md` + `codex-review/` deleted; root `COK-City-of-Karis/qa/` is canonical. Resolves R-F1-04 (D-F1-03 single-source-of-truth decision). |

**No new regressions introduced by F.1, F.2, or any closure step.** The PRE-3 lint fix is the only code change to the runtime tree across the entire Block F + closure period beyond F.1's `next.config.ts` / `.env.example` / deprecated-flag work and F.2's PWA / legal / TWA assets.

The pre-existing imports.ts unused-import warning (1 lint warning, unrelated to PRE-3) is **carried forward** as a minor non-blocking follow-up. It was present before F.1, was preserved through F.1 and F.2, and remains present after closure Step 1. Resolution is a single-line import removal in a future maintenance pass.

---

## 5. Remaining Risks and Blockers

### Closed this closure session (2026-05-09)

| Risk / Decision | Status | Commit | Notes |
|---|---|---|---|
| R-F1-01 | Resolved | `ff23fa7` | PRE-3 lint regression in `access-callback-client.tsx` cleared by render-time derivation of the no-ticket error |
| R-F1-04 | Resolved | `04982a6` | Stale `website/qa/` tree deleted; root `qa/` canonical |
| D-F2-04 (build-agent scope) | Resolved | `6502eb3` | `scripts/capture-play-store-screenshots.ts` extended for three authenticated shots; opt-in via `SCREENSHOT_INCLUDE_AUTHENTICATED=1` |
| R-F2-05 status | Verified Operational | (no commit) | Release-checklist mitigation in `play-store.md §9 step 4` confirmed; no release CI workflow exists; bump remains owner-driven per release |

### Owner-action items (gate the live deploy)

These are the items that block flipping the Play Store production track to live. All have a documented procedure; none require additional engineering work.

| Risk | Description | Documented Procedure |
|---|---|---|
| R-D12-01 | Restore drill against live Supabase | `docs/backup-and-restore.md` §5–§6; `go-live.md` Phase C step C7 |
| R-F1-03 | Smoke flows + `securityheaders.com` A-grade scan against deployed staging | `docs/production-deploy.md` §3.3 + §5; `go-live.md` Phase C step C2 |
| R-F2-01 | Bubblewrap signed AAB build on JDK-equipped workstation | `docs/play-store.md` §2–§6; `go-live.md` Phase F |
| R-F2-02 | `assetlinks.json` SHA-256 fingerprint update post-`bubblewrap build` | `docs/play-store.md` §5; `go-live.md` Phase F step F6 |
| R-F2-03 | Counsel review of `legal/privacy.md` and `legal/terms.md` | `go-live.md` Phase E (gating Play Store production track per H3) |
| D-F2-04 (capture step) | Run `SCREENSHOT_INCLUDE_AUTHENTICATED=1 pnpm pwa:screenshots` against `pnpm dev` to capture dashboard / treasury / announcement | In-script docblock of `scripts/capture-play-store-screenshots.ts` (commit `6502eb3`) |
| Operational — Redis | Provision `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in production env (R-D9-01) | `go-live.md` Phase A step A3 |
| Operational — Supabase Pro | Upgrade to Pro plan for 7-day PITR (R-D12-02) | `go-live.md` Phase A step A6 |
| Operational — Storage encryption key | `openssl rand -hex 32` + password manager + offline backup (R-D11-01 / R-D12-03) | `go-live.md` Phase A step A5 |
| Operational — System wallet floors | Master Admin sets floors in `/admin/treasury` (R-D14-01) | `go-live.md` Phase C step C8 |
| Operational — Clerk MFA strategy | Enable backup-code MFA in Clerk dashboard (R-D3-02) | `go-live.md` Phase A step A2 |
| Operational — `pnpm approve-builds` in CI | Approve `@sentry/cli` for source map upload (R-D8-01) | `production-deploy.md` |
| Operational — Resend domain DNS | SPF / DKIM / DMARC for production sending domain (R-A1-01) | `go-live.md` Phase A step A1; `docs/email-setup.md` |
| Operational — GitHub repo secrets for E2E CI | Clerk + DB secrets for `e2e.yml` (R-D10-01) | `docs/testing.md` |

### Mitigated / operational (no block)

| Risk | Status | Notes |
|---|---|---|
| R-F2-04 | Mitigated | `sharp` install verified working in F.2 session; added to `pnpm.onlyBuiltDependencies` |
| R-F2-05 | Operational | SW VERSION bump documented in `play-store.md §9 step 4`; owner-driven per release; no CI gate (Phase 2 hardening idea logged in risk register) |
| R-E2-01 (xlsx HIGH) | Accepted with compensating controls | MASTER_ADMIN-only upload, 3/hr rate limit, 64MB cap |
| R-E2-02 (effect HIGH transitive) | Accepted | Not invoked by `@uploadthing` in our usage pattern |
| R-E2-03 (dev-time moderates) | Accepted | All paths are dev-only or build-time; not in production runtime |
| R-E3-01 (`karis-stone-500` contrast) | Open — partial fix | Two highest-impact instances fixed in E.3; remaining usages in authenticated UI tracked for future pass |
| R-E3-02 / R-E3-03 | Mitigated / Open low | E.3 acceptance findings; no blocker |
| R-F1-02 (`.env.example` PRE-3 line) | Mitigated — disclosed | F.1 commit bundled one PRE-3 line that was already in working tree |

### Ledger-transfer E2E (R-D10-02)

`tests/e2e/ledger-transfer.spec.ts` remains skipped because Phase 1+ does not ship a resident-to-resident KCRD transfer UI. Phase 2 work. Documented in `docs/testing.md` and the risk register; not a Block F blocker.

---

## §9 Phase 1+ Closure Gate Decision

| Gate Condition | Status |
|---|---|
| All F.1 + F.2 acceptance criteria met or conditionally met | ✅ Met |
| All build-agent-deliverable scope of Block F closed | ✅ Met (Steps 1–4 of closure session) |
| Test suite passing | ✅ 396/396 unit; 8/9 active E2E specs (1 deferred — R-D10-02) |
| Build clean, zero warnings | ✅ TypeScript strict, no warnings |
| Lint exit 0 | ✅ Closure session resolved the only outstanding error; 1 pre-existing unrelated warning carried forward |
| No unresolved Critical/High regression | ✅ None introduced |
| Block checkpoint document produced | ✅ This document |
| Tracker hygiene | ✅ R-F1-01, R-F1-04 closed; D-F2-04 build-agent scope closed; D-F2-05 logged; trackers reflect closure-session activity |
| Owner-action items documented and gated | ✅ All listed in §5 above with documented procedure paths |

**Ruling: Phase 1+ §9 final-readiness gate may proceed.** Block F's build-agent-deliverable scope is fully closed. The owner-action items in §5 above gate the live deploy via `docs/go-live.md` Phase A → I; none are blocked on additional engineering.

**Recommended verdict for the §9 final readiness audit (Step 6):**
- Phase 1+ implementation readiness: **Go**
- Production deployment readiness: **Conditional Go** (gated on Phase A → C of `go-live.md` plus E.4 / E.2 owner items)
- Play Store submission readiness: **Conditional Go** (gated on Phase F → G of `go-live.md` plus counsel-approved legal text)
