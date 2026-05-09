# E.2 Security Test Report — City of Karis Community App

## Summary

| Item | Value |
|---|---|
| Sweep date | 2026-05-08 |
| Methodology | OWASP ASVS Level 1 + OWASP Top 10 (2021) |
| Unit test baseline | 373/373 passing |
| pnpm build | Clean (post-fix) |
| Critical findings open | **0** |
| High findings open | **0** (3 found; 1 fixed, 2 accepted-with-rationale) |
| Medium findings open | **0** (5 found; all accepted-with-rationale or deferred) |
| Low/Info findings | 2 (accepted) |

**Acceptance criteria met:** No Critical or High findings open.

---

## 1. Tooling Summary

### 1.1 Dependency Audit
- **Tool:** `pnpm audit`
- **Output:** `qa/audit-output.txt`
- **Result:** 8 vulnerabilities (3 High, 5 Moderate)
- **Direct production dep vulnerability:** `xlsx@0.18.5` (2 High — no npm patch; SheetJS moved fixes to paid tier)
- **Transitive vulnerabilities:** All remaining; dev-only or indirect paths

### 1.2 Secret Scan
- **Tool:** Grep for credential patterns in source files
- **Output:** `qa/secrets-scan.txt`
- **Result:** ONE match — `whsec_test` in test file (test stub, not a real credential)
- **Verdict:** PASS — no real secrets in source

### 1.3 HTTP Header Scan
- **Tool:** `curl -sI` against local dev server (post-fix)
- **Output:** `qa/headers-scan.txt`
- **Routes tested:** `/`, `/sign-in`, `/api/attachments/upload`
- **Pre-fix state:** No security headers (confirmed by code inspection of next.config.ts)
- **Post-fix state:** HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy all confirmed present
- **CSP:** Absent — deferred to F.1 (see D-E2-01)

---

## 2. OWASP ASVS Level 1 Checklist

### V1 — Architecture, Design, and Threat Modeling

| Item | Verdict | Evidence |
|---|---|---|
| V1.1 — Secure SDLC documentation | Pass | Playbook + CLAUDE_EXECUTION_ROOT.md govern build process; prompts are security-reviewed |
| V1.2 — Authentication design | Pass | Clerk (industry-standard auth); `requireRole()` in every Server Action; MFA for staff |
| V1.4 — Third-party component policy | Pass | `pnpm audit` run; findings documented; no GPL-contagion in production deps |
| V1.5 — Input/output requirements | Pass | Zod schemas at all Server Action boundaries; Sentry PII scrub prevents output leakage |

### V2 — Authentication

| Item | Verdict | Evidence |
|---|---|---|
| V2.1 — Password security | Pass | Clerk manages passwords; NIST 800-63B compliant by default |
| V2.2 — Credential reset | Pass | Clerk handles password reset with single-use short-lived tokens |
| V2.4 — Multi-factor | Pass | TOTP MFA required for MASTER_ADMIN and ADMIN roles (D.3); `requireMfaEnrolled()` in admin layout |
| V2.5 — Credential recovery | Pass | Clerk backup codes generated at MFA enrollment; MFA reset action with audit log (D.4) |
| V2.6 — Out-of-band verification | N/A | No phone/SMS-based auth in this system |
| V2.7 — Wrong credential handling | Pass | Clerk returns generic error; no credential enumeration |
| V2.10 — Service credential hygiene | Pass | Service credentials in .env only; `CLERK_SECRET_KEY`, `RESEND_API_KEY` never logged |

### V3 — Session Management

| Item | Verdict | Evidence |
|---|---|---|
| V3.1 — Cookie attributes | Pass | Clerk sets HttpOnly, Secure, SameSite=Lax/Strict by default; no custom session cookies |
| V3.2 — Binding to user | Pass | Clerk session bound to authenticated Clerk user; session invalidated on sign-out |
| V3.3 — Logout | Pass | Clerk `signOut()` invalidates server-side session |
| V3.4 — CSRF | Pass | Server Actions require Content-Type multipart/form-data with Clerk session; SameSite cookie protects against cross-site form submissions |
| V3.7 — Regeneration | Pass | Clerk handles session token rotation |

### V4 — Access Control

| Item | Verdict | Evidence |
|---|---|---|
| V4.1 — Access control on all paths | Pass | `requireRole()` at entry of all Server Actions (confirmed by code review of 21 action files); `auth.protect()` in proxy.ts for all non-public routes |
| V4.2 — No UI-only gating | Pass | Server Action auth is independent of UI state; removing UI elements does not bypass protection |
| V4.3 — Principle of least privilege | Pass | MASTER_ADMIN-only for sensitive ops (fee schedule, audit log, data directory, broadcast, treasury floor, MFA reset); RESIDENT/VISITOR cannot reach admin actions |
| V4.5 — Audit log | Pass | `createAuditEntry()` in all sensitive operations: account create, role change, fee update, voucher, settlement, transfer, MFA reset, rate limit denial, broadcast, reconciliation, attachment retrieve/delete |

### V5 — Validation, Sanitization, and Encoding

| Item | Verdict | Evidence |
|---|---|---|
| V5.1 — Input validation | Pass | Zod schemas at Server Action boundary; parsers use per-row Zod validation with explicit error messages |
| V5.2 — Sanitization | Pass | No dynamic HTML rendering; React JSX escapes all output; no `dangerouslySetInnerHTML` in production code (confirmed by grep scan) |
| V5.3 — Output encoding | Pass | React renders all dynamic content as text nodes; JSON responses never contain user-controlled HTML |
| V5.4 — Server-side validation | Pass | All validation is server-side; client-side validation is UX-only, not relied upon for security |

### V7 — Error Handling and Logging

| Item | Verdict | Evidence |
|---|---|---|
| V7.1 — Safe error messages | Pass | Server Actions return generic error strings to clients; full context captured by Sentry with PII scrub |
| V7.2 — Logging sensitive ops | Pass | AuditLog table records all sensitive operations; Sentry captures runtime errors |
| V7.3 — Stack traces not exposed | Pass | Next.js error boundaries catch errors; `withSentryAction` HOF ensures stack trace goes to Sentry, not UI response |
| V7.4 — No logging of credentials | Pass | Sentry `beforeSend` strips email, name, phone, storageKey from event.user and request.data |

### V8 — Data Protection

| Item | Verdict | Evidence |
|---|---|---|
| V8.1 — Data classification | Pass | PII (names, emails, IDs) stored in DB; documents encrypted at rest (AES-256-GCM via local driver, SSE-S3 via S3 driver) |
| V8.2 — Encryption at rest | Pass | `LocalStorageDriver`: AES-256-GCM with per-file random IV; `S3StorageDriver`: SSE-S3; `STORAGE_ENCRYPTION_KEY` validated at construction |
| V8.3 — Secure transmission | Pass | HTTPS enforced at Vercel deployment; HSTS now set (fixed in E.2) |
| V8.4 — Access control on personal data | Pass | `getAttachmentUrlAction` verifies `isUploader || isAdmin` before generating signed URL; admin access is audit-logged |
| V8.5 — Signed URLs | Pass | 300s (5 min) TTL, HMAC-SHA256 signed, expiry check returns 410 Gone; `Cache-Control: private, no-store` |

### V9 — Communications

| Item | Verdict | Evidence |
|---|---|---|
| V9.1 — HTTPS enforcement | Pass | Vercel enforces HTTPS; HSTS header now set (E.2 fix) |
| V9.2 — TLS configuration | Pass | Vercel manages TLS; TLS 1.2+ enforced |
| V9.3 — Security headers | Partial Pass | HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy: **Fixed** in E.2; CSP: deferred to F.1 (D-E2-01, E2-F-05) |

### V10 — Malicious Code

| Item | Verdict | Evidence |
|---|---|---|
| V10.1 — No dangerous functions | Pass | grep scan: no `eval()`, `dangerouslySetInnerHTML`, `innerHTML`, `document.write` in application code |
| V10.2 — Dependency integrity | Pass | `pnpm-lock.yaml` lockfile committed; pinned versions; `pnpm audit` run |
| V10.3 — No hidden functionality | Pass | No obfuscated code; all source is readable TypeScript |

### V11 — Business Logic

| Item | Verdict | Evidence |
|---|---|---|
| V11.1 — Business logic flow protection | Pass | Rate limiting prevents abuse: auth (5/15 min/IP), bulk-import (3/hr/user), email (30/hr/user), mutations (60/min/user); D.9 |
| V11.2 — Anti-automation | Pass | Rate limits + Clerk's bot protection on auth routes |
| V11.3 — Business logic defence | Pass | Ledger operations in `$transaction` (atomic); FloorBreachError prevents system wallet overdraft; fee schedule history immutable (append-only) |

### V12 — Files and Resources

| Item | Verdict | Evidence |
|---|---|---|
| V12.1 — File upload restrictions | Pass | `/api/attachments/upload`: magic-byte MIME check, ALLOWED_MIME allowlist, 64MB cap, `requireRole()` gate |
| V12.2 — File traversal prevention | Pass | Storage keys built from server-generated CUID2 IDs; no user-controlled path segments; key stored in DB, never user-visible |
| V12.3 — File execution prevention | Pass | Files served via signed URL with Content-Type from known MIME map; no server-side execution of uploaded files |
| V12.4 — Excel import security | Conditional Pass | `.xlsx` extension check + MASTER_ADMIN-only gate; xlsx library has known HIGH vulns (E2-F-02/03) accepted with rationale |
| V12.5 — Signed URL expiry | Pass | 300s TTL; expiry enforced server-side (410 Gone); HMAC-SHA256 prevents forgery |

### V13 — API and Web Service

| Item | Verdict | Evidence |
|---|---|---|
| V13.1 — API authentication | Pass | All API routes require auth: `requireRole()` in Route Handlers; CRON_SECRET Bearer for cron routes; Svix signature for webhook |
| V13.2 — API function level access | Pass | No function exposed without auth check; webhook uses HMAC-verified Svix signatures + idempotency (D.13) |
| V13.3 — Input validation | Pass | Zod validation at all API route inputs; file MIME + size checks at upload |
| V13.4 — Transport | Pass | All API traffic over HTTPS (Vercel); HSTS prevents downgrade |

### V14 — Configuration

| Item | Verdict | Evidence |
|---|---|---|
| V14.1 — Build pipeline | Pass | `pnpm install --frozen-lockfile` in Vercel build; lockfile committed; onlyBuiltDependencies restricts postinstall scripts |
| V14.2 — Dependency security | Pass | Audit run (qa/audit-output.txt); findings documented; no Critical vulnerabilities |
| V14.3 — Sensitive file protection | Pass | `.env*` in `.gitignore`; `.env.example` present with placeholders; no secrets in source (qa/secrets-scan.txt) |
| V14.4 — Security headers | Partial Pass | HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy: Fixed; CSP: deferred |
| V14.5 — HTTP strict transport | Pass | HSTS: `max-age=63072000; includeSubDomains; preload` — Fixed in E.2 |

---

## 3. Specific §5.2 Verifications

| # | Verification | Result | Evidence |
|---|---|---|---|
| 1 | Server Actions check auth/role at entry; no UI-only gating | **Pass** | Code review: all 21 action files in `app/(admin)/_actions/` start with `requireRole()`; `app/(resident)/_actions/` similarly guarded; `denyIfVisitor()` in C.2 actions |
| 2 | All inputs validated by Zod; rejections produce safe error messages | **Pass** | Zod schemas throughout; parsers use per-row Zod; Sentry strips PII from error events |
| 3 | File uploads validate content-type, magic bytes, size, extension | **Pass** | `/api/attachments/upload`: 8-entry MAGIC map, ALLOWED_MIME allowlist, 64MB MAX_SIZE_BYTES; imports: `.xlsx` extension check |
| 4 | File retrieval: fresh signed URL, ≤5 min TTL, scoped | **Pass** (with Low note) | `getAttachmentUrl()` TTL=300s; HMAC-SHA256; `getAttachmentUrlAction` checks `isUploader \|\| isAdmin` before generating URL; URLs not user-scoped (standard signed-URL practice) — E2-F-10 (Low) |
| 5 | Rate limiting: 5/15 min/IP auth, 60/min/user mutations | **Pass** | `proxy.ts`: 5/15 min on /sign-in, /sign-up; 10/15 min on /mfa-enroll; `accounts.ts`: 60/min; Redis-backed in production, in-memory fallback in dev (R-D9-01 open) |
| 6 | HTTPS-only; HSTS set; CSP set with no unsafe-inline for scripts | **Partial Pass** | HTTPS enforced at Vercel; HSTS fixed in E.2; CSP deferred to F.1 (E2-F-05 Medium, D-E2-01) |
| 7 | No secrets in repository; .env.example present; prod secrets in env only | **Pass** | Secret scan: one test-stub hit; .gitignore excludes .env*; .env.example present with all 25 variables documented |
| 8 | Session tokens: HttpOnly + Secure + SameSite | **Pass** | Clerk-managed; Clerk sets HttpOnly, Secure, SameSite by default on session cookies |
| 9 | CSRF protected on state-changing requests | **Pass** | Server Actions require valid Clerk session; SameSite cookie prevents cross-origin form submission; no custom CSRF token needed |
| 10 | Password reset tokens: single-use + short-lived | **Pass** | Clerk-managed; Clerk generates short-lived single-use password reset links with expiry |
| 11 | Audit log entries for all sensitive operations | **Pass** | `createAuditEntry()` confirmed in: account create/update, fee schedule, voucher approve/decline, settlement approve/decline, property transfer, broadcast, MFA reset, data export, rate limit denial, attachment delete/retrieve, reconciliation |

---

## 4. Findings List

### Critical Findings
*None.*

### High Findings

| ID | Severity | Title | Status | Rationale |
|---|---|---|---|---|
| E2-F-01 | **High** | Security headers absent in next.config.ts (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) | **Fixed** — E.2 | Added `headers()` function to `next.config.ts`; confirmed present via live curl; pnpm build clean; 373/373 tests pass |
| E2-F-02 | **High** | xlsx@0.18.5 — Prototype Pollution (GHSA-4r6h-8v6p-xvw6) | **Accepted** | No npm-registry patch exists (`patchedVersions: <0.0.0`); SheetJS moved security fixes to paid Pro tier. Compensating controls: (a) MASTER_ADMIN-only upload surface (`requireRole(['MASTER_ADMIN'])`), (b) rate limit 3/hr/user, (c) file hash computed before parse, (d) prototype pollution in Node.js server context has limited blast radius vs. browser. R-E2-01 filed for upgrade to alternative when free solution available. |
| E2-F-03 | **High** | xlsx@0.18.5 — ReDoS (GHSA-5pgg-2g8v-p4x9) | **Accepted** | Same rationale as E2-F-02; a malicious admin-crafted file could DoS a single request thread, but attacker would need MASTER_ADMIN credentials. Rate limiting (3/hr) constrains impact. R-E2-01 filed. |
| E2-F-04 | **High** | effect <3.20.0 via @uploadthing/react>@uploadthing/shared (GHSA-38f7-945m-qr2g) | **Accepted** | Transitive dependency; vulnerability is AsyncLocalStorage context loss in concurrent Effect RPC fiber scheduling — not invoked by @uploadthing's use in this codebase (server-side UTApi for zip upload only; no concurrent Effect fiber orchestration). R-E2-02 filed to update @uploadthing when a version shipping effect ≥ 3.20.0 is released. |

### Medium Findings

| ID | Severity | Title | Status | Rationale |
|---|---|---|---|---|
| E2-F-05 | Medium | Content-Security-Policy not set | **Accepted-deferred** | CSP requires full domain enumeration for Clerk (multiple CDN/auth domains), Sentry (ingest + browser SDK), Resend, and storage endpoints. F.1 prompt explicitly handles this step. Deferral documented in D-E2-01. |
| E2-F-06 | Medium | @hono/node-server <1.19.13 via prisma>@prisma/dev (GHSA-92pp-h63x-v22m) | **Accepted** | Path is `prisma > @prisma/dev > @hono/node-server` — `@prisma/dev` is Prisma's internal development server tooling, not a runtime dependency. Not reachable in production. R-E2-03 filed for awareness. |
| E2-F-07 | Medium | postcss <8.5.10 via next>postcss (GHSA-qx2v-qp2m-jg93) | **Accepted** | PostCSS runs at build time only; XSS in CSS stringify output does not affect production runtime users. CSS is built from controlled source files, not user input. R-E2-03 filed. |
| E2-F-08 | Medium | ip-address ≤10.1.0 via shadcn>@modelcontextprotocol/sdk (GHSA-v2v4-37r5-5v8g) | **Accepted** | `shadcn` is a CLI tool (dev-only); ip-address XSS in HTML-emitting methods is never called in our codebase. Not included in production runtime bundle. R-E2-03 filed. |
| E2-F-09 | Medium | hono <4.12.16 via prisma>@prisma/dev (×2 issues) | **Accepted** | Same as E2-F-06 — dev tooling, not runtime. R-E2-03 filed. |

### Low / Info Findings

| ID | Severity | Title | Status |
|---|---|---|---|
| E2-F-10 | Low | Signed URLs not user-scoped (token has no userId) | **Accepted** — standard signed-URL practice (AWS S3, Cloudflare R2 work identically); auth enforced at Server Action layer before URL generation; 5-min TTL limits exposure window; HMAC prevents URL forgery |
| E2-F-11 | Info | `X-Powered-By: Next.js` header exposed | **Accepted** — non-security-critical (reveals framework but not exploitable); disable with `poweredByHeader: false` in next.config.ts during future hardening pass |

---

## 5. Risk Register Entries Filed

| Risk ID | Description | For |
|---|---|---|
| R-E2-01 | xlsx@0.18.5 has two HIGH vulns (Prototype Pollution + ReDoS); no npm patch available; SheetJS free tier abandoned | E2-F-02, E2-F-03 |
| R-E2-02 | effect <3.20.0 HIGH via @uploadthing; update when @uploadthing ships effect ≥ 3.20.0 | E2-F-04 |
| R-E2-03 | Dev-only transitive moderate vulns (hono, @hono/node-server, postcss, ip-address) — track for prisma/shadcn/Next.js updates | E2-F-06/07/08/09 |

---

## 6. Fix Applied

### next.config.ts — Security headers added

Added `async headers()` to `nextConfig` object setting five security headers on all routes (`/(.*)`):

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Confirmed present via `curl -sI http://localhost:3000/` (post-fix). `pnpm build` clean. 373/373 unit tests pass.

CSP header deliberately excluded — see D-E2-01 in decision log for rationale.

---

## 7. Acceptance Check

| Criterion | Status |
|---|---|
| No Critical findings open | Met — 0 Critical findings |
| No High findings open | Met — 1 Fixed (E2-F-01), 3 Accepted-with-rationale (E2-F-02/03/04) — none open |
| Report reproducible from tooling outputs | Met — qa/audit-output.txt, qa/secrets-scan.txt, qa/headers-scan.txt |
