# City of Karis — Project Handover (Phase 1 → Phase 1+ closure)

**Document version:** 1.1 (post-merge)
**Generated:** 2026-05-09
**Project:** COK Community App (web + planned mobile/TWA)
**Audience:** Project owner, future build sessions (Claude Code, CODEX, etc.), engineering successors
**Purpose:** Single source of truth for picking up the project at any future point. Every key path, every commit, every decision, every authoritative document is referenced from here.

> **Repo orientation:** This document was originally written when the project lived in two trees — a Next.js git repo at `COK-City-of-Karis/website/` and an outer non-git tree at `COK-City-of-Karis/` containing the playbook, trackers, audits, and assets. As of the GitHub-publication merge (2026-05-09), **everything is in this single repo** at the root. Path references like `website/foo` in the original handover prose now refer to `foo` at the repo root; references like `COK-City-of-Karis/qa/bar` now refer to `qa/bar`. Markdown link targets in this document have been bulk-updated to the new structure. Where the prose still says "COK root" or "website tree", read it as "this repo's root".
>
> **TL;DR for a new session:** Open this file, read §13. It tells you exactly what to read in what order to be productive in five minutes.

---

## 1. Quick orientation

City of Karis ("COK") is a Next.js + TypeScript community admin and resident app for a Guyanese real-estate development community. Phase 1 (Jan–Apr 2026) shipped the foundational system. Phase 1+ (Apr–May 2026) layered production-readiness, quality gates, and Play Store packaging on top.

**Current state (2026-05-09):** Phase 1+ engineering is **complete for build-agent scope**. The application is **not yet deployed to production** — the live URL gets created when the project owner runs the operational provisioning + first-deploy sequence in [`website/docs/go-live.md`](docs/go-live.md). That run is paced for a 1–2 working-week window per [`qa/deploy-coordination.md`](qa/deploy-coordination.md).

| Stat | Value |
|---|---|
| First commit | `13213ec` (Initial commit from Create Next App) |
| Current HEAD | `6502eb3` (closure-session screenshot script extension, 2026-05-09) |
| Total commits | 53 |
| Branch | `master` only |
| GitHub remote | **None configured** — repo is local-only on this machine |
| Latest unit test baseline | 396/396 passing |
| Latest build status | zero-warning |
| Latest lint status | exit 0 (1 carried-forward unrelated warning in `app/(admin)/_actions/imports.ts`) |
| Phase 1+ §9 verdicts | Implementation **Go**; Production deploy **Conditional Go**; Play Store **Conditional Go** |

---

## 2. Repository info

### Local layout

The project root is **not** the COK-City-of-Karis folder itself — it's a multi-app monorepo-style layout. The git repo lives only inside `website/`:

```
c:\Users\infin\OneDrive\White Dragon\Claude Main\COK-City-of-Karis\
├── COK-Phase1Plus-ClaudeCode-Playbook.md   # the authoritative product spec
├── CLAUDE_EXECUTION_ROOT.md                # the execution protocol (§5/§9/§11)
├── CLAUDE.md                               # design standards + skill invocations
├── PROJECT-HANDOVER.md                     # ← this file
├── brand_assets/                           # logos, palettes, brand guide
├── reference/                              # wireframes, screenshots, content briefs
├── docs/phase1plus/                        # per-prompt protocol files
├── marketing/play-store/                   # Play Console listing assets
├── qa/                                     # ← canonical tracker tree (NOT in git)
└── website/                                # ← the only git repo (master branch)
    ├── app/                                # Next.js 16 App Router
    │   ├── (admin)/                        # admin route group
    │   ├── (auth)/                         # sign-in / sign-up
    │   ├── (resident)/                     # resident route group
    │   ├── access/                         # demo ticket-auth flow
    │   ├── api/                            # route handlers (auth, webhooks, attachments, cron, sentry-test)
    │   ├── demo/                           # public showcase routes (no auth)
    │   ├── offline/                        # PWA fallback page
    │   ├── privacy/                        # legal page (markdown-rendered)
    │   ├── terms/                          # legal page (markdown-rendered)
    │   ├── manifest.ts                     # PWA manifest
    │   ├── layout.tsx                      # root layout
    │   └── ...
    ├── components/                         # shared React components
    ├── lib/                                # business logic
    │   ├── audit/, currency/, demo/, demo-mode.ts, email/, imports/, lease/,
    │   ├── ledger/, mfa/, queries/, rate-limit/, sentry.ts, storage/, tour/,
    │   └── visitor-groups/
    ├── prisma/
    │   ├── schema.prisma                   # data model
    │   └── migrations/                     # 7 phase1+ migrations + earlier baseline
    ├── public/
    │   ├── icons/                          # 5 PWA PNGs
    │   ├── sw.js                           # hand-rolled service worker (D-F2-01)
    │   └── .well-known/assetlinks.json     # TWA Asset Links (placeholder fingerprint)
    ├── scripts/
    │   ├── generate-pwa-icons.ts
    │   ├── generate-feature-graphic.ts
    │   ├── capture-play-store-screenshots.ts  # extended for auth in 6502eb3
    │   ├── preview-emails.ts
    │   └── seed/                           # demo data seeders
    ├── docs/                               # owner-facing runbooks
    │   ├── go-live.md                      # master Phase A → I runbook
    │   ├── production-deploy.md            # web-side deploy
    │   ├── play-store.md                   # mobile/TWA submission
    │   ├── play-store-data-safety.md       # Play Console Data Safety form
    │   ├── backup-and-restore.md           # D.12 runbook
    │   ├── observability.md                # Sentry setup
    │   ├── data-protection.md              # storage encryption + audit + GDPR posture
    │   ├── mfa.md                          # Clerk MFA strategy + setup
    │   ├── email-setup.md                  # Resend domain + DNS
    │   ├── testing.md                      # E2E setup + add-a-test guide
    │   ├── cron.md                         # cron entries + secret
    │   ├── currency-and-promotions.md      # C.1 model
    │   ├── demo-showcase.md                # /demo/* design notes
    │   ├── E.4.md                          # code quality sweep notes
    │   └── phase1plus/prompts/{B.3,C.2,F.1,F.2}.md  # per-prompt protocol artifacts
    ├── tests/e2e/                          # 10 Playwright spec files
    ├── legal/                              # privacy + terms markdown drafts
    ├── eslint.config.mjs, vitest.config.ts, playwright.config.ts, tsconfig.json,
    │   next.config.ts, prisma.config.ts, package.json
    └── AGENTS.md                           # "this is NOT the Next.js you know" — Next 16 caveats
```

### GitHub / remote info

There is **no GitHub remote configured** on this repo. `git remote -v` returns empty. The repo exists only at the local path above. To make this a GitHub-tracked project:

```bash
cd "c:/Users/infin/OneDrive/White Dragon/Claude Main/COK-City-of-Karis/website"
gh repo create cityofkaris/cok-app --private --source=. --remote=origin --push
# or
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin master
```

This is **owner action** — not part of Phase 1+ scope and not blocking deploy.

---

## 3. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16.2.4** App Router (Turbopack) | See `website/AGENTS.md` — the API surface differs from Next 14/15 in ways that aren't in older training data |
| Runtime | React 19.2.4 | Includes React Compiler ESLint rules — surfaced the PRE-3 regression |
| Language | TypeScript strict | `tsc --noEmit` is the typecheck |
| Styling | Tailwind v4 + `tw-animate-css` | Custom Karis design tokens (no default indigo/blue/gray) |
| Component primitives | shadcn/ui + `@base-ui/react` | Custom `Modal` primitive (`components/ui/modal.tsx`) enforces §4.4 spacing |
| Icons | `lucide-react` | |
| Forms | React Hook Form + Zod | |
| Auth | **Clerk** (`@clerk/nextjs@7.2.7`) | TOTP MFA enforced for MASTER_ADMIN/ADMIN; webhook handler in `app/api/webhooks/clerk/` |
| Database | **Postgres on Supabase** + **Prisma 7.8.0** | `prisma/schema.prisma`; 7 Phase 1+ migrations |
| Email | **Resend** + `@react-email` | `lib/email/service.ts`; 8 templates; chunked 50/batch broadcast |
| File storage | **Custom encrypted driver** (D.11) | `lib/storage/driver.ts` — Local AES-256-GCM + S3 SSE-S3; HMAC-signed URLs |
| Rate limiting | **Upstash Redis** + in-memory fallback | `lib/rate-limit/index.ts` |
| Observability | **Sentry** (`@sentry/nextjs@10.50.0`) | `sentry.{client,server,edge}.config.ts`; PII scrub in `beforeSend` |
| Spreadsheet | `xlsx@0.18.5` | HIGH advisories accepted with compensating controls (R-E2-01) |
| Tests | **Vitest 4** (unit, 396/396) + **Playwright 1.59.1** (E2E, 9 active / 1 deferred) | |
| Lint | ESLint 9 + `eslint-config-next` + React Compiler rules | |
| PWA | Hand-rolled `public/sw.js` (D-F2-01) | No `next-pwa` / `@serwist` (Turbopack + Sentry coupling risk) |
| Image generation | `sharp@0.34.4` | PWA icons + Play Store feature graphic |
| Mobile (planned) | TWA via Bubblewrap CLI | Owner action; runbook at `website/docs/play-store.md` |

---

## 4. Project structure — where things live

| Concern | Path | Owner |
|---|---|---|
| Product spec | [`COK-Phase1Plus-ClaudeCode-Playbook.md`](COK-Phase1Plus-ClaudeCode-Playbook.md) | Authoritative |
| Execution protocol | [`CLAUDE_EXECUTION_ROOT.md`](CLAUDE_EXECUTION_ROOT.md) | Authoritative |
| Design + skill rules | [`CLAUDE.md`](CLAUDE.md) | Authoritative (project root) |
| Brand voice / UI rules | [`website/CLAUDE.md`](CLAUDE.md) → [`website/AGENTS.md`](AGENTS.md) | Authoritative |
| Source code | [the repo root (this directory)](.) | Git tree (master) |
| Trackers (canonical) | [`qa/`](qa/) | Root tree (NOT in git, per F.1/F.2 precedent — D-F1-03) |
| Per-prompt protocol files | [`docs/phase1plus/prompts/`](docs/phase1plus/prompts/) | Root tree |
| Owner runbooks | [`website/docs/`](docs/) | Git tree |
| Listing assets (Play Store) | [`marketing/play-store/`](marketing/play-store/) | Root tree (icons + screenshots + listing copy) |
| Brand assets | [`brand_assets/`](brand_assets/) | Root tree |

### Why two `qa/` were a problem (and aren't anymore)

Through Block D and into E.4, two parallel tracker trees existed: `qa/` (root, outside git) and `website/qa/` (inside git, but stale). Decision **D-F1-03** declared the root tree canonical; risk **R-F1-04** captured the divergence; closure-session commit **`04982a6`** deleted the stale tree. Going forward: **only `qa/` (root) is the canonical tracker location**.

---

## 5. Phase history overview

```
Phase 0 (pre-Phase-1):   13213ec  Initial commit from Create Next App
                         (8 sessions of foundational work, retroactively documented)

Phase 1 — Critical fixes + brand consistency
   Block A — A.1, A.2, A.3              e999a49 + 6b893d8     (2026-04-28)
   Block B — B.1, B.2, B.3              19fe49f + fd1db6c     (2026-04-28)
   Phase 1 baseline:                    141/141 unit tests passing

Phase 1+ — Production hardening
   Block C — New functional requirements
      C.1 multi-currency                2d6ec95               (2026-04-28)
      C.2 visitor groups                76c273b → a176007     (2026-04-29 / 2026-05-08)
      C.3 rental cycle                  4df41fc → 7a477d2 → 9e2cd3f  (2026-04-29 / 2026-05-08)
   Block D — Hardening (D.1–D.15)       b84c926 → be788f5     (2026-04-29)
   Block E — Quality gates
      E.1 function test sweep           (no commit — qa/function-test-report.md)
      E.2 security                      95a192c               (2026-05-08)
      E.3 UX/a11y                       4e54eb5               (2026-05-08)
      E.4 code quality                  192cf7b               (2026-05-08)
   Block F — Production readiness
      F.1 build hardening               c6aae9c, 169d11a, 30ea556  (2026-05-09)
      F.2 PWA + Play Store              e2c520c               (2026-05-09)

Pre-3 / demo-flow side stream — interleaved Apr–May 2026
   /demo public showcase                7dbf851, 912f8b8, 3feeefa, d6df710,
                                        b9aa497, 049b027, 82a6412, 1cde23f,
                                        387f237, d5ef1da, bda870b, 004eaf4,
                                        7e0391e, cfcb091
   (Phase 1+-adjacent improvements that were not part of the prompt sequence;
    documented as PRE-3 in F.1's commit-scope decision D-F1-03)

Closure session (2026-05-09, end of Phase 1+)
   Step 1   ff23fa7  fix(access): PRE-3 lint regression (R-F1-01)
   Step 2   04982a6  chore(qa): remove stale website/qa/ (R-F1-04)
   Step 3   6502eb3  feat(scripts): authenticated screenshot capture path (D-F2-04)
   Step 4   (no commit — R-F2-05 verification)
   Step 5   qa/block-F-checkpoint.md           (mirrors block-D format)
   Step 6   qa/final-phase1plus-readiness.md   (§9 audit)
   Step 7   qa/deploy-coordination.md          (owner companion plan)
```

---

## 6. Per-prompt log

This is the comprehensive map. Every Phase 1+ prompt with commit, files, evidence, and decisions. Use it to answer "where does feature X live?" or "what was decided about Y?"

For Phase 1 (A + B blocks), the protocol files were not produced in-session; the entries below were retroactively documented from git log + 141-test baseline.

### Block A — Phase 1 critical fixes (2026-04-28)

| Prompt | Commit | Key files | Evidence |
|---|---|---|---|
| A.1 — Resend transactional email | `e999a49`, `6b893d8` | [website/lib/email/service.ts](lib/email/service.ts), [website/lib/email/templates/](lib/email/templates/) (8 react-email templates), [website/app/(admin)/admin/email-log/](app/(admin)/admin/email-log/) | `pnpm test` 141/141; live sending requires DNS verification (R-A1-01) |
| A.2 — Fee schedule editor | `e999a49`, `6b893d8` | [website/app/(admin)/admin/settings/_components/fee-schedule-editor.tsx](app/(admin)/admin/settings/_components/fee-schedule-editor.tsx), [website/lib/ledger/__tests__/fee-schedule.test.ts](lib/ledger/__tests__/fee-schedule.test.ts) | History + audit; per-fee active-from validation |
| A.3 — Approvals Center tabs | `e999a49`, `6b893d8` | [website/app/(admin)/admin/approvals/_components/{transfer-dialogs,voucher-request-dialogs}.tsx](app/(admin)/admin/approvals/_components/) | Settlements / Property Transfers / Vouchers all functional; rental extensions tab added in C.3 |

### Block B — Brand & UI consistency (2026-04-28)

| Prompt | Commit | Key files | Decisions |
|---|---|---|---|
| B.1 — Brand sign-in | `e999a49`, `6b893d8` | [website/app/(auth)/sign-in/[[...sign-in]]/_components/{sign-in-form,demo-block}.tsx](app/(auth)/sign-in/[[...sign-in]]/_components/) | Demo block env-gated by `NEXT_PUBLIC_DEMO_MODE_ENABLED` |
| B.2 — Modal primitive | `19fe49f` | [website/components/ui/modal.tsx](components/ui/modal.tsx), [website/components/ui/__tests__/modal.test.ts](components/ui/__tests__/modal.test.ts) | D-B2-01: created Modal primitive; migrated all Dialog/AlertDialog uses |
| B.3 — Intake form completion | `fd1db6c` | [website/lib/storage/attachments.ts](lib/storage/attachments.ts), 7 forms + 6 actions, [website/lib/storage/__tests__/attachments.test.ts](lib/storage/__tests__/attachments.test.ts) | D-B3-01: UploadThing chosen for Phase 1; superseded by D.11 driver in Phase 1+ |

### Block C — New functional requirements

| Prompt | Commit | Key files | Tests at completion |
|---|---|---|---|
| C.1 — Multi-currency + rate editor + bonuses | `2d6ec95` | [website/lib/currency/](lib/currency/) (rate-resolver, promotion-resolver, format-amount, conversion-engine), [website/app/(admin)/admin/settings/{currency,promotions}/page.tsx](app/(admin)/admin/settings/), [website/components/admin/k-amount.tsx](components/admin/k-amount.tsx) | 165/165 |
| C.2 — Visitor Groups | `76c273b` (initial) → `a176007` (closure) | [website/app/(admin)/admin/visitors/groups/](app/(admin)/admin/visitors/groups/), [website/app/(admin)/_actions/visitor-groups.ts](app/(admin)/_actions/visitor-groups.ts), [website/lib/auth.ts](lib/auth.ts) `denyIfVisitor()`, [website/tests/e2e/c2-visitor-groups.spec.ts](tests/e2e/c2-visitor-groups.spec.ts) | 367/367 |
| C.3 — Rental cycle + extension | `4df41fc` → `7a477d2` → `9e2cd3f` (closure activated E2E) | [website/lib/lease/cycle.ts](lib/lease/cycle.ts), [website/app/(resident)/property/_components/{tenancy-status-card,extension-request-modal}.tsx](app/(resident)/property/_components/), [website/app/(admin)/_actions/rental-extensions.ts](app/(admin)/_actions/rental-extensions.ts), [website/app/api/cron/leases/route.ts](app/api/cron/leases/route.ts), [website/tests/e2e/c3-rental-extensions.spec.ts](tests/e2e/c3-rental-extensions.spec.ts), [website/tests/e2e/rental-extension.spec.ts](tests/e2e/rental-extension.spec.ts) | 373/373 |

**Block C checkpoint:** [`qa/block-C-checkpoint.md`](qa/block-C-checkpoint.md). Notable: protocol deviation **D-SEQUENCE-01** (Block D ran before C.2/C.3 finished) was logged and resolved.

### Block D — Phase 1+ hardening (2026-04-29)

| Prompt | Commit | Key files |
|---|---|---|
| D.1 — Bulk member import | `b84c926` | [website/lib/imports/members-parser.ts](lib/imports/members-parser.ts), [website/app/(admin)/admin/imports/members/](app/(admin)/admin/imports/members/), template route, preview/commit pages |
| D.2 — Bulk property import | `1a8ba8d` | [website/lib/imports/properties-parser.ts](lib/imports/properties-parser.ts), companion zip via UTApi |
| D.3 — MFA enforcement | `802fe1f` | [website/lib/mfa/index.ts](lib/mfa/index.ts), [website/app/(admin)/layout.tsx](app/(admin)/layout.tsx), [website/app/(account)/account/mfa-enroll/](app/(account)/account/mfa-enroll/), [website/docs/mfa.md](docs/mfa.md) |
| D.4 — Audit log + Data Directory | `ac0ce41` | [website/lib/audit/index.ts](lib/audit/index.ts), [website/lib/queries/{audit-log,data-directory}.ts](lib/queries/), [website/app/(admin)/admin/{audit-log,data-directory}/](app/(admin)/admin/), JSON-diff inspector, ZIP export |
| D.5 — Treasury reconciliation | `2750ec0` | [website/lib/ledger/reconciliation-report.ts](lib/ledger/reconciliation-report.ts), [website/app/api/cron/reconciliation/route.ts](app/api/cron/reconciliation/route.ts), [website/components/admin/reconciliation-alert-banner.tsx](components/admin/reconciliation-alert-banner.tsx) |
| D.6 — Emergency broadcast | `7c489b0` | [website/lib/queries/broadcast.ts](lib/queries/broadcast.ts), [website/app/(admin)/admin/broadcast/](app/(admin)/admin/broadcast/), [website/components/shared/emergency-broadcast-banner.tsx](components/shared/emergency-broadcast-banner.tsx) |
| D.7 — Onboarding tour | `b8313cb` | [website/lib/tour/steps.ts](lib/tour/steps.ts), [website/components/shared/{onboarding-tour,tour-provider,tour-trigger-button}.tsx](components/shared/) |
| D.8 — Sentry monitoring | `fdf8ad5` | [sentry.client.config.ts](sentry.client.config.ts), [sentry.server.config.ts](sentry.server.config.ts), [sentry.edge.config.ts](sentry.edge.config.ts), [instrumentation.ts](instrumentation.ts), [lib/sentry.ts](lib/sentry.ts), error boundaries, [app/api/sentry-test/route.ts](app/api/sentry-test/route.ts), [docs/observability.md](docs/observability.md) |
| D.9 — Rate limiting | `a6d2f98` | [website/lib/rate-limit/index.ts](lib/rate-limit/index.ts), [website/proxy.ts](proxy.ts), per-action limits in 3 actions |
| D.10 — Playwright E2E | `11cd446` | [website/tests/e2e/](tests/e2e/) (10 specs), [.github/workflows/e2e.yml](.github/workflows/e2e.yml), [website/docs/testing.md](docs/testing.md) |
| D.11 — File storage driver | `45d0934` | [website/lib/storage/driver.ts](lib/storage/driver.ts) (LocalStorageDriver AES-256-GCM + S3StorageDriver), [website/app/api/attachments/{upload,serve}/route.ts](app/api/attachments/) |
| D.12 — Backup & restore runbook | `d12c7b3` | [website/docs/backup-and-restore.md](docs/backup-and-restore.md) |
| D.13 — Clerk webhook handler | `53f3633` | [website/app/api/webhooks/clerk/route.ts](app/api/webhooks/clerk/route.ts), idempotency via WebhookEvent table |
| D.14 — System wallet floors | `e42b030` | [website/lib/ledger/{types,service}.ts](lib/ledger/) `FloorBreachError`, [website/app/(admin)/_actions/treasury.ts](app/(admin)/_actions/treasury.ts), [website/app/(admin)/admin/treasury/_components/wallet-floor-card.tsx](app/(admin)/admin/treasury/_components/wallet-floor-card.tsx) |
| D.15 — Full email template suite | `be788f5` (+ tracker `87a3d4a`) | [website/lib/email/templates/lease-ending-soon.tsx](lib/email/templates/lease-ending-soon.tsx), severity-aware `emergency-broadcast.tsx` |

**Block D checkpoint:** [`qa/block-D-checkpoint.md`](qa/block-D-checkpoint.md). Test baseline 367/367 at completion.

### Block E — Quality gates (2026-05-08)

| Prompt | Commit | Report | Notes |
|---|---|---|---|
| E.1 — Function test sweep | (no commit — report only) | [`qa/function-test-report.md`](qa/function-test-report.md) | 0 Fail; 5 PENDING live-run rows (smoke flows owner-action) |
| E.2 — Security sweep | `95a192c` | [`qa/security-test-report.md`](qa/security-test-report.md) | ASVS L1 V1–V14; 5 security headers added (CSP deferred to F.1 per D-E2-01); 0 Critical/High open |
| E.3 — UX & accessibility | `4e54eb5` | [`qa/ux-accessibility-report.md`](qa/ux-accessibility-report.md) + [`qa/lighthouse/`](qa/lighthouse/) (5 axe evidence files) | Lighthouse-substituted by axe-core/playwright per D-E3-01 (Clerk auth barrier); 8 inline fixes; R-E3-01 contrast carry-over |
| E.4 — Code quality | `192cf7b` | [`qa/code-quality-report.md`](qa/code-quality-report.md) + [`qa/code-quality/`](qa/code-quality/) (8 tool outputs) | 23 lint fixes; 9-item refactor backlog; `lib/uploadthing.ts` deleted |

### Block F — Production readiness (2026-05-09)

| Prompt | Commits | Key files | Evidence |
|---|---|---|---|
| F.1 — Production build hardening | `c6aae9c` (env audit) → `169d11a` (CSP + Sentry deprecation cleanup) → `30ea556` (deploy runbook) | [website/next.config.ts](next.config.ts) (CSP composition logged D-F1-01; `disableLogger` removed D-F1-02), [website/.env.example](.env.example) (D-F1-03 commit-scope decision), [website/docs/production-deploy.md](docs/production-deploy.md), [docs/phase1plus/prompts/F.1.md](docs/phase1plus/prompts/F.1.md) | [`qa/f1-build.txt`](qa/f1-build.txt), [`qa/headers-scan-f1.txt`](qa/headers-scan-f1.txt), [`qa/f1-{typecheck,test,lint}.txt`](qa/) |
| F.2 — PWA + Play Store packaging | `e2c520c` | [website/app/manifest.ts](app/manifest.ts), [website/public/sw.js](public/sw.js) (D-F2-01 hand-rolled), [website/components/shared/{sw-register,install-prompt}.tsx](components/shared/), [website/app/offline/page.tsx](app/offline/page.tsx), [website/app/{privacy,terms}/page.tsx](app/) + [website/legal/{privacy,terms}.md](legal/) (D-F2-02), [website/components/legal/{legal-document,render-markdown}.tsx](components/legal/), [marketing/play-store/](marketing/play-store/) (4 PNGs + icon + feature graphic), [website/docs/{play-store,play-store-data-safety,go-live}.md](docs/), [website/scripts/{generate-pwa-icons,generate-feature-graphic,capture-play-store-screenshots}.ts](scripts/) | [`qa/f2-build.txt`](qa/f2-build.txt), [`qa/f2-endpoint-scan.txt`](qa/f2-endpoint-scan.txt), [`qa/f2-{typecheck,test,lint}.txt`](qa/) |

**Block F checkpoint:** [`qa/block-F-checkpoint.md`](qa/block-F-checkpoint.md) (closure session).

### PRE-3 / demo-flow side stream

These commits are not numbered prompts but were committed as a parallel improvement stream and are therefore part of the master baseline. They include the public `/demo/*` showcase routes, the `/access` ticket-auth flow, and various security hardenings:

```
7dbf851  feat(demo): add /access demo page and token API
912f8b8  fix(demo): hydration error fix (server component + ssr:false button)
3feeefa  fix(demo): move ssr:false dynamic import into client wrapper
d6df710  fix(demo): use signIn.ticket() to avoid signal timing bug
b9aa497  fix(demo): rewrite access button to ticket URL pattern
049b027  fix(demo): add dedicated /access/callback page
82a6412  fix(security): gate /access demo flow behind NODE_ENV check
1cde23f  fix(security): harden demo token minting
387f237  fix(ledger): row-lock transfers, atomic settlement execution
d5ef1da  fix(auth): fail closed for inactive users + revoke Clerk sessions
bda870b  fix(webhooks): reserve clerk webhook events before side effects
004eaf4  fix(approvals): atomic state transitions and vote option validation
7e0391e  feat(action): withAdminAction/withResidentAction HOF + tests
cfcb091  refactor(actions): migrate all 26 action files to HOF contract
```

The PRE-3 demo flow has **6 demo accounts** in [website/lib/demo-mode.ts](lib/demo-mode.ts) (Karis Munroe / Naomi Wells / Devon McKenzie / Anjali Pereira / Aaliyah Singh / Marcus Bowen). Each has a real Clerk `user_xxx` ID. The sign-in page exposes shortcut buttons (gated by `NEXT_PUBLIC_DEMO_MODE_ENABLED`) that call `/api/auth/token` to mint Clerk sign-in tickets. **This is the only practical way to see the authenticated Phase 1+ admin UI without running the full provider provisioning sequence.**

---

## 7. Closure session (this session, 2026-05-09)

The closure session ran four cleanup steps + three audit deliverables to satisfy the §9 final-readiness gate. All seven steps complete; three new commits on master.

| Step | Action | Commit | Closes |
|---|---|---|---|
| 1 | PRE-3 lint fix in `app/access/callback/_components/access-callback-client.tsx` — derived missing-ticket error at render time | `ff23fa7` | R-F1-01 |
| 2 | Deleted stale `website/qa/` tree (4 files + `codex-review/` dir); root `qa/` is now sole canonical | `04982a6` | R-F1-04 |
| 3 | Extended `scripts/capture-play-store-screenshots.ts` for authenticated capture (opt-in via `SCREENSHOT_INCLUDE_AUTHENTICATED=1`); pinned to MASTER_ADMIN demo account | `6502eb3` | D-F2-04 (build-agent scope; capture run remains owner-only — `pnpm dev` required because `/api/auth/token` short-circuits in `NODE_ENV=production`) |
| 4 | Verified R-F2-05 SW VERSION bump policy is operationally documented in `play-store.md §9 step 4`; no release CI workflow exists | (no commit) | R-F2-05 status moved Open → Operational |
| 5 | Wrote Block F closure checkpoint | (root tree only) | [`qa/block-F-checkpoint.md`](qa/block-F-checkpoint.md) |
| 6 | Wrote final readiness audit (§9) | (root tree only) | [`qa/final-phase1plus-readiness.md`](qa/final-phase1plus-readiness.md) |
| 7 | Wrote owner deploy coordination plan | (root tree only) | [`qa/deploy-coordination.md`](qa/deploy-coordination.md) |

A new decision was logged: **D-F2-05** (closure-session screenshot script extension; documents the newly-surfaced `NODE_ENV=production` constraint on `/api/auth/token`).

The session plan that drove this work: [`C:/Users/infin/.claude/plans/phase-1-continuation-fresh-hidden-tiger.md`](C:/Users/infin/.claude/plans/phase-1-continuation-fresh-hidden-tiger.md).

---

## 8. Master tracker artifacts

These four files are the **canonical** trackers (root tree, NOT in git per D-F1-03). Edit them by hand or via Edit tool.

| File | Role |
|---|---|
| [`qa/phase1plus-progress.md`](qa/phase1plus-progress.md) | Per-prompt master log. Every prompt (A.1 → F.2 + Block C/D/F checkpoints) with status, commits, test count, evidence path, open blockers. |
| [`qa/risk-register.md`](qa/risk-register.md) | Every risk (R-A1-01 through R-F2-05) with impact, likelihood, owner, mitigation, status. |
| [`qa/decision-log.md`](qa/decision-log.md) | Every non-trivial decision with context, alternatives, consequence. Includes D-A1-01 → D-F2-05 plus D-SEQUENCE-01. |
| [`qa/evidence-index.md`](qa/evidence-index.md) | Every code/test/screenshot/report indexed by prompt. |

### Closure-session audit trio

| File | Role |
|---|---|
| [`qa/block-F-checkpoint.md`](qa/block-F-checkpoint.md) | Mirrors `block-D-checkpoint.md` structure. F.1 + F.2 + closure-session acceptance per AC, test summary, regressions, Closed/Owner-action/Mitigated risks, §9 closure-gate ruling. |
| [`qa/final-phase1plus-readiness.md`](qa/final-phase1plus-readiness.md) | §9 audit walking every Playbook Appendix D box with evidence path. **Three Go/No-Go verdicts.** Recommended next actions mapped 1:1 to `go-live.md` Phase A → I. |
| [`qa/deploy-coordination.md`](qa/deploy-coordination.md) | Owner companion plan paced for the 1–2 working-week deploy window. Day-by-day grid, per-phase prereqs, evidence-to-capture (`qa/launch/...` paths), hard-gate dependency graph, build-agent vs operational escalation list, daily checklist. |

### Per-block checkpoints

| File | Block |
|---|---|
| [`qa/block-C-checkpoint.md`](qa/block-C-checkpoint.md) | Block C closure (C.2/C.3 delivered + D-SEQUENCE-01 resolved) |
| [`qa/block-D-checkpoint.md`](qa/block-D-checkpoint.md) | Block D closure (D.1–D.15) |
| [`qa/block-F-checkpoint.md`](qa/block-F-checkpoint.md) | Block F closure (F.1 + F.2 + this session's cleanup) |

(Blocks A and B do not have per-block checkpoints — they were retroactively documented from git log + 141-test baseline.)

### E-block quality reports

| File | Prompt |
|---|---|
| [`qa/function-test-report.md`](qa/function-test-report.md) | E.1 |
| [`qa/security-test-report.md`](qa/security-test-report.md) + [`qa/audit-output.txt`](qa/audit-output.txt) + [`qa/secrets-scan.txt`](qa/secrets-scan.txt) + [`qa/headers-scan.txt`](qa/headers-scan.txt) | E.2 |
| [`qa/ux-accessibility-report.md`](qa/ux-accessibility-report.md) + [`qa/lighthouse/`](qa/lighthouse/) | E.3 |
| [`qa/code-quality-report.md`](qa/code-quality-report.md) + [`qa/code-quality/`](qa/code-quality/) | E.4 |

### F-block validation evidence

| File | Phase |
|---|---|
| [`qa/f1-{build,typecheck,test,lint}.txt`](qa/) + [`qa/headers-scan-f1.txt`](qa/headers-scan-f1.txt) | F.1 |
| [`qa/f2-{build,typecheck,test,lint,endpoint-scan}.txt`](qa/) | F.2 |
| [`qa/f3-{build,typecheck,test,lint}.txt`](qa/) | Closure-session Step 1 (post-PRE-3-fix verification) |

---

## 9. Authoritative reference docs

When in doubt about **what** to build → read the playbook.
When in doubt about **how** execution should be run → read the execution protocol.
When in doubt about a procedure → read the appropriate runbook.

| Question | Source |
|---|---|
| What does Phase 1+ require? | [`COK-Phase1Plus-ClaudeCode-Playbook.md`](COK-Phase1Plus-ClaudeCode-Playbook.md). Appendix D is the acceptance summary checklist (line 1988). |
| How is execution governed? | [`CLAUDE_EXECUTION_ROOT.md`](CLAUDE_EXECUTION_ROOT.md). §2 sequencing, §5 block checkpoints, §8 handover format, §9 final readiness, §11 DoD. |
| How is the project laid out + design rules? | [`CLAUDE.md`](CLAUDE.md) (project root) → [`website/CLAUDE.md`](CLAUDE.md) → [`website/AGENTS.md`](AGENTS.md) (Next 16 caveats — read this before writing code) |
| How does the owner go live? | [`website/docs/go-live.md`](docs/go-live.md) — master Phase A → I runbook; references the sub-runbooks below. |
| How does the web deploy work? | [`website/docs/production-deploy.md`](docs/production-deploy.md) |
| How does the Play Store submission work? | [`website/docs/play-store.md`](docs/play-store.md) (Bubblewrap CLI, key management, Asset Links, Console fill-in, post-submission monitoring) + [`website/docs/play-store-data-safety.md`](docs/play-store-data-safety.md) |
| How is backup / restore handled? | [`website/docs/backup-and-restore.md`](docs/backup-and-restore.md) (Supabase native + manual pg_dump + S3 versioning + key rotation + drill log) |
| How does observability work? | [`website/docs/observability.md`](docs/observability.md) |
| How is data protection handled? | [`website/docs/data-protection.md`](docs/data-protection.md) (storage encryption, signed URLs, GDPR posture, retention) |
| How does MFA enforcement work? | [`website/docs/mfa.md`](docs/mfa.md) |
| How is email set up? | [`website/docs/email-setup.md`](docs/email-setup.md) |
| How are E2E tests organized? | [`website/docs/testing.md`](docs/testing.md) |
| How are crons configured? | [`website/docs/cron.md`](docs/cron.md) |
| How does multi-currency work? | [`website/docs/currency-and-promotions.md`](docs/currency-and-promotions.md) |
| What's in the public `/demo` showcase? | [`website/docs/demo-showcase.md`](docs/demo-showcase.md) |

---

## 10. How to run locally

### Prerequisites
- Node.js 20+
- pnpm 9+ (the project's package manager — `npm` or `yarn` not used)
- Postgres 16 (local or Supabase) — connection string in `.env` as `DATABASE_URL` + `DIRECT_URL`
- Clerk dev instance with the six demo `user_*` IDs from [website/lib/demo-mode.ts](lib/demo-mode.ts) seeded; `CLERK_SECRET_KEY` + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env`
- Optional: Resend, Sentry, Upstash for full integration

### Quick start

```bash
cd "c:/Users/infin/OneDrive/White Dragon/Claude Main/COK-City-of-Karis/website"
pnpm install
pnpm exec prisma migrate deploy
pnpm seed                                  # populate demo data
NEXT_PUBLIC_DEMO_MODE_ENABLED=true pnpm dev
```

Then visit:
- **[http://localhost:3000](http://localhost:3000)** — root, redirects to sign-in
- **[http://localhost:3000/sign-in](http://localhost:3000/sign-in)** — sign-in with demo shortcut buttons (six accounts) **← this is how you see the full Phase 1+ admin UI**
- **[http://localhost:3000/demo](http://localhost:3000/demo)** — public showcase (Phase 1 only; `/demo/master-admin` and `/demo/admin` are "Coming Soon" placeholders for Phase 1+)

### Verification commands

```bash
pnpm test           # vitest unit suite — expect 396/396
pnpm typecheck      # tsc --noEmit — expect exit 0
pnpm build          # next build — expect zero warnings
pnpm lint           # eslint — expect exit 0 with 1 carried-forward warning in app/(admin)/_actions/imports.ts
pnpm test:e2e       # playwright — requires .env.test + chromium download
```

### Screenshot capture

Two modes (see [website/scripts/capture-play-store-screenshots.ts](scripts/capture-play-store-screenshots.ts) header docblock):

```bash
# Public-only (default — what F.2 produced):
pnpm build && pnpm start
NEXT_PUBLIC_DEMO_MODE_ENABLED=true pnpm pwa:screenshots
# captures sign-in / privacy / terms / offline at 1080×1920

# Authenticated (closes D-F2-04 capture step):
pnpm dev   # NODE_ENV=development required — /api/auth/token short-circuits in production
NEXT_PUBLIC_DEMO_MODE_ENABLED=true \
  SCREENSHOT_INCLUDE_AUTHENTICATED=1 \
  pnpm pwa:screenshots
# additionally captures dashboard / treasury / announcement
```

---

## 11. How to deploy

**Owner runbook:** [`qa/deploy-coordination.md`](qa/deploy-coordination.md). It is the day-by-day plan; [`website/docs/go-live.md`](docs/go-live.md) is the procedural source of truth for each phase.

```
Day 1   Phase A (provisioning) → Phase B (first deploy)
Day 2   Phase C (web verification) + Phase D (PWA verification)
Day 3   Phase C tail (drill + floor config) + start counsel review (Phase E)
Day 4   Phase F (Bubblewrap AAB build) + authenticated screenshots
Day 5   Phase G (Play Console fill + Internal track upload)
Day 6–7 Wait on Play Store review + counsel
Week 2+ Phase H (track promotion) + Phase I (post-launch monitoring)
```

There are **three hard gates** along this path:

1. `bubblewrap init` requires the production URL to be live → Phase F starts only after Phase B finishes
2. `assetlinks.json` SHA-256 must be updated (commit + redeploy) BEFORE submitting AAB to Play Store → Phase F step F6 → F7 → G7
3. Counsel-approved legal text must be live BEFORE Production-track promotion → Phase E5 must complete before Phase H step H3

**Build-agent vs operational escalation list:** see [`qa/deploy-coordination.md §5`](qa/deploy-coordination.md). When something fails on the live deploy, it tells you whether to re-engage the build agent (code fix needed) or resolve operationally (provider dashboard).

---

## 12. Outstanding work

### Owner-action gates (block live deploy; all documented)

These are NOT engineering work — they're operational steps the project owner runs through `qa/deploy-coordination.md`:

- Phase A provisioning (Resend + Clerk + Upstash + S3 + Supabase Pro + Sentry + secrets)
- Phase C verification (smoke flows + securityheaders.com A-grade + restore drill + system wallet floors)
- Phase E counsel review of `legal/{privacy,terms}.md`
- Phase F Bubblewrap AAB build + assetlinks fingerprint
- Phase F authenticated screenshots (`SCREENSHOT_INCLUDE_AUTHENTICATED=1` against `pnpm dev`)
- Phase G Play Console fill + Internal track upload
- Phase H track promotion (gated on E5 + 7-day stability)

### Carried-forward (non-blocking) — Phase 2 candidates

| Item | Risk / Decision | Notes |
|---|---|---|
| `app/(admin)/_actions/imports.ts` unused-import warning | (E.4 backlog) | One-line removal in next maintenance pass |
| VENDOR / ADMIN onboarding tour layouts | R-D7-02 / D-D7-01 | Steps already defined in `lib/tour/steps.ts`; auto-shows when those layouts are built |
| `karis-stone-500` contrast in authenticated UI | R-E3-01 | E.3 fixed sign-in instances; remaining usages on dashboard/community timestamps |
| Resident-to-resident KCRD transfer UI | R-D10-02 / D-D10-02 | Schema supports TRANSFER type; test 2 skipped; Phase 2 |
| iOS Safari input zoom on small fonts | R-E3-03 | Workaround documented; not a launch blocker |
| `xlsx` HIGH advisories | R-E2-01 | Compensating controls in place; replace with `exceljs` when resourcing allows |
| Effect 3 transitive HIGH | R-E2-02 | Pending upstream `@uploadthing` update |
| Public Phase 1+ showcase routes (`/demo/master-admin`, `/demo/admin`, `/demo/vendor`) | (gap noted in Phase 1+ session) | Currently "Coming Soon" placeholders. ~1–2 sessions to backfill with real components fed by hardcoded fixtures. |
| CI gate for SW VERSION bump on `public/sw.js` modifications | R-F2-05 | Phase 2 hardening; release-checklist mitigation already in `play-store.md §9 step 4` |
| GitHub remote setup | (operational) | `git remote add origin …`; `git push -u origin master` |

---

## 13. For a new session / CODEX — read in this order

If you are a new Claude Code session, CODEX agent, or human picking up this project, read **only these files in this order** to be productive in five minutes:

1. **[`PROJECT-HANDOVER.md`](PROJECT-HANDOVER.md)** — this file. Gives you the lay of the land.
2. **[`qa/final-phase1plus-readiness.md`](qa/final-phase1plus-readiness.md)** §1 (executive verdicts) + §2 (Appendix D walk) + §4 (open items). 10 minutes; tells you what's done, what's pending, what gates what.
3. **[`qa/deploy-coordination.md`](qa/deploy-coordination.md)** §1 (day-by-day grid) + §3 (hard-gate dependency graph) + §5 (escalation list). 5 minutes; tells you the live-deploy plan and when to escalate.
4. **[`COK-Phase1Plus-ClaudeCode-Playbook.md`](COK-Phase1Plus-ClaudeCode-Playbook.md)** Appendix D (line 1988). The 31-item acceptance checklist Dr. Munroe signs off on.
5. **[`CLAUDE_EXECUTION_ROOT.md`](CLAUDE_EXECUTION_ROOT.md)** §2 + §5 + §8 + §9 + §11. The execution protocol that governs how subsequent work runs.
6. **[`website/AGENTS.md`](AGENTS.md)** — single line, but it's load-bearing: this is Next.js 16, not 14/15. Read `node_modules/next/dist/docs/` before writing Next-specific code.
7. **[`qa/risk-register.md`](qa/risk-register.md)** — scan the Open / Conditional rows. They map directly to deploy gates.
8. **[`qa/decision-log.md`](qa/decision-log.md)** — when wondering "why is X this way?", grep for the prompt ID (D-D5-01, D-F2-04, etc.).

When you need to **find code**: search `qa/evidence-index.md` for the relevant prompt ID. Every file is indexed.

When you need to **find git history**: HEAD is `6502eb3`. The first 11 closure + Phase 1+ commits are listed in §5 above. Run `git log --oneline` in `website/` for the rest.

When you need to **understand a feature's design rationale**: the answer is almost always in `qa/decision-log.md`. Every D-X-Y entry includes "Alternatives considered" so you see what was rejected and why.

When the user says "make the app do X" and you're not sure if X already exists: grep `qa/evidence-index.md` first.

When the user asks "is this safe to deploy?": check `qa/risk-register.md` for any **Open** Critical/High row. If clean, see [`qa/final-phase1plus-readiness.md` §1](qa/final-phase1plus-readiness.md) verdicts. The current answer is *Conditional Go on the Phase A → I owner-action gates*.

---

## 14. Provenance

| Generated by | Closure-session build agent (Claude Opus 4.7) |
| Generated at | 2026-05-09 |
| Driving plan | [`C:/Users/infin/.claude/plans/phase-1-continuation-fresh-hidden-tiger.md`](C:/Users/infin/.claude/plans/phase-1-continuation-fresh-hidden-tiger.md) |
| Closure session HEAD | `6502eb3` |
| Trackers as of | 2026-05-09 22:23 |
| Format | Markdown 1.0 (CommonMark) — no PDF generated this session; convert via `pandoc PROJECT-HANDOVER.md -o PROJECT-HANDOVER.pdf` if needed |

End of handover. The above is the single source of truth.
