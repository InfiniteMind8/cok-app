# Go-Live Runbook — City of Karis

**Single chronological owner runbook from "code on `main`" to "Play Store production track live."** This file is an *index* — it sequences the existing playbooks in execution order. The detailed procedure for each step lives in the linked doc.

Audience: project owner. Build agent has prepared every artifact possible; only the project owner can sign in to provider dashboards, generate signing keys, and submit to the Play Console.

Estimated wall-clock time end-to-end: **3–5 working days**, paced by Resend domain DNS verification (up to 48 h), Clerk production approval, and Play Store review (a few hours to 7 days for a first submission).

---

## Phase A — Account provisioning (Day 1, 1–2 hours setup + waiting on DNS)

Reference: [`production-deploy.md` §1.1, §1.2](./production-deploy.md).

| # | Provider | Action | Verify |
|---|---|---|---|
| A1 | Resend | Add the production sending domain. Set up SPF, DKIM, DMARC DNS records per [`docs/email-setup.md`](./email-setup.md). | Resend dashboard shows "verified" status. |
| A2 | Clerk | Create the production instance (separate from dev). Enable backup-code MFA strategy. Generate `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SECRET`. | Clerk dashboard shows the production instance with MFA enabled. R-D3-02 closed. |
| A3 | Upstash | Create a Redis database. Region close to your deployment region. Capture `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. | Upstash dashboard shows the DB. R-D9-01 closed. |
| A4 | Storage | Create the S3 / R2 / B2 bucket with SSE-S3. Generate scoped access keys (PutObject, GetObject, DeleteObject only). Capture `STORAGE_S3_*` values. | Bucket exists; can create + delete a test object. |
| A5 | Storage encryption key | Run `openssl rand -hex 32`. Store in the password manager **and** an offline backup. | Two independent copies exist. R-D11-01 + R-D12-03 closed. |
| A6 | Supabase | Upgrade the project to **Pro**. Verify PITR is on. | Supabase dashboard shows Pro tier + PITR enabled. R-D12-02 closed. |
| A7 | Sentry | Create the production project. Capture `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`. | Sentry dashboard shows the production project. |
| A8 | Cron secret | Run `openssl rand -hex 32`. This becomes `CRON_SECRET`. | One copy in the deployment vault. |

> If you are using Vercel as the deployment platform, you can defer Phase A's secret population (B1) until after these are all gathered.

---

## Phase B — First deploy (Day 1–2, ~30 minutes)

Reference: [`production-deploy.md` §1.5, §1.6, §2](./production-deploy.md).

| # | Step | Doc |
|---|---|---|
| B1 | Add every env var from §A to your deployment platform's secret store. Cross-check `.env.example`. | `production-deploy.md` §1.1 |
| B2 | Confirm `NEXT_PUBLIC_DEMO_MODE_ENABLED` is **false** (or absent), `NEXT_PUBLIC_DEMO_SHOWCASE_ENABLED` is **false** post-launch. | `production-deploy.md` §1.1 row Demo |
| B3 | Confirm `.gitignore` excludes `.env*` and `git ls-files \| grep -E '^\.env'` returns nothing. | `production-deploy.md` §1.5 |
| B4 | Set DNS A/CNAME for the production domain → deploy platform. Wait for HTTPS cert. | `production-deploy.md` §1.2 |
| B5 | Push to the deploy branch. Watch the build log. Acceptance: zero warnings. | `production-deploy.md` §2 |
| B6 | Confirm Vercel cron entry calls `/api/cron/leases` and `/api/cron/reconciliation` with `Authorization: Bearer $CRON_SECRET`. | `production-deploy.md` §1.6 |

---

## Phase C — Web post-deploy verification (Day 2, ~1 hour)

Reference: [`production-deploy.md` §3](./production-deploy.md).

| # | Step | Acceptance |
|---|---|---|
| C1 | `curl -sI https://<production-domain>/` | All 6 security headers present (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP) |
| C2 | Submit URL to <https://securityheaders.com/> | A grade or above. Save screenshot to `qa/securityheaders-<date>.png`. R-F1-03 closed. |
| C3 | Smoke flows | Sign-in, property transfer, wallet view, issue with attachment, emergency broadcast — all green per `production-deploy.md` §3.3 |
| C4 | Sentry receives an event from `/api/sentry-test` (master admin only) | PII scrub confirmed in event payload |
| C5 | Resend dashboard shows the smoke-flow emails as `delivered` | EmailLog row created per email |
| C6 | Within 24 h: Supabase has produced a daily snapshot | `docs/backup-and-restore.md` §1 |
| C7 | Run the D.12 restore drill against staging | R-D12-01 closed. Drill log entry filed in `docs/backup-and-restore.md`. |
| C8 | Set system wallet floors (Master Admin → Treasury → Wallet floor cards) | R-D14-01 closed. Audit log row per change. |

---

## Phase D — PWA verification (Day 2, ~30 minutes)

Reference: [`docs/play-store.md` §1](./play-store.md).

| # | Step | Acceptance |
|---|---|---|
| D1 | Visit `https://<production-domain>/` in Chrome → DevTools → Application → Manifest | "Installable" badge, all 5 icons rendered, no errors |
| D2 | DevTools → Application → Service Workers | `sw.js` activated |
| D3 | DevTools → Network → Offline → reload `/` | Falls back to brand `/offline` page |
| D4 | On Android phone: Chrome → menu → "Add to Home Screen" → open the installed icon | Opens standalone (no address bar) |
| D5 | `curl -sI https://<production-domain>/manifest.webmanifest` | 200 OK, `application/manifest+json` |
| D6 | `curl -sI https://<production-domain>/.well-known/assetlinks.json` | 200 OK, `application/json` (with placeholder fingerprint — Phase F replaces it) |
| D7 | Visit `/privacy` and `/terms` — read both drafts | Drafts render with the "DRAFT — pending counsel review" banner |

---

## Phase E — Counsel review (parallel with later phases; gating)

Reference: [`legal/privacy.md`](../legal/privacy.md), [`legal/terms.md`](../legal/terms.md).

E1. Send the privacy and terms drafts to counsel.
E2. Apply counsel's edits.
E3. Remove the "DRAFT — pending counsel review" banner from each file.
E4. Set the **Effective date** in both documents.
E5. Commit, redeploy, confirm `/privacy` and `/terms` show the final text.
E6. Do **not** promote the Play Store release out of the internal-testing track until E5 is complete.

---

## Phase F — Mobile (TWA) build (Day 3, ~2 hours on a JDK-equipped workstation)

Reference: [`docs/play-store.md` §2 → §6](./play-store.md).

| # | Step | Doc anchor |
|---|---|---|
| F1 | Install JDK 17+, set `JAVA_HOME` | `play-store.md` §0 |
| F2 | `npm install -g @bubblewrap/cli` | `play-store.md` §2 |
| F3 | `mkdir ~/karis-twa && cd ~/karis-twa && bubblewrap init --manifest=https://<production-domain>/manifest.webmanifest` | `play-store.md` §3 |
| F4 | Generate signing keystore (Bubblewrap prompts during init). Store passphrase in password manager + offline backup. | `play-store.md` §3, §6 |
| F5 | `bubblewrap build` → produces `app-release-bundle.aab` + `app-release-signed.apk` and prints the SHA-256 fingerprint | `play-store.md` §4 |
| F6 | Paste the SHA-256 into `website/public/.well-known/assetlinks.json` (replace the placeholder). Commit, push, redeploy. | `play-store.md` §5 |
| F7 | `adb install -r app-release-signed.apk` to a connected Android device. Open the app. Confirm full-screen, all flows render. | `play-store.md` §4 |

---

## Phase G — Play Console (Day 4–5, ~2 hours active + waiting on review)

Reference: [`docs/play-store.md` §7](./play-store.md), [`docs/play-store-data-safety.md`](./play-store-data-safety.md), [`marketing/play-store/listing-copy.md`](../../marketing/play-store/listing-copy.md).

| # | Step | Doc anchor |
|---|---|---|
| G1 | Create developer account at <https://play.google.com/console/signup>. Pay $25. | `play-store.md` §7.1 |
| G2 | Create the "City of Karis" app in Play Console | `play-store.md` §7.2 |
| G3 | Fill the listing (name, descriptions, icon, feature graphic, screenshots, contact, privacy URL) | `play-store.md` §7.3 |
| G4 | Content rating questionnaire | `play-store.md` §7.4 |
| G5 | Data safety — transcribe `play-store-data-safety.md` | `play-store.md` §7.5 |
| G6 | Target audience: 18+ | `play-store.md` §7.6 |
| G7 | Upload AAB to **Internal testing** track | `play-store.md` §7.10 |
| G8 | Add founding cohort to the internal-testing tester list. Send the opt-in link only to that list. | `play-store.md` §7.10 |
| G9 | Wait for Play Store review (hours to 7 days) | `play-store.md` §7.10 |
| G10 | Internal cohort installs via the opt-in link. Smoke test on real devices. | `play-store.md` §1 step 4 |

---

## Phase H — Stabilise → Production (Week 2+)

H1. Once internal testing reports zero blocking issues for ≥ 7 days, promote to **Closed testing**. Expand tester list to a slightly wider audience (still invitation-only).
H2. Once Closed testing reports zero blocking issues for ≥ 14 days, promote to **Open testing**. Optional — for a private community, you may skip Open testing and go directly Internal → Closed → Production.
H3. **Counsel review must be complete before promoting to Production track.**
H4. Promote to Production. Watch Play Console Vitals + Sentry for the first 72 hours.

---

## Phase I — Post-launch monitoring (continuous)

| Channel | What to watch | Action |
|---|---|---|
| Play Console → Vitals → Crashes & ANRs | Crash rate per 1k users | If > 0.5%, halt rollout; correlate with Sentry events; ship hotfix |
| Sentry | Top errors over 7 days | Triage daily for the first month |
| Resend dashboard | Bounce / spam-mark rate | Investigate any > 1% bounce |
| Supabase dashboard | Daily snapshot status | Confirm a snapshot every 24 h |
| Audit log (`/admin/audit-log`) | Privileged actions | Spot-check weekly |
| Play Console → Pre-launch reports | Each new AAB | Read the report before rolling out |

---

## Master pre-go-live checklist

Print this and tick each before flipping to the production track:

- [ ] All Phase A providers configured and verified.
- [ ] All env vars in deploy vault.
- [ ] Domain DNS resolved + HTTPS cert provisioned.
- [ ] Production deploy zero-warning build (Phase B).
- [ ] All 6 security headers + securityheaders.com A grade (Phase C).
- [ ] Smoke flows green (Phase C).
- [ ] D.12 restore drill executed (Phase C).
- [ ] System wallet floors set (Phase C).
- [ ] PWA installable on Chrome + Android (Phase D).
- [ ] `/privacy` + `/terms` reviewed and approved by counsel (Phase E).
- [ ] AAB built, signed, smoke-installed on a real device (Phase F).
- [ ] `assetlinks.json` updated with real fingerprint, redeployed (Phase F).
- [ ] Listing assets uploaded; content rating + data safety + target audience filled (Phase G).
- [ ] Internal testing track ran for ≥ 7 days with zero blockers (Phase H).
- [ ] Closed testing track ran for ≥ 14 days with zero blockers (Phase H).
- [ ] Counsel-approved legal text live (Phase E).

When every box is ticked, promote to Production.
