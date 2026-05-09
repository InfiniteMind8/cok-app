# Deploy Coordination Plan — City of Karis Phase 1+ Live Launch
**Date:** 2026-05-09
**Audience:** Project owner (Dr. Munroe)
**Companion to:** `website/docs/go-live.md` (the procedural runbook), `qa/final-phase1plus-readiness.md` (the §9 audit), `qa/block-F-checkpoint.md` (the closure checkpoint)
**Target window:** 1–2 working weeks (selected during the closure-session AskUserQuestion)
**Goal:** Convert "Conditional Go" → "Go" for production deployment and Play Store submission.

> This plan tells you **when** to run each phase, **what** to capture as evidence, **what blocks what**, and **when to escalate back to the build agent vs. resolve operationally**. It does not duplicate `go-live.md` — that's the procedure; this is the calendar plus the dependency graph plus the evidence inventory.

---

## 0. How to use this document

1. Read this whole file once before starting.
2. Open `website/docs/go-live.md` in a second tab — it's the procedural source of truth for each step.
3. Run phases in the order listed in §2 below. Don't skip ahead — the dependency graph in §3 enforces ordering for a reason.
4. Capture every evidence artifact called out in the per-phase blocks. The Phase 1+ §9 closure gate is satisfied only when this evidence exists.
5. If you hit a failure mode, check §5 (escalation list) before diagnosing — most things are a config issue, not a code issue.

---

## 1. Day-by-day grid

This is the **target** pacing. Real wall-clock time will vary based on Resend DNS propagation (up to 48 h), Clerk production approval queue, counsel turnaround, and Play Store review (hours to 7 days).

| Day | Phases | Wall-clock active | Calendar dependencies |
|---|---|---|---|
| **Day 1** | Phase A (provisioning) → Phase B (first deploy) | 3–5 hours active + DNS waiting | DNS A/CNAME propagation; Resend domain verification (parallel; can lag into Day 2) |
| **Day 2** | Phase C (web verification) + Phase D (PWA verification) | 1–2 hours | Supabase first daily snapshot needs 24 h post-Phase B (so check on Day 2) |
| **Day 3** | Phase C tail (drill + floor config) + send legals to counsel (Phase E starts) | 1–2 hours active + waiting on counsel | Counsel review typically 3–5 business days; runs parallel to Phase F |
| **Day 4** | Phase F (Bubblewrap AAB build) + authenticated screenshots | 2–3 hours | JDK/keystore workstation ready; non-prod preview deploy or `pnpm dev` for screenshots |
| **Day 5** | Phase G steps G1–G6 (Play Console fill) + AAB upload to Internal track (G7) | 2–3 hours active + waiting on Play Store review | First-time Play Store review can take up to 7 days |
| **Day 6–7** | Phase G review window; Phase H starts only after counsel approval lands AND Internal track is green ≥ 7 days | (mostly waiting + monitoring) | Counsel approval (Phase E5) gates promotion to Production track (Phase H step H3) |
| **Week 2+** | Phase H (track promotion); Phase I (post-launch monitoring) | Monitoring | Production-track promotion deferred to ≥ 7 days clean Internal + counsel done |

> **The plan is genuinely 1–2 weeks of calendar.** Days 1–5 are owner-active hours; Days 6–7 are mostly waiting (Play Store + counsel). Phase H production track promotion is intentionally **at week 2+** because Phase H step H1 says "≥ 7 days clean Internal testing" — this is a Play Store best-practice gate, not a build-agent gate.

---

## 2. Per-phase breakdown

Each block: time required, prerequisites, owner-active steps (cross-referenced to `go-live.md`), evidence to capture (with target path), gate-out condition.

---

### Phase A — Account provisioning (Day 1)

**Time:** 1–2 hours active + DNS propagation wait (up to 48 h)
**Prerequisites:** None (this is the entry point)
**`go-live.md` reference:** Phase A steps A1–A8

| Step | Action | Evidence path | Closes |
|---|---|---|---|
| A1 | Resend domain + SPF/DKIM/DMARC | Resend dashboard screenshot → `qa/launch/resend-verified.png` | R-A1-01 |
| A2 | Clerk production instance + MFA strategy + demo users | Clerk dashboard screenshot of MFA settings → `qa/launch/clerk-mfa.png` | R-D3-02, R-D10-03 |
| A3 | Upstash Redis production DB | Upstash dashboard screenshot + URL/TOKEN in vault | R-D9-01 |
| A4 | S3/R2/B2 bucket + scoped keys (PutObject, GetObject, DeleteObject only) | "list/test-create-test-delete" log → `qa/launch/storage-test.txt` | (bucket provisioning) |
| A5 | `openssl rand -hex 32` → password manager + offline backup | "Two backups confirmed" entry in `qa/launch/key-backup-confirmation.txt` (do NOT include the actual key) | R-D11-01, R-D12-03 |
| A6 | Supabase upgrade to Pro + verify PITR | Supabase dashboard screenshot → `qa/launch/supabase-pro.png` | R-D12-02 |
| A7 | Sentry production project + auth token | Sentry dashboard screenshot → `qa/launch/sentry-project.png` | (operational) |
| A8 | `openssl rand -hex 32` → `CRON_SECRET` to vault | (none — secret only in vault) | (operational) |

**Gate out:** every A-row complete OR DNS verification still pending (proceed to Phase B with DNS as a parallel waiter; B5 will succeed even if Resend isn't verified yet — only A.1 live email send requires it).

---

### Phase B — First deploy (Day 1–2)

**Time:** ~30 minutes active
**Prerequisites:** Phase A complete (or A1 DNS still propagating, OK to defer)
**`go-live.md` reference:** Phase B steps B1–B6
**Sub-runbook:** `website/docs/production-deploy.md`

| Step | Action | Evidence path | Notes |
|---|---|---|---|
| B1 | Add every Phase A env var to deploy platform vault; cross-check `.env.example` | Vault audit log entry | All keys must be present before B5 |
| B2 | Confirm `NEXT_PUBLIC_DEMO_MODE_ENABLED=false` (or absent) and `NEXT_PUBLIC_DEMO_SHOWCASE_ENABLED=false` | Vault audit log | Production must NOT expose demo flows |
| B3 | `git ls-files \| grep -E '^\.env'` returns empty | Console output → `qa/launch/env-secrets-clean.txt` | Sanity check before push |
| B4 | DNS A/CNAME for production domain → deploy platform; wait for HTTPS cert | Browser test of HTTPS load | DNS may take 5 min to several hours |
| B5 | Push to deploy branch; watch build log; **acceptance: zero warnings** | Deploy platform build log → `qa/launch/deploy-build-log.txt` | If build has warnings, halt — investigate before continuing |
| B6 | Confirm Vercel cron entry calls `/api/cron/leases` and `/api/cron/reconciliation` with `Authorization: Bearer $CRON_SECRET` | Cron config screenshot → `qa/launch/cron-config.png` | Cron silence will surface as missed reconciliation reports / lease transitions |

**Gate out:** Deploy reachable on production HTTPS URL, build zero-warning, cron entries live.

---

### Phase C — Web post-deploy verification (Day 2–3)

**Time:** ~1–2 hours active across two days (most steps Day 2; restore drill + floor config Day 3)
**Prerequisites:** Phase B complete; live HTTPS URL
**`go-live.md` reference:** Phase C steps C1–C8

| Step | Action | Evidence path | Closes |
|---|---|---|---|
| C1 | `curl -sI https://<production-domain>/` — confirm all 6 security headers (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP) | curl output → `qa/launch/headers-live.txt` | (live headers verification) |
| **C2** | Submit URL to <https://securityheaders.com/> — **A grade or above** | Save screenshot → `qa/launch/securityheaders-2026-MM-DD.png` | **R-F1-03** |
| **C3** | Smoke flows per `production-deploy.md` §3.3: sign-in, property transfer, wallet view, issue with attachment, emergency broadcast | Notes per flow → `qa/launch/smoke-flows.md` | **R-F1-03** + 5 PENDING E.1 rows (E1-F-01 through E1-F-05) |
| C4 | Sentry receives `/api/sentry-test` event (Master Admin only); confirm PII scrub in payload | Sentry event screenshot → `qa/launch/sentry-test-event.png` | (D.8 live verification) |
| C5 | Resend dashboard shows smoke-flow emails as `delivered` | Resend dashboard screenshot → `qa/launch/resend-deliveries.png` | A.1 live verification |
| C6 | Within 24 h: Supabase has produced a daily snapshot | Supabase dashboard screenshot → `qa/launch/supabase-snapshot.png` | (D.12 backup automation verified) |
| **C7** | Run the D.12 restore drill against staging per `docs/backup-and-restore.md §5–§6`; file drill log entry | Drill log entry in `docs/backup-and-restore.md` + `qa/launch/restore-drill-log.md` | **R-D12-01** |
| **C8** | Master Admin sets system wallet floors at `/admin/treasury` (audit log row per change) | `/admin/audit-log` screenshot → `qa/launch/floor-config.png` | **R-D14-01** |

**Gate out:** All 8 rows captured; no Critical/High issue surfaced. C2 (securityheaders), C3 (smoke flows), C7 (restore drill), C8 (wallet floors) are the four bold rows that close their respective Phase 1+ owner-action risks.

---

### Phase D — PWA verification (Day 2)

**Time:** ~30 minutes
**Prerequisites:** Phase B complete; live HTTPS URL
**`go-live.md` reference:** Phase D steps D1–D7
**Sub-runbook:** `website/docs/play-store.md` §1

| Step | Action | Evidence path | Notes |
|---|---|---|---|
| D1 | Chrome → DevTools → Application → Manifest → "Installable" badge, no errors, all 5 icons | Screenshot → `qa/launch/pwa-manifest.png` | F.2 AC1 live |
| D2 | DevTools → Application → Service Workers → `sw.js` activated | Screenshot → `qa/launch/pwa-sw.png` | (SW live) |
| D3 | DevTools → Network → Offline → reload `/` → falls back to brand `/offline` page | Screenshot → `qa/launch/pwa-offline.png` | (offline UX live) |
| D4 | Real Android phone → Chrome → menu → "Add to Home Screen" → opens standalone | Phone screenshot → `qa/launch/pwa-android.png` | (real-device install) |
| D5 | `curl -sI https://<production-domain>/manifest.webmanifest` → 200 + `application/manifest+json` | curl output → `qa/launch/manifest-curl.txt` | (manifest live) |
| D6 | `curl -sI https://<production-domain>/.well-known/assetlinks.json` → 200 + `application/json` | curl output → `qa/launch/assetlinks-curl.txt` | (placeholder fingerprint OK at this stage) |
| D7 | Visit `/privacy` and `/terms` — both render with the "DRAFT" banner | Screenshots → `qa/launch/legal-{privacy,terms}.png` | F.2 AC5 live (drafts) |

**Gate out:** All 7 rows pass. If any step fails, fix before Phase F (Bubblewrap won't pass review against a broken PWA).

---

### Phase E — Counsel review (parallel; gating)

**Time:** Owner active 30 min (send + receive); counsel turnaround 3–5 business days
**Prerequisites:** None (can start any time after Day 2; **must complete** before Phase H step H3)
**`go-live.md` reference:** Phase E steps E1–E6
**Source files:** `website/legal/privacy.md`, `website/legal/terms.md`

| Step | Action | Evidence path | Closes |
|---|---|---|---|
| E1 | Send drafts to counsel | Email sent → `qa/launch/counsel-sent-email.eml` (or note) | (engagement) |
| E2 | Apply counsel's edits | Diff in commit message | (revisions) |
| E3 | Remove "DRAFT — pending counsel review" banner from each | Diff | **R-F2-03** |
| E4 | Set the **Effective date** in both documents | Diff | (date) |
| E5 | Commit, redeploy, confirm `/privacy` and `/terms` show final text | Live URL screenshots → `qa/launch/legal-final-{privacy,terms}.png` | F.2 AC5 final |
| E6 | Do **not** promote off Internal-testing track until E5 is complete | (gate enforced in Phase H step H3) | (Play Store production gate) |

**Gate out:** Counsel-approved live legal text. **This is the gate that lets you flip the Production track in Phase H.**

---

### Phase F — Mobile (TWA) build (Day 4)

**Time:** ~2 hours on a JDK-equipped workstation
**Prerequisites:** Phase D pass (PWA verified); JDK 17+ + Android signing keystore + password manager access
**`go-live.md` reference:** Phase F steps F1–F7
**Sub-runbook:** `website/docs/play-store.md` §2–§6

| Step | Action | Evidence path | Closes |
|---|---|---|---|
| F1 | Install JDK 17+, set `JAVA_HOME` | Console version → `qa/launch/jdk-version.txt` | (env) |
| F2 | `npm install -g @bubblewrap/cli` | Install log → `qa/launch/bubblewrap-install.txt` | (env) |
| F3 | `mkdir ~/karis-twa && cd ~/karis-twa && bubblewrap init --manifest=https://<production-domain>/manifest.webmanifest` | Init output → `qa/launch/bubblewrap-init.txt` | (TWA scaffold) |
| F4 | Generate signing keystore (Bubblewrap prompts during init) — passphrase to password manager + offline backup | "Two backups confirmed" entry in `qa/launch/keystore-backup-confirmation.txt` (no key material) | **R-F2-01** key part |
| F5 | `bubblewrap build` → `app-release-bundle.aab` + `app-release-signed.apk` + printed SHA-256 fingerprint | Console output → `qa/launch/bubblewrap-build.txt` (with fingerprint) | **R-F2-01** |
| **F6** | Paste SHA-256 into `website/public/.well-known/assetlinks.json` (replace placeholder); commit, push, redeploy; verify the address bar disappears in installed TWA | Diff + redeploy log → `qa/launch/assetlinks-update.diff` | **R-F2-02** |
| F7 | `adb install -r app-release-signed.apk` to a real Android device; open the app; confirm full-screen, all flows render | Phone screenshot → `qa/launch/twa-install.png` | F.2 AC2 |

**Authenticated screenshots (between F and G):** Run `SCREENSHOT_INCLUDE_AUTHENTICATED=1 pnpm pwa:screenshots` against `pnpm dev` (or a non-production preview deploy). Three new PNGs land at `marketing/play-store/screenshots/{dashboard,treasury,announcement}-1080x1920.png`. Closes **D-F2-04** capture step.

**Gate out:** Signed AAB exists, installable on real device, address bar absent (Asset Links verified). 7/7 listing screenshots ready.

---

### Phase G — Play Console (Day 5 + waiting)

**Time:** ~2 hours active + Play Store review queue (hours to 7 days)
**Prerequisites:** Phase F complete; signed AAB; counsel review **may** be in flight (only Production-track promotion is gated on counsel)
**`go-live.md` reference:** Phase G steps G1–G10
**Sub-runbook:** `website/docs/play-store.md` §7; `website/docs/play-store-data-safety.md`; `marketing/play-store/listing-copy.md`

| Step | Action | Evidence path | Notes |
|---|---|---|---|
| G1 | Create developer account at <https://play.google.com/console/signup>; pay $25 | Receipt → `qa/launch/play-console-receipt.png` | One-time |
| G2 | Create the "City of Karis" app in Play Console | App ID screenshot → `qa/launch/play-app-created.png` | |
| G3 | Fill listing (name, descriptions per `listing-copy.md`, icon, feature graphic, **7 screenshots**, contact email, privacy URL `https://.../privacy`) | Listing fields screenshot → `qa/launch/play-listing.png` | All 7 screenshots from Phase F |
| G4 | Content rating questionnaire — Everyone | Final rating screenshot → `qa/launch/play-rating.png` | Per `play-store.md §7.4` |
| G5 | Data safety form — transcribe `play-store-data-safety.md` | Screenshot → `qa/launch/play-data-safety.png` | |
| G6 | Target audience: 18+ | Screenshot → `qa/launch/play-target-audience.png` | Per `legal/terms.md §1` |
| G7 | Upload AAB → **Internal testing** track; release name `1.0.0`; release notes per `go-live.md G7` | Track screenshot → `qa/launch/play-internal-track.png` | |
| G8 | Add founding cohort to tester list; share opt-in link only with that list | Tester list screenshot → `qa/launch/play-testers.png` | |
| G9 | Wait for Play Store review (hours to 7 days for new app) | Review status screenshot → `qa/launch/play-review-status.png` | Waiting only |
| G10 | Internal cohort installs via opt-in link; smoke test on real devices | Cohort feedback log → `qa/launch/internal-cohort-smoke.md` | |

**Gate out:** AAB live in Internal track; cohort access via opt-in link; smoke-test feedback collected.

---

### Phase H — Stabilise → Production (Week 2+)

**Time:** Continuous monitoring; promotions on a delay schedule
**Prerequisites:** Phase G G10 complete; counsel approval (Phase E5) live before H3
**`go-live.md` reference:** Phase H steps H1–H4

| Step | Trigger | Action |
|---|---|---|
| H1 | Internal testing reports zero blocking issues for **≥ 7 days** | Promote to Closed testing; expand tester list |
| H2 | Closed testing reports zero blocking issues for **≥ 14 days** (optional — Open testing can be skipped for a private community) | Promote to Open testing OR proceed direct Internal → Closed → Production |
| **H3** | **Counsel review must be complete** | Final gate before flipping Production track |
| H4 | Promote to Production | Watch Play Console Vitals + Sentry for first 72 h |

**Gate out:** Production track live; first 72 h of monitoring clean.

---

### Phase I — Post-launch monitoring (continuous)

**Time:** Daily triage for first month; weekly thereafter
**`go-live.md` reference:** Phase I monitoring channels

| Channel | What to watch | Action threshold |
|---|---|---|
| Play Console → Vitals → Crashes & ANRs | Crash rate per 1k users | If > 0.5%, halt rollout; correlate with Sentry; ship hotfix |
| Sentry | Top errors over 7 days | Triage daily for first month |
| Resend dashboard | Bounce / spam-mark rate | Investigate any > 1% bounce |
| Supabase dashboard | Daily snapshot status | Confirm a snapshot every 24 h |
| Audit log (`/admin/audit-log`) | Privileged actions | Spot-check weekly |
| Play Console → Pre-launch reports | Each new AAB | Read before rolling out |

---

## 3. Hard-gate dependency graph

These dependencies are **enforced** — violating them risks Play Store rejection, broken installs, or compliance issues.

```
Phase A (provisioning)
   ↓
Phase B (deploy)
   ↓
   ├── Phase C (web verification) ──┐
   │                                │
   ├── Phase D (PWA verification) ──┤
   │                                │
   └── Phase E (counsel) ────parallel
                                    │
                                    ↓
                                Phase F (Bubblewrap AAB build)
                                    │   prereq: live HTTPS URL (B), live PWA (D)
                                    ↓
                                Phase G (Play Console upload)
                                    │   prereq: signed AAB (F), 7 screenshots, counsel
                                    │           review NOT yet required at this stage
                                    │           (Internal track is OK with DRAFT)
                                    ↓
                                Phase H (track promotion)
                                    │   H3 GATE: counsel review (Phase E) must be live
                                    │            before flipping Production track
                                    ↓
                                Phase I (monitoring)
```

**Three hard gates:**

1. **`bubblewrap init` requires the production URL to be live and HTTPS-reachable** — Phase F cannot start before Phase B finishes.
2. **`assetlinks.json` SHA-256 update happens AFTER `bubblewrap build`, BEFORE submitting to Play Store** — order: F5 → F6 (commit + redeploy assetlinks) → F7 (real-device install verifies the address bar is gone) → G7 (upload AAB). Skipping F6 = installed TWA shows the Chrome address bar = Play Store rejection (visual policy violation).
3. **Counsel-approved legal text must be live BEFORE Phase H step H3 (production track promotion)** — Internal testing and Closed testing tracks are OK with DRAFT banners; Production is not. The `go-live.md` Phase H runbook enforces this; this plan re-affirms it.

**One soft gate (best practice, not technical):**

- **Phase H1 + H2 minimum dwell times** (≥ 7 days Internal, ≥ 14 days Closed). The Play Store reviewer expects evidence of staged rollout; faster promotion can trigger reviewer concerns or attribute crashes to Production prematurely.

---

## 4. Evidence inventory (for the §9 record)

The owner files all launch evidence under `qa/launch/`. The build agent's closure-session evidence lives under `qa/` (root, not `qa/launch/`). Together they form the auditable record of the deploy.

### Owner-captured evidence (Phase A → I)

```
qa/launch/
├── resend-verified.png            # A1
├── clerk-mfa.png                  # A2
├── (Upstash + storage notes — captured per A3, A4, A5)
├── supabase-pro.png               # A6
├── sentry-project.png             # A7
├── env-secrets-clean.txt          # B3
├── deploy-build-log.txt           # B5
├── cron-config.png                # B6
├── headers-live.txt               # C1
├── securityheaders-2026-MM-DD.png # C2 — closes R-F1-03
├── smoke-flows.md                 # C3 — closes 5 PENDING E.1 rows
├── sentry-test-event.png          # C4
├── resend-deliveries.png          # C5
├── supabase-snapshot.png          # C6
├── restore-drill-log.md           # C7 — closes R-D12-01
├── floor-config.png               # C8 — closes R-D14-01
├── pwa-{manifest,sw,offline,android}.png  # D1–D4
├── manifest-curl.txt              # D5
├── assetlinks-curl.txt            # D6
├── legal-{privacy,terms}.png      # D7 (drafts)
├── counsel-sent-email.eml         # E1
├── legal-final-{privacy,terms}.png # E5 — closes R-F2-03
├── jdk-version.txt                # F1
├── bubblewrap-{install,init,build}.txt # F2, F3, F5
├── keystore-backup-confirmation.txt    # F4 — closes R-F2-01 key part
├── assetlinks-update.diff         # F6 — closes R-F2-02
├── twa-install.png                # F7 — closes F.2 AC2
├── play-{console-receipt,app-created,listing,rating,data-safety,target-audience,internal-track,testers,review-status}.png  # G1–G9
└── internal-cohort-smoke.md       # G10
```

### Build-agent closure-session evidence (already captured)

```
qa/
├── block-F-checkpoint.md             # this session — F.1 + F.2 + closure Steps 1–4 acceptance
├── final-phase1plus-readiness.md     # this session — §9 audit + verdicts
├── deploy-coordination.md            # this session — this file
├── f3-{lint,typecheck,test,build}.txt # closure Step 1 validation (PRE-3 fix)
├── f1-*.txt, f2-*.txt                # F.1 + F.2 baselines (preserved)
├── headers-scan-f1.txt               # F.1 local headers verification
├── (block-C, block-D checkpoints; function/security/ux/code-quality reports — already in place)
└── (risk-register, decision-log, evidence-index, phase1plus-progress — fully updated)
```

---

## 5. Build-agent escalation list

When something fails during the deploy, decide where to send it. Most owner-side failures are **operational** — a wrong env var, a Clerk dashboard setting, a DNS record. A few are **build-agent territory** — code that doesn't behave correctly against a real production environment.

### Escalate to build agent — re-engage Claude Code

These are **code/configuration changes that require a build session**. The owner cannot resolve them via dashboard config or operational adjustment; they need a code commit + redeploy.

| Symptom | Likely cause | What the build agent does |
|---|---|---|
| `securityheaders.com` returns less than A grade | CSP allowlist gap (e.g. missed Clerk regional subdomain or Stripe-style payment provider not yet enumerated) | Re-tune `cspDirectives` in `next.config.ts`; verify against the deploy URL; redeploy. |
| Sentry events not arriving from production | Missing init config, edge runtime SDK gap, or wrong sample rate | Inspect `instrumentation.ts`, `sentry.*.config.ts`, redeploy. |
| Smoke flow fails because a server action throws an uncaught error | Logic bug or missing migration on prod DB | Diagnose, fix, ship a hotfix commit; verify with E2E or unit test. |
| Service worker fetch failures or stale cache after a deploy | `VERSION` constant in `public/sw.js` not bumped (R-F2-05); precached path mismatch | Bump `VERSION`, commit, redeploy; OR add a CI gate (Phase 2 hardening). |
| Signed-URL flow under HTTPS returns 410 unexpectedly | `STORAGE_SIGNATURE_TTL` mismatch, clock skew, or env var wiring | Inspect `lib/storage/driver.ts` HMAC token verification; fix or document. |
| `/api/webhooks/clerk` returns 5xx under load | Idempotency table not migrated, or webhook secret mismatch | Check migration `20260429160000_d13_webhook_events`; verify CLERK_WEBHOOK_SECRET wiring. |
| New Lighthouse score below 95 (Accessibility / Best Practices) on the live deploy | Regression introduced post-E.3 | Re-run axe + Lighthouse; ship targeted fix per the `karis-stone-500` carryover (R-E3-01) precedent. |
| Bubblewrap `bubblewrap update` fails with manifest mismatch on a future release | `app/manifest.ts` changed structure; TWA manifest drift | Reconcile `marketing/play-store/twa-manifest.json` with the live manifest. |
| Anything that reproduces in dev (`pnpm dev`) but not on production deploy | Env var difference, build-time vs runtime behavior, or NODE_ENV gating | Diff `.env` vs deploy vault; inspect runtime conditionals (e.g. the `/api/auth/token` NODE_ENV guard documented in D-F2-05). |

### Owner-resolves operationally (no build session needed)

These are **provider-dashboard or operational** items. The build agent cannot help — only the owner has access.

| Symptom | Resolution |
|---|---|
| Resend domain not verifying | Re-check DNS records; wait for propagation; contact Resend support |
| Clerk MFA strategy not enabled | Clerk dashboard → Authentication → Multi-factor → enable backup-code TOTP strategy |
| Clerk webhook signature failures | Re-fetch webhook secret from Clerk dashboard; update vault; redeploy |
| Upstash Redis not reachable | Check region; verify URL/TOKEN; allowlist deployment platform IPs if applicable |
| Supabase free-plan retention insufficient | Upgrade to Pro plan (R-D12-02) — Phase A step A6 |
| Storage encryption key lost | **Unrecoverable** — reset key, accept loss of pre-rotation files (R-D12-03 — keep two backups) |
| AAB build fails on `bubblewrap build` | JDK version, keystore passphrase, Android SDK install — diagnose locally |
| Asset Links verification fails (TWA shows address bar) | `/.well-known/assetlinks.json` 404, wrong fingerprint, or wrong package name; fix file content + redeploy |
| Play Console reviewer flags "Privacy policy URL not reachable" | `/privacy` requires no auth and must return 200; verify D7 still passes after any redeploy |
| Counsel returns substantial revisions to legal text | Apply edits (Phase E2), commit, redeploy; verify D7 |
| Play Console review takes longer than 7 days | Normal for first submissions; do not re-submit unless you change the AAB |
| Internal testing crash rate > 0.5% per 1k users | Pull the Pre-launch report; correlate with Sentry; if code-related → escalate to build agent (Bug class), else operational (config) |
| Sub-processor flag from Play Console reviewer (Clerk / Resend / Sentry / Supabase / Upstash) | Edit Data Safety form per their note (`play-store-data-safety.md` §D treats them as processors-not-sharers); re-submit |

### Borderline — could be either

These items might be operational OR code-side; diagnose first.

| Symptom | First check | If… |
|---|---|---|
| Sign-in flow times out | Browser console + network tab → Clerk request status | Clerk-side latency → operational; if `/api/auth/*` 5xx → build-agent |
| `/api/cron/leases` not running | Vercel cron config (B6) | Cron not registered → operational; if running but failing → build-agent (inspect logs) |
| Settlement approval doesn't update wallet balance | `/admin/audit-log` for the action; reconciliation report at `/admin/treasury/reconciliation` | Reconciliation MISMATCH → likely a transaction concurrency edge case → build-agent; if no audit row at all → user permission issue → operational |
| Email queued but not sent | `/admin/email-log` row for the action | Resend rate limit → operational (chunking is in place; founding cohort small); if EmailLog shows `failed` with error → build-agent |

---

## 6. Quick-reference daily checklist

Print this. Tick each box as you complete it.

### Day 1
- [ ] Phase A complete (A1–A8) — every provider account has a vault entry
- [ ] Storage encryption key generated + 2 backups confirmed (R-D11-01)
- [ ] Phase B B1–B6 complete — production URL live, build zero-warning, cron entries present

### Day 2
- [ ] Phase C C1–C6 captured (headers, smoke flows, Sentry, Resend, snapshot)
- [ ] **Phase C C2 — `securityheaders.com` A grade screenshot saved (R-F1-03 closed)**
- [ ] Phase D D1–D7 captured (PWA Manifest, SW, offline, Android install, manifest curl, assetlinks curl, legal pages render)

### Day 3
- [ ] Phase C C7 — D.12 restore drill executed against staging; drill log filed (R-D12-01 closed)
- [ ] Phase C C8 — system wallet floors set in `/admin/treasury` (R-D14-01 closed)
- [ ] Phase E E1 — drafts sent to counsel (start the parallel waiter)

### Day 4
- [ ] Phase F F1–F4 — JDK, Bubblewrap, init, keystore + 2 backups
- [ ] Phase F F5 — `bubblewrap build` produces signed AAB; SHA-256 fingerprint captured
- [ ] **Phase F F6 — `assetlinks.json` updated with real fingerprint, redeployed (R-F2-02 closed)**
- [ ] Phase F F7 — APK installed on real Android, address bar absent (R-F2-01 closed at the build-and-install level)
- [ ] Authenticated screenshots run via `SCREENSHOT_INCLUDE_AUTHENTICATED=1 pnpm pwa:screenshots` — 3 new PNGs in `marketing/play-store/screenshots/` (D-F2-04 capture closed)

### Day 5
- [ ] Phase G G1–G7 — Play Console developer account + listing + rating + data safety + target audience + AAB upload to Internal track
- [ ] Phase G G8 — founding cohort tester list; opt-in link sent
- [ ] Phase G G9 — submission queued for Play Store review

### Day 6–7
- [ ] Wait on Play Store review queue (pre-launch report should appear)
- [ ] Wait on counsel review (Phase E2–E5 happens in this window)
- [ ] When counsel returns: apply edits (E2), commit, redeploy, confirm D7 final-text screenshots (E5 — R-F2-03 closed)
- [ ] Phase G G10 — internal cohort installs via opt-in link; collect smoke-test feedback

### Week 2+
- [ ] Phase H H1 — promote to Closed testing once Internal is ≥ 7 days clean
- [ ] Phase H H3 — confirm counsel-approved legal text is live before promoting Production
- [ ] Phase H H4 — promote to Production; watch Vitals + Sentry for 72 h
- [ ] Phase I — daily Sentry triage for first month; weekly audit-log spot-check

---

## 7. When in doubt

- **Procedure question** → `website/docs/go-live.md`, then the linked sub-runbook (`production-deploy.md`, `play-store.md`, `backup-and-restore.md`, etc.)
- **"Why is this here?"** → `qa/decision-log.md` (every decision logged with alternatives + consequences)
- **"What happens if this breaks?"** → `qa/risk-register.md` (every risk has a mitigation)
- **"What was already verified?"** → `qa/evidence-index.md` (every code/test/screenshot/report indexed by prompt)
- **"Did the build agent finish?"** → `qa/final-phase1plus-readiness.md` §1 verdicts + §2 line-by-line walk
- **"Which Phase 1+ closures happened in the closure session?"** → `qa/block-F-checkpoint.md` §5
- **Code fault on the live deploy** → §5 above (escalation list); re-engage the build agent only when the symptom matches an "Escalate" row

When every box in §6 above is ticked AND the §9 audit's three Conditional verdicts have all flipped to Go, **Phase 1+ is live**. Welcome to ops.
