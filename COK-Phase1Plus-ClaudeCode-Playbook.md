# CITY OF KARIS — COMMUNITY APP
## PHASE 1+ HARDENING & CONSISTENCY BUILD PLAYBOOK
### A Sequential Execution Guide for Claude Code

**Owner:** Dr. Karis Munroe, Founder, City of Karis
**Maintainer:** Amani Saif, Strategic Direction
**Build agent:** Claude Code (in Google Antigravity)
**Document version:** 1.0 — Phase 1+ (post-Phase 1 hardening & official-launch readiness pass)
**Status:** Authoritative. Supersedes Phase 1 playbook for any item in scope.

---

## How to use this playbook

This document has two halves.

**Part A (Sections I–V)** is the strategic brief: it tells Claude Code *what* to build, *why* it matters, *what good looks like*, and *how it must feel and behave* by the end. Read it once end-to-end before opening any prompt — every prompt assumes the brief has been internalised.

**Part B (Section VI)** is the execution sequence: a series of self-contained prompts to paste into Claude Code, in order. Each prompt is scoped to a single deliverable, ends with explicit acceptance criteria, and concludes with a report-back instruction so progress is auditable.

**Part C (Section VII + Appendices)** specifies the handover format and supplies reference data (color tokens, schemas, test matrices).

**Sequencing rule.** The blocks must run in order — fixes before features, features before hardening, hardening before quality gates, quality gates before deployment. Within a block, prompts may run in parallel only where explicitly noted.

---

# PART I — ENGAGEMENT BRIEF

## 1.1 Mission

The City of Karis Community App is the operational nervous system of an off-grid intentional community in Guyana. By the end of Phase 1+, the application must be:

1. **Functionally complete for its declared scope** — every feature listed as "Phase 1" or "Phase 1+" in the assessment performs as specified, with no half-wired flows.
2. **Brand-consistent and emotionally coherent** — the visual, typographic, and tonal language of the app must read as one continuous expression of the City of Karis brand from the sign-in screen to the deepest admin pane.
3. **Production-grade on the security, observability, and reliability axes** — appropriate for handling community money, member identity documents, and governance votes.
4. **Deployable to the Google Play Store** as a signed, listing-ready application bundle.
5. **Demonstrably tested** against four independent quality gates (technical, security, user experience, code quality) with documented evidence.

This is not an optimisation pass. It is the bridge from *a working MVP* to *a community-grade tool the Founder can hand to real residents on day one of operations*.

## 1.2 Quality bar

Every deliverable in this playbook is held to the following standard:

- **No partial wiring.** If a UI element exists, the action behind it must work. If an email is composed, it must be sent.
- **Every form is complete.** Every intake form captures every relevant field, supports the file uploads it should support, and writes a complete record.
- **Every popup and modal has correct edge spacing.** Content must never touch the modal frame; content must never be clipped.
- **Every page reflects the brand.** Brand colors, typography, and tone are enforced at the design-token level — no orphan pages with default styling.
- **Every action is auditable.** Mutations produce audit log entries with actor, timestamp, before/after where applicable.
- **Every error has a user-facing message.** No silent failures, no untranslated stack traces, no generic "Something went wrong."
- **Every secret stays in env.** No keys, tokens, or DSNs in the repository.
- **Every state is recoverable.** No flow leaves the user stranded; back, cancel, and retry paths always exist.

## 1.3 World-class skills invocation

Claude Code is to operate in this engagement as a senior product engineer with the following standing skill set actively engaged. These are the lenses through which every prompt in this playbook must be interpreted.

| Skill domain | Standard applied | What it means in practice |
|---|---|---|
| **UI design** | Apple HIG + Material 3 + WCAG 2.2 AA | Consistent spacing scale, type scale, motion language; minimum 44×44 px touch targets; minimum 4.5:1 text contrast. |
| **UX architecture** | Nielsen heuristics + jobs-to-be-done framing | Every flow has a clear primary action, a clear escape, and a clear success state. No dead ends. |
| **Frontend engineering** | React + Next.js App Router best practices, server-first by default | Server Components where possible; Client Components only where interactivity demands; strict typing; no untyped props. |
| **Backend engineering** | Server Actions + Prisma + Postgres conventions | Inputs validated with Zod at the boundary; transactions for multi-row writes; no SQL string concatenation; idempotency keys on critical mutations. |
| **Version control hygiene** | Conventional Commits + small focused PR-equivalent commits | Each prompt's work lands as a coherent commit with a clear message. No "fix stuff" commits. |
| **Application security** | OWASP ASVS Level 1, OWASP Top 10 (2021), OWASP API Security Top 10 | Authentication, authorization, input validation, output encoding, secret management, logging, error handling, dependency hygiene. |
| **API & action control** | Per-route rate limiting, request size caps, schema validation, deny-by-default authorization | No unauthenticated mutations; no client-trusted role claims; no unbounded inputs. |
| **Email & transactional notifications** | Resend best practices: verified domain, SPF/DKIM/DMARC, per-template tests, idempotent sends, provider error handling | Email delivery is treated as a first-class flow, not a side effect. Failures surface to the dashboard. |
| **Payment & confirmation flows** | Double-entry ledger discipline, decimal arithmetic, append-only history, reconciliation jobs | The K Credit ledger is sacred; no float math, no destructive updates, no orphan entries. |
| **Mobile distribution** | Google Play policy compliance, PWA + TWA (Trusted Web Activity) packaging, signed AAB, Play Console listing standards | App ships as a Play Store-listable Android package backed by the existing Next.js codebase. |
| **Accessibility** | WCAG 2.2 AA + Mobile Accessibility Guidelines | Keyboard navigable; screen-reader labelled; visible focus rings; respects `prefers-reduced-motion`; usable at 200% zoom. |
| **Observability** | Sentry error monitoring + structured logging + uptime checks | Every unhandled error reaches Sentry. Every audit-relevant action is logged. No surprises in production. |

Claude Code should treat these as standing instructions for the entire engagement, not as a one-time framing. If a prompt's literal text would violate one of these standards, Claude Code is to escalate (note the conflict in its report-back) rather than ship the violation.

## 1.4 Reference materials

The following artifacts are the source of truth for everything in this playbook. They are stored in the project repository or alongside it.

| Artifact | Authority |
|---|---|
| `HANDOVER.md` (Phase 1) | Authoritative inventory of what Phase 1 actually shipped, including known gaps. |
| `COK-Phase1-Assessment.docx` (Amani, this engagement) | Authoritative scoping document for Phase 1+ work; defines the 15 hardening items and the cost/effort envelope. |
| `COK-CommunityApp-AccountFunctions-V1.pdf` | Authoritative functional spec for all five account types (Master Admin, Admin, Vendor, Resident, Visitor). |
| `COK-CommunityApp-FeatureList.xlsx` | Authoritative feature matrix (112 rows) with phase allocation. |
| `3-CityofKaris-Strategic-Brand-Mapping.pdf` | Authoritative brand language: color palette, typography, tone, three-phase brand evolution. |
| `COK-Phase1-ClaudeCode-Playbook.md` | Phase 1 build playbook. Useful for context; superseded by this document for any conflict. |

Where this playbook conflicts with Phase 1 artifacts, this playbook wins. Where this playbook is silent, the functional spec and brand mapping govern.

## 1.5 Working agreement with Claude Code

Throughout this engagement, Claude Code is asked to:

1. **Read the brief block of every prompt before acting.** The brief explains the *why*; the steps explain the *what*. Skipping the brief produces literal-but-wrong implementations.
2. **Treat the K Credit ledger as sacred.** No prompt in this playbook authorises modification of the ledger module's invariants (append-only, double-entry, decimal-precise, transaction-wrapped). If a feature appears to require breaking these, escalate.
3. **Make small, well-named commits.** Use Conventional Commits format: `feat(scope): …`, `fix(scope): …`, `chore(scope): …`, `test(scope): …`. One prompt's work = one or a small handful of commits.
4. **Do not introduce new dependencies without justification.** Each new package incurs maintenance cost and security surface. Prefer composition of existing libraries. When a new dependency is genuinely needed, note it in the report-back with a one-line rationale.
5. **Update the schema migration log.** Every Prisma schema change is a numbered migration. No `prisma db push --force` against shared environments.
6. **Report back in the same structured format** at the end of each prompt:
   - **Done:** what was completed
   - **Files touched:** list
   - **New dependencies:** list, with rationale
   - **Tests added/updated:** list
   - **Known issues / deferred items:** list
   - **Validation evidence:** how you verified it works (test output, screenshot path, manual check)
7. **Never silently disable a test.** If a test must be skipped, mark it with a `// TODO(phase1+):` comment naming the prompt that will fix it, and surface it in the report-back.
8. **Ask one clarifying question if a prompt is genuinely ambiguous.** Do not invent requirements. If you must proceed without an answer, document the assumption explicitly.

---

# PART II — SCOPE OF PHASE 1+

This section is the canonical list of everything Phase 1+ must deliver. The execution prompts in Part VI implement this list block by block.

## 2.1 Block A — Phase 1 critical fixes (must-fix before anything else)

These are the three functional gaps the assessment identified in the Phase 1 build. Every one of them blocks real-world use.

| # | Item | Why it blocks deployment |
|---|---|---|
| A.1 | **Resend email delivery activation** | Resend is wired in code but no transactional email actually sends. Welcome emails, credentials, settlement notifications, password reset, voucher delivery all silently fail. Highest-impact gap. |
| A.2 | **Fee schedule editor (write capability)** | Master Admin can view fees but cannot change them. Any tariff adjustment currently requires a code deploy. |
| A.3 | **Approvals Center: complete remaining tabs** | Settlements tab works; Property Transfers, Vouchers, Rental Extensions tabs are stubs. Without these, every approval requires a database edit. |

## 2.2 Block B — Brand & UI consistency pass

The assessment flagged that several interface surfaces drift from the brand language and that intake forms are incomplete. Fix the surface so the application reads as one product.

| # | Item | Outcome |
|---|---|---|
| B.1 | **Brand-consistent sign-in page (with demo shortcut preserved)** | Sign-in page uses brand colors, brand typography, and brand voice. Existing six-account demo shortcut remains, gated behind a `DEMO_MODE_ENABLED` env flag, and is removed at official launch by toggling the flag. |
| B.2 | **Modal/popup edge & bleed pass** | Every modal in the app has correct interior padding, no clipped content, no flush-to-edge text. A consistent `Modal` primitive enforces the rule globally. |
| B.3 | **Intake form completion across all entries** | Every "add" or "edit" form (property, resident, visitor, vendor, voucher, etc.) captures every relevant field from the spec, supports photo and document uploads where appropriate, and persists a complete record. |

## 2.3 Block C — New functional requirements

Three substantive new capabilities introduced in Phase 1+ to bring the app in line with the operational model Dr. Munroe needs on day one.

| # | Item | Outcome |
|---|---|---|
| C.1 | **Multi-currency display & admin-set conversion + bonus incentives** | Every monetary amount in the UI can be displayed in K Credits, USD, or GYD per a per-user preference. Master Admin sets and edits the conversion rates between all three. Master Admin can run conversion-bonus promotions (e.g. "Founding members get +20 % K Credits on USD top-ups for 60 days"). The ledger remains denominated in K Credits — currency switching is a display-and-convert layer, never a ledger rewrite. |
| C.2 | **Visitor Groups system** | Master Admin can create named, themed visitor groups (e.g. "Corporate Training 1") with description, assign visitors to groups at account creation or after, and push group-targeted announcements/notifications. Visitors can only file issue reports and receive announcements addressed to their groups. Visitors have **no** community voting rights. |
| C.3 | **Rental cycle + extension request workflow** | Residents on a rental property show a clear rental cycle (daily / weekly / monthly / annual) and a "next payment due" date. Residents can submit a rental extension request specifying a new desired end date, which arrives in the Master Admin's Approvals Center. On approval, the lease end date and the next-payment-due cycle update accordingly; on decline, the resident receives a reasoned notification. |

## 2.4 Block D — Phase 1+ hardening

The fifteen items the assessment listed as required to move from "works on a good day" to "deployable in a community."

| # | Item | One-line outcome |
|---|---|---|
| D.1 | Bulk Excel import — members | Master Admin can import a spreadsheet of residents matching the schema; rows are validated and previewed before commit. |
| D.2 | Bulk Excel import — properties | Same, for properties; preview, validate, commit, with row-level error reporting. |
| D.3 | MFA enforcement for staff roles | Master Admin, Admin, and Accountant roles must enrol in MFA on first login; Resident, Vendor, Visitor are MFA-optional. |
| D.4 | Audit log viewer + Master Admin data directory | Master Admin has a filterable, exportable audit log view, plus a navigable directory of every user's records and uploads. |
| D.5 | Treasury reconciliation auto-alerts | A daily reconciliation job compares ledger sums to system wallet balances; mismatch produces an email + dashboard banner. |
| D.6 | Emergency broadcast | Master Admin has a one-click confirmed-action emergency broadcast to all active users (in-app banner + email). |
| D.7 | Onboarding tour | First-login guided overlay per role; dismissible; replayable from user menu. |
| D.8 | Sentry monitoring | Client and server errors flow to Sentry with environment tagging. |
| D.9 | Rate limiting on Server Actions | Per-user and per-IP limits on auth, mutations, and bulk operations. |
| D.10 | Playwright E2E coverage of critical paths | Ten E2E tests covering login, ledger transfer, voucher redemption, settlement approval, property transfer, voting, rental extension, bulk import, emergency broadcast, MFA enrolment. |
| D.11 | File storage strategy | All uploads land in an addressable, encrypted-at-rest layout with access-controlled retrieval. |
| D.12 | Backup & restore runbook | Documented procedure for nightly DB backup and point-in-time restore. |
| D.13 | Webhook handler for Clerk events | Tested handler covering user.created, user.updated, user.deleted with retry safety. |
| D.14 | System wallet floor protection | UI explanation when system wallets approach configured floor; soft-lock mutations that would breach. |
| D.15 | Full email template suite | Welcome, credentials, password reset, settlement confirmation, voucher delivery, rental extension decision, emergency broadcast — all real and tested. |

## 2.5 Block E — Quality gates

Four independent test sweeps. Each produces a documented evidence file in `/qa/`. None may be skipped, none may be self-graded as passing without the evidence file present.

| # | Sweep | Output |
|---|---|---|
| E.1 | Technical function test sweep | `/qa/function-test-report.md` — every flow walked, pass/fail per flow, screenshots for failures. |
| E.2 | Security test sweep | `/qa/security-test-report.md` — OWASP ASVS L1 checklist with evidence; dependency audit output; secret scan output. |
| E.3 | UX/accessibility test sweep | `/qa/ux-accessibility-report.md` — keyboard, screen-reader, contrast, mobile, dead-link, console-error sweep with evidence. |
| E.4 | Code quality inspection | `/qa/code-quality-report.md` — lint, type, complexity, duplication, dependency footprint, with refactor list. |

## 2.6 Block F — Production readiness

| # | Item | Outcome |
|---|---|---|
| F.1 | Production build hardening | All env vars documented, all secrets in vault, build succeeds against production config, CSP headers set. |
| F.2 | PWA → Play Store packaging | App is installable as a PWA, wrapped as a Trusted Web Activity, signed AAB produced, Play Console listing assets prepared. |

---

# PART III — ARCHITECTURAL DECISIONS

This section locks in the data and behavioural decisions for the new functionality so every prompt has a single source of truth.

## 3.1 Currency model

**Principle.** The ledger is and remains denominated in **K Credits (KCRD)** at decimal precision. USD and GYD exist as **display currencies** and as **on-ramp / off-ramp denominations**. They do not appear as currencies of record in the ledger.

**Conversion rate registry.** A new table:

```
ConversionRate
  id              uuid pk
  base_currency   enum('KCRD','USD','GYD')
  quote_currency  enum('KCRD','USD','GYD')
  rate            decimal(18,8)        // 1 base = rate quote
  effective_from  timestamp
  effective_to    timestamp nullable
  set_by          fk -> User
  created_at      timestamp
  -- unique(base_currency, quote_currency, effective_from)
```

Rates are append-only. Editing a rate produces a new row with `effective_from = now()` and back-dates `effective_to` on the prior row. A simple resolver returns the active rate for any (base, quote) at any timestamp. KCRD↔USD is the canonical pair; KCRD↔GYD and USD↔GYD are derivable but stored explicitly so Master Admin can break the cross when needed (e.g. to absorb a market spread).

**Display preference.** A column on `User`:

```
display_currency  enum('KCRD','USD','GYD')  default 'KCRD'
```

The user can change this in Settings. Every monetary amount rendered in the UI passes through a `formatAmount(amount_kcrd, user.display_currency, at: now)` helper. The user always sees a small, subtle equivalence tooltip ("≈ 100.00 KCRD") on hover/tap so the underlying source of truth is never hidden.

**Conversion promotions / bonus incentives.** A new table:

```
ConversionPromotion
  id                  uuid pk
  name                varchar
  description         text
  bonus_percent       decimal(5,2)         // e.g. 20.00 for +20%
  direction           enum('FIAT_TO_KCRD','KCRD_TO_FIAT')
  eligibility         enum('ALL','FOUNDING_MEMBERS','RESIDENTS_ONLY','SPECIFIC_USERS')
  eligible_user_ids   uuid[]               // populated when eligibility = SPECIFIC_USERS
  starts_at           timestamp
  ends_at             timestamp
  active              boolean default true
  created_by          fk -> User
  created_at          timestamp
```

When a user converts fiat to K Credits and the promotion applies, the conversion engine credits the base amount + the bonus, and the bonus is logged to the ledger as a separate transfer from the **Promotions System Wallet** to the user, citing the promotion id in the memo. This preserves auditability — every K Credit ever issued is traceable.

**Sacred boundary.** Currency display is a presentation concern. Currency conversion (fiat ↔ K Credits) is a ledger event. These two concerns must never blur — there is no UI in which clicking "USD" actually moves money. Toggling display currency only changes how amounts are formatted.

## 3.2 Visitor Groups model

```
VisitorGroup
  id            uuid pk
  name          varchar       unique
  theme         varchar nullable     // e.g. "Corporate Training", "Spiritual Retreat"
  description   text
  created_by    fk -> User
  created_at    timestamp
  archived      boolean default false

VisitorGroupMembership
  id            uuid pk
  user_id       fk -> User
  group_id      fk -> VisitorGroup
  assigned_by   fk -> User
  assigned_at   timestamp
  removed_at    timestamp nullable
  -- unique(user_id, group_id) where removed_at is null
```

**Announcement targeting.** The existing `Announcement` model gains:

```
target_type   enum('COMMUNITY_WIDE','ROLE','VISITOR_GROUP','SPECIFIC_USERS')
target_role   enum(role) nullable
target_group_id  fk -> VisitorGroup nullable
target_user_ids  uuid[] nullable
```

Visitors only see announcements where `target_type = 'COMMUNITY_WIDE'` (filtered to non-internal flag) **or** `target_type = 'VISITOR_GROUP'` and the visitor is a member of the target group **or** they are individually targeted.

**Visitor permissions enforcement.** A visitor can:
- file issue reports,
- view announcements addressed to their group(s) or community-wide non-internal announcements,
- view a read-only directory of their visitor profile.

A visitor **cannot**:
- vote on community proposals,
- view the K Credit ledger of any other party,
- view treasury or governance internals,
- create or transact K Credits.

These restrictions are enforced at the Server Action authorization layer, not just in the UI.

## 3.3 Rental cycle & extension model

The existing tenancy/lease record gains:

```
Lease (additions)
  cycle_unit         enum('DAILY','WEEKLY','MONTHLY','ANNUAL')
  cycle_amount_kcrd  decimal(18,2)         // amount due each cycle, KCRD
  start_date         date
  end_date           date
  next_payment_due   date                  // computed; cron rolls forward each cycle
  status             enum('ACTIVE','ENDING_SOON','EXPIRED','CANCELLED')
```

A new model:

```
RentalExtensionRequest
  id                       uuid pk
  lease_id                 fk -> Lease
  requested_by             fk -> User
  requested_new_end_date   date
  reason                   text
  status                   enum('PENDING','APPROVED','DECLINED')
  reviewed_by              fk -> User nullable
  reviewed_at              timestamp nullable
  decision_note            text nullable
  created_at               timestamp
```

**Behaviour.**
- Resident clicks "Request Extension" on their tenancy detail page → form: new end date, optional reason → request lands as `PENDING` in Master Admin's Approvals Center "Rental Extensions" tab.
- On approval: the lease's `end_date` is updated, `next_payment_due` is recomputed from the cycle, status becomes `ACTIVE`, an audit log entry is produced, and the resident receives an approval email.
- On decline: status → `DECLINED`, decision note is required, resident receives a decline email with the note.
- Daily cron updates `next_payment_due` and flips `ACTIVE` → `ENDING_SOON` when within 14 days of `end_date`, and → `EXPIRED` when past.

## 3.4 File storage & data directory architecture

**Storage layout.** All uploaded files live under a single root, structured by entity type and entity id:

```
/storage/
  properties/
    {property_id}/
      photos/
        {file_id}.jpg
      title-deed/
        {file_id}.pdf
      occupancy-permit/
        {file_id}.pdf
  residents/
    {user_id}/
      id-document/
        {file_id}.pdf
      profile-photo/
        {file_id}.jpg
  visitors/
    {user_id}/
      id-document/
        {file_id}.pdf
  vendors/
    {vendor_id}/
      business-license/
        {file_id}.pdf
      insurance/
        {file_id}.pdf
  attachments/                 // free-form attachments referenced from records
    {attachment_id}.{ext}
```

For Phase 1+, storage may be the local filesystem under `/storage/` (development) or a single S3-compatible bucket (Backblaze B2 recommended for cost; Cloudflare R2 acceptable) with the same prefix layout (production). The choice is configured by env: `STORAGE_DRIVER=local|s3`.

**Encryption at rest.** When `STORAGE_DRIVER=s3`, server-side encryption is enabled on the bucket (SSE-S3 or KMS). When `STORAGE_DRIVER=local`, files are stored encrypted with AES-256-GCM using a key from `STORAGE_ENCRYPTION_KEY` env var; the file id and a per-file IV combine to form the unique nonce.

**Database record.** Every uploaded file has an `Attachment` row:

```
Attachment
  id              uuid pk
  storage_key     varchar           // path under /storage/
  mime_type       varchar
  size_bytes      bigint
  sha256          char(64)
  uploaded_by     fk -> User
  uploaded_at     timestamp
  entity_type     enum('PROPERTY','RESIDENT','VISITOR','VENDOR','LEASE','ISSUE_REPORT','OTHER')
  entity_id       uuid
  category        varchar           // 'photo','title_deed','id_document', etc.
  encrypted       boolean
  iv              bytea nullable    // for local AES-GCM
```

**Retrieval.** Files are never served by direct URL. A Server Action `getAttachmentUrl(attachment_id)` returns a short-lived (5 min) signed URL after authorization check. Authorization rule: requesting user must be the `uploaded_by` user, OR a Master Admin, OR (for property/lease attachments) a current member of the related entity per the role spec.

**Master Admin Data Directory.** A new Master Admin route `/admin/data-directory` provides:
- A tree-view sidebar: All Users → Residents / Visitors / Vendors / Admins, then individual user; All Properties → individual property; All Leases; All Issue Reports.
- For each entity, a single-pane view showing every record, every attachment (with thumbnails for images), every transaction summary, every audit log entry.
- A search bar (by name, email, property id, plate number, lease id).
- An export-to-zip button per entity (records + attachments) — produces a privacy-flagged audit log entry on each use.

**Information protection strategy.** Documented in `/docs/data-protection.md` and enforced in code:
- Encryption at rest (above).
- Encryption in transit (HTTPS-only; HSTS header).
- Authorization on every retrieval (no direct URLs, no anonymous reads).
- Audit logging on every retrieval-of-personal-document by Master Admin.
- Retention: documents purged 90 days after a user is deactivated, unless a legal hold flag is set.
- Backup: nightly full DB backup encrypted with the same key set; storage backup runs against the bucket with versioning enabled.
- Access list: only `MASTER_ADMIN` and `ADMIN` roles can browse the Data Directory; only `MASTER_ADMIN` can export.

## 3.5 Audit log model (extension)

The existing `AuditLog` table from Phase 1 is retained; this playbook adds standard fields if missing:

```
AuditLog
  id              uuid pk
  actor_user_id   fk -> User nullable      // null for system actions
  action          varchar                  // 'lease.extension.approved', 'attachment.viewed', etc.
  entity_type     varchar
  entity_id       uuid nullable
  before_json     jsonb nullable
  after_json      jsonb nullable
  metadata_json   jsonb nullable
  ip_address      inet nullable
  user_agent      text nullable
  created_at      timestamp
```

Every Server Action that mutates state writes an audit log entry. Read-only audit log entries are required for: Master Admin viewing of user attachments, Master Admin export of user data, MFA enrolment, MFA reset, currency rate changes, conversion promotion creation/edit, emergency broadcast send.

---

# PART IV — BRAND & DESIGN SYSTEM REINFORCEMENT

The brand strategy document defines the City of Karis as **earthen, considered, and quietly elevated** — green of forest canopy, gold of refined metal, warm stone of foundation. The application must feel like an extension of that brand language, never a generic admin panel.

## 4.1 Color tokens (canonical)

These tokens are the single source of truth. Tailwind theme, CSS variables, design helpers, and any inline color all resolve to one of these names. No hex literals scattered through component code.

| Token | Hex | Use |
|---|---|---|
| `--color-brand-green-900` | `#1F2E26` | Primary brand surface; headings; nav rail. |
| `--color-brand-green-700` | `#3A5A4D` | Subheads; secondary actions. |
| `--color-brand-green-500` | `#5B7E70` | Hover states; active nav. |
| `--color-brand-green-100` | `#DCE8E2` | Subtle wash; success-tone backgrounds. |
| `--color-brand-gold-700` | `#8C7035` | Active accent; selected state ring. |
| `--color-brand-gold-500` | `#B89548` | Primary accent; primary CTA fill on dark surfaces. |
| `--color-brand-gold-300` | `#D4B878` | Hover-light gold. |
| `--color-brand-gold-100` | `#F2E8D0` | Highlight wash; warning-tone background. |
| `--color-stone-900` | `#2A2521` | Primary body text. |
| `--color-stone-700` | `#5C544C` | Secondary text. |
| `--color-stone-500` | `#8C857B` | Tertiary text; helper text. |
| `--color-stone-300` | `#C4BEB6` | Borders. |
| `--color-stone-100` | `#F0EBE3` | Surface tint. |
| `--color-stone-050` | `#FAF7F2` | Page background. |
| `--color-success` | `#3F8A5C` | Confirmations. |
| `--color-warning` | `#C58A2D` | Cautions. |
| `--color-danger` | `#B23A3A` | Errors; destructive actions. |
| `--color-info` | `#3A6E8C` | Informational. |
| `--color-surface` | `#FFFFFF` | Card surface. |
| `--color-surface-alt` | `#FAF7F2` | Alternating row. |

The complete token set is also given as a Tailwind plugin in **Appendix A**.

## 4.2 Typography

| Use | Family | Weight | Size scale |
|---|---|---|---|
| Display & H1 | **Cambria** (or `Cormorant Garamond` web fallback) | 600 | 32 / 28 / 24 |
| H2 / H3 | **Cambria** | 600 / 500 | 22 / 18 |
| Body | **Calibri** (or `Inter` web fallback) | 400 | 14 / 13 |
| UI labels | **Calibri** | 500 | 12 / 11 |
| Numeric (ledger) | **JetBrains Mono** or `Roboto Mono` | 500 | tabular-nums |

The serif/sans pairing distinguishes brand voice (Cambria, where the brand speaks) from operational density (Calibri, where the user works). Numeric columns use a monospaced family with `font-variant-numeric: tabular-nums` so amounts align.

## 4.3 Spacing, radius, motion

- **Spacing scale (px):** 4, 8, 12, 16, 24, 32, 48, 64. No arbitrary spacing values.
- **Border radius:** 8 (small), 12 (default), 16 (cards), 9999 (pills).
- **Shadow:** one elevation token only — `0 4px 16px rgba(31, 46, 38, 0.08)` for cards and modals; no nested shadows.
- **Motion:** durations 120 ms (taps), 200 ms (modals), 320 ms (page transitions); easing `cubic-bezier(0.2, 0.8, 0.2, 1)`. Respect `prefers-reduced-motion: reduce`.

## 4.4 Modal / popup composition rules

This is a named gap in the assessment. Codify it in a single primitive.

A `<Modal>` component must enforce:

- **Outer overlay:** full-viewport, `bg-stone-900/40`, click-to-dismiss only when `dismissOnBackdrop` is true.
- **Inner panel:** centered; `max-width: min(560px, calc(100vw - 32px))` for standard modals, `min(720px, calc(100vw - 32px))` for forms with two-column layouts; **never** flush to viewport edge.
- **Inner padding:** 24 px on all sides, expanding to 32 px on viewport ≥ 768 px.
- **Header / body / footer rhythm:** header (title + close button) — body (content) — footer (actions); sections separated by 16 px vertical gap; footer actions right-aligned, primary action rightmost.
- **Scroll containment:** if body content exceeds viewport, body scrolls; header and footer remain pinned.
- **Focus management:** focus traps inside modal; first focusable element gets focus on open; focus returns to triggering element on close.
- **Escape behaviour:** `Esc` closes when `dismissOnEscape` is true (default); `Tab` cycles within modal.

Every existing `Dialog`, `AlertDialog`, `Sheet`, or `Drawer` in the codebase must be reviewed to comply or be replaced with this primitive.

## 4.5 Sign-in page composition

The sign-in page is the user's first impression of the brand. It must:

- **Visual language.** Full-viewport split or centered card on `--color-stone-050` background. The brand wordmark in Cambria, `--color-brand-green-900`, sits above a single concise tagline ("A community, by design.") in Calibri italic, `--color-stone-700`.
- **Card surface.** `--color-surface` with `--color-stone-300` border, 16 px radius, 32 px padding, max-width 420 px.
- **Inputs.** Email and password with floating labels, `--color-brand-green-700` focus ring, error states in `--color-danger`.
- **Primary CTA.** "Sign in" — fill `--color-brand-green-900`, text `--color-brand-gold-100`, full width.
- **Secondary CTAs.** "Forgot password?" link below; "Create account" muted link in footer area.
- **Demo mode.** When env `DEMO_MODE_ENABLED=true`, a divider with the label "Demo accounts" appears below the primary form, followed by six brand-styled buttons (one per demo persona) which each populate-and-submit credentials in one tap. The demo block must look intentional, not bolted on; it is gated by env flag and removed at official launch by setting `DEMO_MODE_ENABLED=false`.
- **Microcopy.** "Welcome back to Karis." for returning users; warm, present-tense, no exclamation marks.

## 4.6 Form field standards

Every intake form in the application complies with these rules. They are not negotiable.

- **Every relevant field from the spec is present.** No "we'll add that later." If the spec says a property has a parking-spot count, the form has a parking-spot count.
- **Required vs optional is explicit.** Required fields are marked with a single asterisk in `--color-danger`; optional fields are unmarked. No silent required fields.
- **Validation is inline.** Errors appear under the field in `--color-danger`, with a clear, plain-English message ("Phone must include the country code, e.g. +592…"). No `alert()` boxes. No top-of-form summary as the only signal.
- **File uploads use a consistent component.** Drag-and-drop or click-to-browse, with a list of attached files showing filename, size, type, and a remove button per file. Accepts the formats specified per field; rejects others with a clear message. Maximum size enforced at the input level and again at the server.
- **Save is explicit and confirmed.** Submit button always shows a loading state; success produces a toast and either closes the modal or redirects to the entity's detail view; failure surfaces the error and leaves the form populated.
- **Cancel is non-destructive.** Cancel asks for confirmation only when the form is dirty; otherwise it closes silently.

---

# PART V — TEST FRAMEWORK

The four quality gates are not a vibe check. Each is a structured walk through a defined checklist with documented evidence. The acceptance criterion for each gate is the presence of a complete report file in `/qa/`.

## 5.1 E.1 — Technical function test sweep

**Goal.** Verify that every advertised feature actually performs its job end-to-end against a live development environment seeded with the demo data.

**Methodology.**
1. Walk every route in the application.
2. For each route, exercise the **happy path** (intended successful flow), then **at least one failure path** (invalid input, network failure, permission denied, missing prerequisite).
3. Capture a screenshot of any failure or unexpected state.
4. Record results in `/qa/function-test-report.md` with one row per flow.

**Coverage matrix.** At minimum:

| Domain | Flows |
|---|---|
| Authentication | Sign in (each role); sign out; forgot password; first-login MFA enrolment (staff); MFA challenge on subsequent login. |
| Onboarding tour | Tour appears on first login per role; tour can be skipped; tour can be replayed from menu. |
| K Credits | Transfer between users; voucher creation by Master Admin; voucher delivery email; voucher redemption; balance display in all three currencies. |
| Currency | Toggle display currency in Settings; verify all monetary surfaces re-render; Master Admin edits a rate; verify new rate takes effect immediately. |
| Conversion promotions | Master Admin creates a promotion; eligible user converts and receives bonus; ineligible user converts without bonus; promotion expires and stops applying. |
| Properties | Add property with photos, title deed, occupancy permit; edit; archive; bulk import 25-row Excel; reject malformed row. |
| Residents | Invite resident; resident accepts and creates account; lease assignment; lease shows correct cycle and next payment due. |
| Rental extensions | Resident requests extension; Master Admin approves; lease updates; resident receives email. Same path for decline. |
| Visitors | Master Admin creates a visitor group; assigns visitors; sends group-targeted announcement; verify only group members see it; verify visitor cannot vote. |
| Vendors | Add vendor; vendor logs in; vendor sees scoped data only. |
| Issue reports | Resident files; visitor files; Master Admin reviews; status transitions; resolution email. |
| Approvals Center | Each tab — Settlements, Property Transfers, Vouchers, Rental Extensions — exercises approve and decline paths. |
| Treasury | Reconciliation banner appears on induced mismatch; banner clears on correction. |
| Emergency broadcast | Sent → received by all roles in-app and by email; logged in audit. |
| Settings (admin) | Fee schedule editor saves and applies; conversion rate editor saves and applies. |
| Data Directory | Master Admin browses a user's full record; views attachment with signed URL; export-to-zip produces a complete archive with manifest. |
| Audit log viewer | Filter by actor, action, date range; export to CSV. |

**Acceptance.** No flow in the matrix is marked Fail. All Fail items either fixed or filed to a follow-up backlog.

## 5.2 E.2 — Security test sweep

**Goal.** Verify that the application meets OWASP ASVS Level 1 and the OWASP Top 10 (2021).

**Methodology.**
1. Run automated tooling: `npm audit --omit=dev`, `npx snyk test` (if available), a secret scan (`gitleaks` or `trufflehog`), an HTTP header scan against the dev server (`securityheaders.com` or `curl -I` review against a checklist).
2. Manually walk the OWASP ASVS L1 checklist (V1 Architecture, V2 Authentication, V3 Session, V4 Access Control, V5 Validation, V7 Error Handling, V8 Data Protection, V9 Communications, V10 Malicious Code, V11 Business Logic, V12 Files, V13 API, V14 Configuration).
3. Specifically verify:
   - All Server Actions check authentication and role authorization at entry; none rely on UI gating.
   - All inputs validated by Zod schema; rejections produce safe error messages.
   - File uploads validate content-type, magic bytes, size, and extension; reject mismatches.
   - File retrieval requires a fresh signed URL; URLs expire in ≤ 5 minutes; URLs are scoped to the requesting user.
   - Rate limiting active on auth (5/15 min/IP) and mutations (60/min/user).
   - HTTPS-only enforced; HSTS header set; CSP header set with no `unsafe-inline` for scripts.
   - No secrets in repository; `.env.example` present; production secrets only in deployment env.
   - Session tokens marked HttpOnly + Secure + SameSite.
   - CSRF protected on state-changing requests.
   - Password reset tokens single-use and short-lived.
   - Audit log entries present for all sensitive operations.
4. Record findings in `/qa/security-test-report.md` with severity (Critical/High/Medium/Low/Info) and remediation status.

**Acceptance.** No Critical or High findings open. All Medium findings either fixed or accepted with a documented rationale and a follow-up task.

## 5.3 E.3 — UX & accessibility test sweep

**Goal.** Verify the application is usable, including by users with visual or motor impairments, and that no flow has dead ends, broken links, or irrational interactions.

**Methodology.**
1. **Keyboard navigation.** Walk every key flow using the keyboard only. Every interactive element is reachable in logical order; focus is always visible; no focus traps outside of intended modals.
2. **Screen reader.** Walk top flows with VoiceOver (macOS) or NVDA (Windows). Every actionable element has a descriptive label; every form field has an associated label; every status change is announced.
3. **Contrast.** Run an automated contrast checker (`axe`, `Lighthouse`, or `WAVE`) on every page. All text meets WCAG AA (4.5:1 for body, 3:1 for large text and UI components).
4. **Zoom.** Verify usability at 200 % browser zoom and at the smallest supported breakpoint (360 px wide). Nothing is clipped, no horizontal scroll on body content.
5. **Reduced motion.** Set `prefers-reduced-motion: reduce` and verify animations are reduced to opacity-only transitions or eliminated.
6. **Mobile.** Walk top flows on a 375×812 viewport (iPhone SE-ish) and a 412×915 viewport (Pixel-class). All touch targets ≥ 44×44 px. No content tucked under fixed bars.
7. **Dead-link / dead-button audit.** Every link and button on every page either performs an action or is disabled with an explanation. No noop handlers.
8. **Console audit.** Open browser console while walking flows. No errors, no warnings about React keys or controlled-vs-uncontrolled inputs, no missing favicon-class warnings.
9. **Empty states.** Every list/table that can be empty has a designed empty state with a primary action.
10. **Error states.** Every error path produces a user-facing message that explains what happened and what to do next.
11. **Loading states.** Every async action shows a loading indicator within 100 ms; no double-click submissions.
12. **Visually-impaired-specific check.** Form errors must be communicated by both color and text; never color alone. Icons used to convey meaning have text alternatives. The currency toggle and rate display must be readable at low vision and at 200 % zoom.

Record results in `/qa/ux-accessibility-report.md` with one row per finding, severity, remediation status, and screenshot evidence where helpful.

**Acceptance.** No Critical or High findings open. WCAG AA compliance on every primary flow.

## 5.4 E.4 — Code quality inspection

**Goal.** Verify the codebase is healthy, maintainable, and free of obvious tech-debt traps before going to production.

**Methodology.**
1. **Lint.** `npm run lint`; no errors, no warnings (warnings either fixed or explicitly disabled with a rationale comment).
2. **Type-check.** `npm run typecheck`; zero errors. No `@ts-ignore` without an adjacent `// reason: …` comment.
3. **Format.** `npm run format` produces no diff.
4. **Test pass.** `npm run test` (unit) green; `npm run test:e2e` (Playwright) green.
5. **Complexity hot-spots.** Run `npx madge --circular src/`; no circular dependencies. List of the ten largest source files; any over 400 lines reviewed for split.
6. **Dead code.** `npx ts-prune` or equivalent; investigate and remove genuinely-dead exports.
7. **Duplication.** `npx jscpd src/` if available; investigate clusters; refactor where helpful.
8. **Dependency footprint.** `npx depcheck`; remove unused. `npm audit` zero high+. License sweep — no GPL contagion in production deps.
9. **Naming consistency.** Spot-check route names, table names, action names, component names against the project's stated conventions.
10. **Server vs Client component hygiene.** Every Client Component has a justification; Server Components do not import client-only libraries.

Record findings in `/qa/code-quality-report.md` with file paths, severity, and remediation actions.

**Acceptance.** Lint clean, type clean, tests green, no Critical findings, ten-largest-file review attached.

---

# PART VI — EXECUTION SEQUENCE
## Claude Code prompts — paste these in order

Each prompt below is a self-contained instruction set for Claude Code. Every prompt assumes Claude Code has access to the repository, the reference documents listed in §1.4, and an authenticated dev environment.

**Within a block, prompts run sequentially.** Across blocks, you must complete an entire block before moving to the next.

**Reporting.** At the end of every prompt, Claude Code returns the structured report described in §1.5 (Done / Files touched / New deps / Tests / Known issues / Validation evidence).

---

## BLOCK A — Phase 1 critical fixes

### Prompt A.1 — Activate Resend transactional email delivery

**Brief.** Phase 1 wired Resend in code but no transactional email actually sends. Inspection of HANDOVER.md indicates email *records* are written to the database but the Resend `sendEmail` call is either not invoked or is invoked with credentials/templates that are not configured. This is the highest-impact gap in the build — every welcome, credentials, voucher, settlement, and password-reset flow silently fails. Fix it completely and prove it works.

**Steps.**
1. Read the existing email module (likely `lib/email.ts` or `server/email/`). Identify exactly why messages are not sending: missing API key, unverified domain, missing templates, missing call site, swallowed error, or feature flag.
2. Establish the correct configuration:
   - `RESEND_API_KEY` env var
   - `RESEND_FROM_EMAIL` env var (e.g. `noreply@cityofkaris.org`)
   - `RESEND_FROM_NAME` env var (e.g. `City of Karis`)
   - Document required DNS records (SPF, DKIM, DMARC) in `/docs/email-setup.md` so Dr. Munroe can complete domain verification.
3. Build (or replace) a unified `sendEmail({to, subject, template, data})` function that:
   - Validates inputs with Zod.
   - Renders the named template with `react-email` or the existing template engine.
   - Calls Resend.
   - Persists an `EmailLog` row regardless of outcome (status: queued / sent / failed, with provider message id and error if any).
   - Returns a typed result; never throws into UI code.
   - Is idempotent on a `(recipient, subject, idempotency_key)` triple to prevent duplicate sends on retry.
4. Build (or audit) the seven required transactional templates: `welcome`, `credentials`, `password-reset`, `voucher-delivery`, `settlement-confirmation`, `rental-extension-decision`, `emergency-broadcast`. Each uses brand colors (Appendix A) and tone.
5. Wire `sendEmail` into every flow that should be sending mail today — at minimum: user create (welcome + credentials), password reset, voucher creation, settlement approval, rental extension approval/decline, emergency broadcast.
6. Add a Master Admin route `/admin/email-log` showing a paginated, filterable list of all email attempts with status and resend-on-failure capability.
7. Add a unit test per template asserting render output. Add an integration test asserting the function persists an `EmailLog` row for both success and failure paths. Mock the Resend client.
8. Manually send one test email per template against a real Resend dev-mode key; capture delivery in your validation evidence.

**Acceptance.**
- A test user created from Master Admin's "Add Resident" form receives the welcome email at the address provided, with credentials, within 30 seconds.
- The `/admin/email-log` page lists the send with status `sent`.
- Inducing a Resend failure (invalid key) produces a `failed` row with the provider error visible in the log; the user-facing flow surfaces a clear error.
- Re-running the same send with the same idempotency key does not produce a duplicate.

Report back per §1.5.

---

### Prompt A.2 — Fee schedule editor (write capability)

**Brief.** The Settings page in Phase 1 displays the fee schedule but cannot edit it. Master Admin must be able to adjust fees without a code deploy. Edits must be append-only (history preserved), audit-logged, and effective from a chosen timestamp.

**Steps.**
1. Inspect the current `Settings` page and the underlying `FeeSchedule` model (or equivalent). If the model lacks `effective_from`, `effective_to`, and `set_by` columns, add them via a Prisma migration; back-fill existing rows with `effective_from = created_at` and `effective_to = null`.
2. Build an editor UI on the Settings page: each fee line is editable; changing a value stages a draft. The user clicks "Apply changes effective …" with a date-time picker (default: now).
3. On apply: in a single transaction, set `effective_to = now()` on the previously-active rows, insert new rows with `effective_from = now()`, write an audit log entry per row.
4. Display the change history below the editor: each fee with a small history list ("changed by X on Y from A to B").
5. Ensure every place in the code that reads "the current fee" resolves it via a helper that respects `effective_from`/`effective_to`. Hard-coded fee constants are removed.
6. Add unit tests covering the resolver, the transaction, and a backdated apply (effective in the past — explicitly disallowed; UI rejects).

**Acceptance.**
- Master Admin changes a fee; settlement runs after the change use the new fee; settlements running before the change use the old.
- History panel shows the change with actor and timestamp.
- Audit log has one entry per changed line.
- Non-Master-Admin users cannot reach this UI (route-level guard) and receive 403 if they hit the Server Action directly.

Report back per §1.5.

---

### Prompt A.3 — Approvals Center: complete remaining tabs

**Brief.** The Approvals Center has a Settlements tab that works and stubs for everything else. Complete Property Transfers, Vouchers, and Rental Extensions tabs (Rental Extensions will be wired by Prompt C.3 — leave the route mounted but the data wiring there can be coordinated). Each tab is a list of pending items with actor, target, key data, and approve / decline buttons.

**Steps.**
1. Implement the **Property Transfers** tab. Source: existing pending property transfer requests. Per row: requester, property, requested transferee, key data, approve / decline. Approve runs the transfer transaction; decline records the decline reason.
2. Implement the **Vouchers** tab. Source: pending voucher issuance requests (if voucher issuance requires approval per spec) or pending voucher redemptions over a configured threshold. Per row: requester, amount in selected display currency, recipient or merchant, approve / decline.
3. Stub the **Rental Extensions** tab structure but skip its data wiring — Prompt C.3 will complete it. Mark the tab "Coming in Phase 1+" with a non-broken empty state.
4. Each tab uses the same list/row primitives so the UI is consistent across approvals.
5. Each approve/decline writes an audit log entry, sends the relevant email (welcoming Prompt A.1), and refreshes the list.
6. Add Playwright coverage for one approve and one decline path per implemented tab.

**Acceptance.**
- Each implemented tab shows pending items, allows approve and decline, and updates state correctly.
- Audit log and email are produced for each action.
- Non-Master-Admin / non-Admin users do not see the route or actions.

Report back per §1.5.

---

## BLOCK B — Brand & UI consistency

### Prompt B.1 — Brand-consistent sign-in page (with demo shortcut preserved)

**Brief.** The existing sign-in page reads as a default Clerk template; it does not match the brand. Rebuild the page to align with §4.5 of this playbook. Preserve the existing six-account demo shortcut behind a `DEMO_MODE_ENABLED` env flag so the official launch can hide it cleanly without removing code.

**Steps.**
1. Read §4.1, §4.2, §4.3, §4.5 of this playbook end-to-end. They are authoritative for visual choices.
2. Replace the current sign-in page (`app/sign-in/[[...sign-in]]/page.tsx` or equivalent) with a brand-aligned layout:
   - Page background `--color-stone-050`.
   - Centered card 420 px max width, `--color-surface`, 16 px radius, 32 px padding, 1 px border `--color-stone-300`.
   - Wordmark "City of Karis" in Cambria, `--color-brand-green-900`, above the card; tagline "A community, by design." in Calibri italic, `--color-stone-700`.
   - Email + password inputs with brand-styled focus rings.
   - Primary CTA "Sign in" — `--color-brand-green-900` fill, `--color-brand-gold-100` text, full width.
   - "Forgot password?" link below CTA.
   - "Create account" muted link in card footer (only shown if self-signup is enabled per env).
3. Demo block — always read `process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED === 'true'`. If true, render a divider with "Demo accounts" label and six brand-styled buttons, one per role (Master Admin, Admin, Vendor, Resident, Visitor, plus a sixth as currently exists). Each button signs in as the corresponding demo user via the existing demo-login Server Action. Style the buttons with `--color-brand-gold-100` background, `--color-brand-green-900` text, and a thin gold border, so they read as a designed sub-section, not a debug afterthought.
4. If the demo flag is false, render no demo elements at all — no commented-out blocks, no hidden divs, just a clean production-grade sign-in.
5. Apply the same brand language to the sign-up, forgot-password, and reset-password pages so the auth surface is one continuous experience.
6. Add an `aria-live="polite"` region for auth errors so screen readers announce sign-in failures.
7. Add Playwright tests:
   - Sign in via the email/password form succeeds for a seeded user.
   - When `DEMO_MODE_ENABLED=true`, six demo buttons are present and each signs in as the expected role.
   - When `DEMO_MODE_ENABLED=false` in test env, no demo elements render.
8. Visual check at 360 px, 768 px, 1024 px, and 200 % zoom. Capture screenshots to `/qa/screenshots/sign-in/` for the validation evidence.

**Acceptance.**
- Sign-in page passes the design system check (no hex literals; only tokens).
- Demo shortcut works when flag is on; gone without trace when flag is off.
- Keyboard navigable (Tab order: email → password → sign in → forgot password → demo block in order).
- Lighthouse accessibility score on this page ≥ 95.

Report back per §1.5.

---

### Prompt B.2 — Modal & popup edge / bleed pass

**Brief.** The assessment flagged inconsistent popup spacing — content sometimes touches the modal frame, sometimes is clipped. Codify §4.4 of this playbook as a single `<Modal>` primitive and migrate every existing modal to it.

**Steps.**
1. Build (or refactor) `components/ui/modal.tsx` to enforce §4.4: outer overlay; centered inner panel with the prescribed max-width; 24/32 px padding; header / body / footer rhythm; scroll containment; focus trap; Esc and backdrop dismiss controlled by props; reduced-motion aware.
2. Audit the codebase for existing `Dialog`, `AlertDialog`, `Sheet`, `Drawer`, and any inline overlay implementations. List them in your report-back. Either migrate each to the `Modal` primitive or — if they have specialized behaviour the primitive shouldn't accommodate (e.g. mobile bottom sheet) — derive them from a shared base that still enforces the spacing rules.
3. Specifically inspect:
   - Settlement detail modal
   - Approve/decline confirmation modal
   - Add property modal (will be expanded in Prompt B.3)
   - Add resident modal
   - Issue report detail
   - Voucher creation modal
   - Settings change confirmation
4. After migration, walk every modal manually at 360 px, 768 px, and 1280 px. Confirm: no edge bleed, no clipped content, scroll on body only, header and footer pinned, focus trapped, Esc closes when intended.
5. Add a Storybook entry (or equivalent isolated render) for the `Modal` primitive showing standard, two-column, scrolling-body, and mobile-sheet variants.
6. Add a unit test asserting focus management (first focusable receives focus on open; focus returns to trigger on close).

**Acceptance.**
- A grep of the codebase for the old modal patterns returns zero matches in production code.
- Manual sweep of all modals at three viewport sizes shows correct spacing in every case.
- Keyboard-only user can open, navigate, and close every modal.

Report back per §1.5 plus the migrated-modals list.

---

### Prompt B.3 — Intake form completion across all entries

**Brief.** Several intake forms are missing fields the spec calls for, and several do not support the document/photo uploads they should. Bring every "add" and "edit" form into compliance with the spec and §4.6 of this playbook.

**Steps.**
1. For each of the following entries, read the corresponding section of `COK-CommunityApp-AccountFunctions-V1.pdf` and produce a field list (in your report-back). Confirm the form includes every field with appropriate input type, validation, and required/optional designation.
   - **Property** — including but not limited to: address line 1/2, lot number, type (residential / commercial / mixed / land), size sq m, bedrooms, bathrooms, parking spots, year built, status (vacant / occupied / under construction), purchase price, current valuation in KCRD, **photos (multi)**, **title deed (PDF)**, **occupancy permit (PDF)**, **utility hookup documents (multi PDF)**, notes.
   - **Resident** — full name, preferred name, DOB, gender, email, phone (with country code), national ID type and number, **ID document scan (PDF)**, **profile photo (image)**, emergency contact name and phone, household members count, vehicle plate(s), notes.
   - **Visitor** — full name, email, phone, ID type and number, **ID document scan (PDF)**, visit purpose, expected arrival, expected departure, host (resident lookup), assigned visitor group(s) — multi-select (Prompt C.2 will populate the picker).
   - **Vendor** — business name, contact name, email, phone, business category, **business license (PDF)**, **insurance certificate (PDF)**, payout method, KCRD wallet preference, notes.
   - **Voucher** — recipient (lookup), amount in display currency (with KCRD equivalent shown live), expiry, message to recipient, optional attachment (PDF up to 5 MB).
   - **Issue report** — title, category (lookup), severity, location (free text + property lookup), description, **photos (multi)**, **video (single, up to 50 MB)**, optional contact preference.
   - **Lease** — property (lookup), tenant (resident lookup), start date, end date, **cycle unit (daily/weekly/monthly/annual)**, **cycle amount (KCRD)**, deposit amount, attachments — lease agreement PDF.
2. For uploads: build (or use the existing) `<FileUpload>` component compliant with §4.6. Validate content type by mime + magic bytes server-side; max size per field as specified; reject otherwise.
3. Persist uploads via the storage layer described in §3.4. Each upload produces an `Attachment` row.
4. Every form submits via a Server Action that validates input with Zod, writes the entity in a transaction with its attachments, writes an audit log entry, and returns a typed result. UI shows loading, success toast, error inline.
5. Add Playwright coverage for one happy-path submit and one validation-error submit per form.

**Acceptance.**
- Every form in the list contains every spec field and behaves per §4.6.
- File uploads work end-to-end: upload, persist, retrieve via signed URL, display.
- A non-Master-Admin user editing a record they don't own receives 403 from the Server Action.

Report back per §1.5 — include a table of which forms gained which fields and which now support which upload categories.

---

## BLOCK C — New functional requirements

### Prompt C.1 — Multi-currency display, conversion rates, and bonus promotions

**Brief.** Users must be able to view monetary values in K Credits, USD, or GYD per a personal preference. Master Admin must be able to set and edit conversion rates, and run conversion-bonus promotions (e.g. "+20 % K Credits on USD top-ups for founding members"). The K Credit ledger remains the only source of truth — currency switching is presentation; conversion is a ledger event. Implement per §3.1 of this playbook.

**Steps.**
1. Add the `ConversionRate` and `ConversionPromotion` Prisma models per §3.1. Add a `display_currency` column to `User` defaulted to `'KCRD'`. Migrate.
2. Seed the rate registry with sensible starting rates: 1 KCRD = 1 USD (the brand peg); 1 USD = 210 GYD (current approximate); KCRD↔GYD computed and persisted explicitly as `1 KCRD = 210 GYD`. These are example seeds; the editor lets Master Admin adjust.
3. Build the **Currency Settings** page under `/admin/settings/currency`:
   - Master Admin sees the current active rate for each pair, the editable input for a new rate, an "effective from" picker (default now), and a history table of past rates.
   - Saving a new rate runs a transaction: close the prior row's `effective_to`, insert the new row, write an audit log entry. Rates cannot be backdated.
4. Build a **Conversion Promotions** page under `/admin/settings/promotions`:
   - List of promotions (active, scheduled, expired), each with a clear status pill.
   - "New promotion" form: name, description, bonus percent, direction, eligibility (radio with the four options; if SPECIFIC_USERS, multi-select user picker; if FOUNDING_MEMBERS, ensure a `founding_member` flag exists on User — add it via migration if not present, default false, settable by Master Admin from a user's profile), starts at, ends at.
   - Edit / archive existing promotions (archive ends the promotion immediately; edit only allowed before starts_at).
5. Build the **conversion engine** as a Server Action `convertFiatToKcrd({user_id, fiat_amount, fiat_currency})`:
   - Resolves the active rate at request time.
   - Resolves the active applicable promotion for the user, direction, currency, and timestamp.
   - Computes base KCRD = fiat_amount × rate.
   - Computes bonus KCRD = base × promotion.bonus_percent / 100 (0 if no promotion).
   - Runs in a single transaction:
     - Posts a ledger entry from the **Fiat Settlement System Wallet** (placeholder for the off-chain on-ramp) to the user wallet for `base`.
     - If bonus > 0, posts a ledger entry from the **Promotions System Wallet** to the user for `bonus`, with the promotion id in the memo.
     - Writes audit log entries.
     - Sends a confirmation email via Prompt A.1's `sendEmail`.
   - The reverse path `convertKcrdToFiat` exists and respects the KCRD_TO_FIAT direction promotions, but no bonus typically applies on outflow; the engine still handles the case symmetrically.
6. Build the **display layer**:
   - A `formatAmount(kcrd, displayCurrency)` helper converts at the active rate at render time. The KCRD canonical value is the input.
   - Every existing component that renders a monetary value is reviewed and migrated to use this helper. (Walk: balance widgets, settlements lists, voucher amounts, lease cycle amounts, fee schedule, treasury totals, ledger detail.)
   - On hover/tap, every formatted amount shows a small tooltip with the KCRD equivalent and the rate at which it was converted (e.g. "= 100.00 KCRD @ 1 KCRD = 1.00 USD"). Use a brand-styled tooltip primitive.
7. Build the **user setting**:
   - A new section in the user's Settings page: "Display currency" — radio of KCRD / USD / GYD. Selecting writes to `user.display_currency` and re-renders.
8. Test coverage:
   - Unit test for the rate resolver across boundaries (active row, expired row, future-effective row).
   - Unit test for promotion eligibility (each enum value, start/end edges).
   - Unit test for the conversion engine: base only, base + bonus, ineligible user gets no bonus, expired promotion ignored.
   - Playwright test: log in as a founding-member resident, switch display currency, see all amounts update; convert USD to KCRD, see balance increase by base + bonus, see the email log entry.
9. Document the model in `/docs/currency-and-promotions.md` so a future engineer can extend it.

**Acceptance.**
- Master Admin can change a rate and the change is reflected immediately across the app.
- A user with display preference USD sees every amount in USD with the KCRD tooltip; switching to GYD updates everything; KCRD shows raw.
- A founding-member user converting USD → KCRD during a +20 % active promotion receives base + 20 % and sees two ledger entries (base + bonus from Promotions System Wallet).
- A non-eligible user receives base only.
- The ledger remains internally balanced (sum of debits = sum of credits) after every conversion.

Report back per §1.5.

---

### Prompt C.2 — Visitor Groups system

**Brief.** Visitors are not generic community members. They arrive in cohorts, often for specific purposes (corporate training, retreats, consultations), and they should receive announcements scoped to their cohort. They have no voting rights and no community ledger participation. Implement per §3.2.

**Steps.**
1. Add the `VisitorGroup` and `VisitorGroupMembership` Prisma models per §3.2. Migrate.
2. Extend the existing `Announcement` model with `target_type`, `target_role`, `target_group_id`, `target_user_ids` per §3.2. Migrate, defaulting existing announcements to `target_type='COMMUNITY_WIDE'`.
3. Build the **Visitor Groups** page under `/admin/visitors/groups`:
   - List of groups with member count, theme, status (active / archived).
   - "Create group" modal: name (unique), theme, description.
   - Group detail page: group meta, member list with assign/remove actions, "Send announcement to this group" button (opens a composer with the group pre-targeted).
4. Update the **Add Visitor** form (Prompt B.3) to include a multi-select "Visitor groups" picker that lists active groups. Persist memberships on submit.
5. Update the **Visitor profile / edit** view to allow editing group memberships post-creation.
6. Build the **announcement composer** (refactor of the existing one):
   - Audience selector: Community-wide / By role / By visitor group / Specific users.
   - When "By visitor group" is selected, a group picker appears; when "By role", a role picker.
   - Compose body with brand-styled rich-text controls (bold, italic, link, list).
   - Channel selector: in-app, email, both.
   - Preview pane.
   - Schedule for later (optional).
7. Update the **announcements feed** rendered to each user:
   - Visitor sees: announcements where `target_type='COMMUNITY_WIDE'` AND `internal=false` (if such a flag exists), OR `target_type='VISITOR_GROUP'` AND visitor is in the targeted group, OR they are individually targeted.
   - Resident sees: community-wide + role-specific (RESIDENT) + individually-targeted.
   - Master Admin / Admin sees: everything.
8. Enforce the visitor permissions lockdown per §3.2 at the Server Action layer:
   - Visitor cannot reach voting routes (404 or 403, with explanation).
   - Visitor cannot reach ledger routes for any other party.
   - Visitor cannot reach treasury or governance internals.
   - Visitor's only mutable Server Actions are: file issue report, edit own profile fields (name, phone, photo), acknowledge announcement.
9. Add Playwright tests:
   - Master Admin creates a group, assigns a visitor, sends an announcement to the group; the visitor sees it; a visitor not in the group does not.
   - A visitor attempting to reach a voting route is denied.
10. Update the visitor-facing dashboard to show: my visitor groups, announcements for me, my open issue reports.

**Acceptance.**
- Master Admin can create, edit, and archive visitor groups.
- Visitor sees only the announcements they should see; no other.
- Visitor cannot vote, transact, or view governance internals.
- Audit log records group creation, member assignments, announcement sends.

Report back per §1.5.

---

### Prompt C.3 — Rental cycle indication & extension request workflow

**Brief.** Residents on rental properties currently see a lease record but no cycle awareness — no "next payment due", no clear cycle unit, and no path to request an extension. Implement per §3.3 and complete the Approvals Center "Rental Extensions" tab stubbed in Prompt A.3.

**Steps.**
1. Extend the `Lease` model with `cycle_unit`, `cycle_amount_kcrd`, `start_date`, `end_date`, `next_payment_due`, `status` per §3.3. Migrate; back-fill existing leases with reasonable defaults (cycle_unit=MONTHLY; cycle_amount_kcrd from existing rent fields if present; status=ACTIVE; next_payment_due=start_date + one cycle, repeated until > today; end_date if known).
2. Add the `RentalExtensionRequest` Prisma model per §3.3. Migrate.
3. **Tenant view.** On the resident's "My tenancy" page:
   - Header card: property name/address, lease term (start–end), cycle unit pill, cycle amount in display currency, status pill, "Next payment due" date with days-remaining.
   - Below: a "Request extension" CTA (visible only when status is ACTIVE or ENDING_SOON).
   - Below: a list of past extension requests with status pills.
4. **Extension request form** (modal):
   - "Requested new end date" — date picker, must be after current end date.
   - "Reason" — optional text area.
   - Submit creates a PENDING `RentalExtensionRequest`, writes an audit log entry, sends an in-app notification to Master Admins, and emails Master Admins. UI shows confirmation toast.
5. **Master Admin Approvals Center — Rental Extensions tab.** Complete the stub from Prompt A.3:
   - List pending extension requests with: requester, property, current end → requested new end (with delta in days), reason, "Approve" and "Decline" buttons.
   - Approve modal: optional note; on confirm, runs in a single transaction — set `Lease.end_date = requested_new_end_date`, recompute `next_payment_due` based on cycle, set status to ACTIVE if previously ENDING_SOON; update the request to APPROVED with reviewer and timestamp; write audit log; send `rental-extension-decision` email (approval template) to the resident.
   - Decline modal: required note; on confirm, set the request to DECLINED with reviewer, timestamp, decision_note; write audit log; send the same template (decline variant) with the note.
6. **Cron / scheduled task.** A daily job:
   - Recomputes `next_payment_due` for ACTIVE leases (rolls forward when the current due date is past).
   - Flips ACTIVE → ENDING_SOON when within 14 days of `end_date`.
   - Flips ENDING_SOON → EXPIRED when past `end_date` and no active extension is pending.
   - Sends an email to residents whose lease entered ENDING_SOON state.
   - For Phase 1+, the cron may run as a Vercel Cron entry hitting a `/api/cron/leases` endpoint guarded by a shared secret; document in `/docs/cron.md`.
7. Add Playwright tests:
   - Resident requests extension; appears in Approvals Center; Master Admin approves; lease end date and next payment due update; resident sees updated card; resident receives email.
   - Decline path: status becomes DECLINED, note stored, email sent.
   - Cron flips ACTIVE → ENDING_SOON correctly (test with date mocking).
8. Update the Master Admin Data Directory (Prompt D.4) and the audit log viewer to surface lease and extension events. (If those features are not yet built when this prompt runs, ensure the data and audit entries exist so they surface automatically once those features land.)

**Acceptance.**
- Tenant sees a clear cycle and next-payment date in their display currency.
- Extension request → approval / decline lifecycle works end-to-end.
- Lease state transitions are correct under date mocking.
- Audit log captures every state change.

Report back per §1.5.

---

## BLOCK D — Phase 1+ hardening

### Prompt D.1 — Bulk Excel import: members

**Brief.** Onboarding the founding cohort one resident at a time is impractical. Master Admin must be able to upload an `.xlsx` of members matching the schema, preview the parsed rows with row-level errors highlighted, and commit only the valid rows on confirmation.

**Steps.**
1. Build a Master Admin route `/admin/imports/members` with a two-step flow: **Upload & Preview** → **Confirm & Commit**.
2. Provide a downloadable template `members-template.xlsx` with the exact column headers expected. Headers map 1:1 to the `Resident` intake form fields from Prompt B.3 (e.g. `full_name`, `preferred_name`, `dob`, `gender`, `email`, `phone_e164`, `national_id_type`, `national_id_number`, `emergency_contact_name`, `emergency_contact_phone`, `household_size`, `vehicle_plates`, `notes`). Document each column's expected format in a "Read me" sheet inside the template.
3. Use `SheetJS` (already a permitted dependency from prior work) to parse server-side. Validate every row with the same Zod schema as the single-row form. For each row, attach a status: `valid`, `warning` (e.g. duplicate of existing user — let admin decide), `error` (with a specific message).
4. Render a preview table with row index, parsed values, and status pill. Errors and warnings are filterable. Errors are not committable; warnings are committable per-row with an explicit checkbox.
5. On commit: process in a single transaction with savepoints — failure on any row aborts that row only and continues; final summary lists committed and skipped rows. Each new user receives the welcome email (Prompt A.1) with a setup link.
6. Cap the import at 1,000 rows per file (configurable via env). Reject larger files with a clear message.
7. Audit log writes one entry per imported row plus a summary entry for the import session (file name, hash, total counts).
8. Tests:
   - Unit: parser handles empty cells, trimmed strings, dates in multiple formats, phone numbers with and without country code.
   - Playwright: upload a valid 5-row sheet, see preview, commit, see five users created with welcome emails logged.
   - Playwright: upload a sheet with 2 valid + 2 error + 1 warning rows; confirm only valid rows commit (or warnings if confirmed); errors do not.

**Acceptance.**
- Master Admin successfully imports 25 founding members in under two minutes.
- Each imported user receives their welcome email.
- Audit log shows the import session and per-row entries.
- Malformed rows are rejected with actionable messages, not generic errors.

Report back per §1.5.

---

### Prompt D.2 — Bulk Excel import: properties

**Brief.** Same shape as D.1 but for properties. Schema columns mirror the property intake form. Photos and PDF documents cannot be embedded in the Excel; the importer creates property *records*, and Master Admin then attaches documents per property afterwards (or supplies a parallel zip — see optional below).

**Steps.**
1. Build `/admin/imports/properties` mirroring D.1's flow.
2. Template `properties-template.xlsx` with columns: `external_ref` (optional, the admin's own id for cross-reference), `address_line_1`, `address_line_2`, `lot_number`, `type`, `size_sqm`, `bedrooms`, `bathrooms`, `parking_spots`, `year_built`, `status`, `purchase_price_kcrd`, `current_valuation_kcrd`, `notes`.
3. Validate with Zod; surface row errors as in D.1.
4. **Optional companion:** allow uploading a zip alongside the xlsx. The zip's top-level folder names match the `external_ref` column; inside each folder, files in subfolders `photos/`, `title-deed/`, `occupancy-permit/`, `utility/` are matched to the property and ingested as `Attachment` rows on commit. Keep this feature behind a small "Include attachments zip" toggle to keep the simple path simple.
5. Audit log per row plus per session.
6. Tests:
   - Playwright: import 10-property xlsx without zip; records created; preview correctly highlights errors.
   - Playwright: import the same with a companion zip; attachments correctly ingested and visible in property detail.

**Acceptance.**
- Master Admin imports the founding property roll in one operation.
- Optional companion-zip attaches photos and documents correctly when used.
- Errors are row-specific and actionable.

Report back per §1.5.

---

### Prompt D.3 — MFA enforcement for staff roles

**Brief.** Master Admin, Admin, and Accountant roles handle community money and identity documents. They must complete MFA enrolment on first login and challenge on every subsequent login. Resident, Vendor, Visitor are MFA-optional (encouraged but not enforced).

**Steps.**
1. Confirm the auth provider (Clerk, per HANDOVER.md) supports TOTP MFA. Enable in the Clerk dashboard for the staff roles.
2. Enforce role-based MFA at the application layer with a middleware that, on every request from an authenticated staff user without MFA enrolled, redirects to `/account/mfa-enroll`. The route remains accessible regardless; everything else 302s to it.
3. Build the enrolment page in brand language: explanation, QR code, 6-digit verification, and a "Save backup codes" panel that produces ten one-time recovery codes. The user must download or copy them and confirm.
4. Allow MFA reset only via a Master Admin "Reset MFA for user" action (in Data Directory, Prompt D.4) which writes an audit log entry and sends the affected user an email notifying them of the reset. A staff user cannot self-reset MFA without admin support.
5. Enforce MFA challenge on every sign-in for staff roles via Clerk's session policy (or equivalent at the middleware layer if Clerk's policy is per-instance).
6. For non-staff roles, surface an "Enable two-factor authentication" CTA in their account settings; offer the same enrolment flow when chosen.
7. Tests:
   - Playwright: a freshly-created Master Admin who has not enrolled MFA is redirected to the enrolment page on first login and cannot reach `/admin/*` until enrolment is complete.
   - Playwright: an enrolled Master Admin signs in and is challenged for the TOTP code.
   - Playwright: a resident is not redirected; MFA is optional.
8. Document the recovery process in `/docs/mfa.md`.

**Acceptance.**
- No staff user can reach administrative routes without MFA enrolled.
- MFA reset is auditable and admin-initiated only.
- Recovery codes work and are single-use.

Report back per §1.5.

---

### Prompt D.4 — Audit log viewer & Master Admin Data Directory

**Brief.** Two related deliverables. First, a Master Admin audit log viewer that makes the existing append-only audit log usable. Second, the Master Admin Data Directory described in §3.4 — a single navigable surface where every user's records and uploads are inspectable, with strong audit and retrieval controls.

**Steps.**
1. **Audit Log Viewer** at `/admin/audit-log`:
   - Filterable by actor (user picker), action (free-text contains), entity type, entity id, date range.
   - Paginated (50 per page) with infinite scroll or numbered pagination.
   - Each row expands to show before/after JSON in a collapsible diff view.
   - Export current filter to CSV (writes its own audit log entry on use).
2. **Data Directory** at `/admin/data-directory`:
   - Left rail tree: All Users → Residents / Visitors / Vendors / Admins → individual user; All Properties → individual property; All Leases; All Issue Reports.
   - Right pane shows selected entity:
     - Header: identity card with photo / name / role / status.
     - Tabs: Overview (key fields), Records (full field set), Attachments (thumbnail grid for images, file list for PDFs, with view button), Transactions (ledger entries summary), Audit (entries scoped to this entity).
     - Per attachment: viewing requires fetching a fresh signed URL from the Server Action; viewing produces an audit entry tagged `attachment.viewed_by_admin`.
   - Search bar: by name, email, property id, plate, lease id.
   - Per-user "Export records" button: produces a zip with every record (JSON), every attachment (binary), and a manifest. Each export writes an audit entry tagged `data_directory.export` with actor, target, and a hash of the manifest.
3. Permissions:
   - The Data Directory route is reachable only by `MASTER_ADMIN` and `ADMIN` roles.
   - Only `MASTER_ADMIN` can perform exports.
   - Non-permitted roles attempting the route receive a brand-styled 403.
4. Document the Data Directory's purpose, access controls, and export-handling rules in `/docs/data-protection.md` (which Prompt D.11 will round out).
5. Tests:
   - Playwright: Master Admin browses to a resident, opens an attachment, audit log records the view.
   - Playwright: Master Admin exports a user's records, downloads the zip, verifies the manifest and that all attachments are present.
   - Playwright: an Admin (not Master) attempting the export receives 403.

**Acceptance.**
- Audit log is queryable and exportable.
- Master Admin can find every record in the system from one entry point.
- All sensitive views and exports are themselves audit-logged.

Report back per §1.5.

---

### Prompt D.5 — Treasury reconciliation auto-alerts

**Brief.** A nightly reconciliation job verifies that the sum of ledger entries equals the sum of system + user wallet balances. Any discrepancy produces an email to Master Admins and a dashboard banner that persists until cleared.

**Steps.**
1. Build a Server Action `runTreasuryReconciliation()` that:
   - Sums all ledger debits and credits across the entire ledger (should be zero by double-entry invariant).
   - Sums every wallet's current balance (system + user).
   - Verifies the system-wallet net + user-wallet net relationships expected for the model.
   - Produces a `ReconciliationReport` row with timestamp, expected vs actual figures, status (ok / warning / mismatch), and a JSON of details.
2. Schedule it to run nightly via the same cron mechanism as Prompt C.3's lease cron.
3. On `mismatch`:
   - Email all Master Admins with a summary and a link to the report detail page.
   - Set a `reconciliation_alert_active` flag visible to Master Admin sessions; render a sticky brand-styled banner across all admin routes ("Treasury reconciliation found a discrepancy on [date]. View report.").
4. Build `/admin/treasury/reconciliation` listing past reports with status pills, filter by date, click into a report for the detail view.
5. Provide a "Run reconciliation now" button (Master Admin only) for ad-hoc runs.
6. Provide an "Acknowledge alert" action that clears the banner and writes an audit entry with the acknowledging admin and timestamp; the report itself remains in `mismatch` status.
7. Tests:
   - Unit: reconciliation logic against a synthetic balanced ledger (status=ok) and a synthetic broken ledger (status=mismatch).
   - Playwright: simulate a mismatch (admin override insertion in a test fixture); run reconciliation; banner appears; acknowledge clears it.

**Acceptance.**
- Reconciliation runs on schedule and produces reports.
- Mismatches alert humans by email and in the UI.
- Acknowledgment is audited and does not silence future alerts.

Report back per §1.5.

---

### Prompt D.6 — Emergency broadcast

**Brief.** Master Admin must be able to push a single high-urgency announcement to every active user — in-app and by email — with a confirm-action gate to prevent accidental sends.

**Steps.**
1. Build `/admin/broadcast` with a composer:
   - Title (required, ≤ 80 chars).
   - Body (required rich text, ≤ 2000 chars).
   - Severity: `info` / `urgent` / `critical` (controls in-app banner color and email subject prefix).
   - Channels: in-app (always on), email (default on), SMS (out of scope for Phase 1+, render as disabled with "Coming soon").
   - Preview pane.
2. Submit triggers a confirm modal with a typed confirmation phrase ("BROADCAST" — typed in a field; CTA disabled until typed).
3. On confirm:
   - Persist as an `Announcement` with `target_type='COMMUNITY_WIDE'` and `severity` field; mark a flag `is_emergency=true`.
   - Render in every active user's in-app session as a sticky banner at top of viewport with the chosen severity color until acknowledged.
   - Send the `emergency-broadcast` email template to every active user via Prompt A.1's `sendEmail`. Use chunked sending (e.g. 50/sec) to respect Resend rate limits; show progress in a small Master Admin progress modal.
   - Audit log: one entry for the send action, plus per-recipient delivery rows (status from EmailLog).
4. The acknowledge action on the in-app banner writes an `AnnouncementRead` entry; the banner disappears for that user.
5. Tests:
   - Playwright: Master Admin composes a broadcast, types confirmation, sends; multiple test users see the banner; email log lists their delivery; acknowledge dismisses.

**Acceptance.**
- Broadcast reaches every active user reliably.
- Confirm gate prevents accidental sends.
- Audit captures the action; per-user delivery is verifiable.

Report back per §1.5.

---

### Prompt D.7 — Onboarding tour

**Brief.** First-login users in each role need a brief guided overlay that orients them to their dashboard. The tour is dismissible, replayable from the user menu, and role-specific.

**Steps.**
1. Use a small dependency-free coachmark library or build a lightweight in-house overlay primitive (preferred — fewer deps). It must respect `prefers-reduced-motion` and be keyboard-navigable (Next / Back / Skip).
2. Define tour steps per role:
   - **Master Admin (8 steps):** dashboard summary, treasury, approvals, data directory, audit log, settings (currency + fees), emergency broadcast, account menu.
   - **Admin (5 steps):** dashboard, approvals, residents, audit log, account menu.
   - **Resident (5 steps):** dashboard, my wallet, my tenancy, announcements, account menu.
   - **Vendor (4 steps):** dashboard, sales/payments, profile, account menu.
   - **Visitor (4 steps):** dashboard, my announcements, file an issue report, account menu.
3. Persist a per-user `onboarding_tour_completed_at` timestamp (and `dismissed_at`). The tour auto-launches on first load when neither is set.
4. From the user menu, "Show me around" replays the tour.
5. Each step uses brand language: short, present-tense, second-person, no exclamation marks.
6. Tests:
   - Playwright: a fresh Master Admin sees the tour; advances through; tour ends; reload — tour does not reappear.
   - Playwright: replaying via the menu works.

**Acceptance.**
- Tour appears on first login per role.
- Tour content is correct per role.
- Tour can be skipped, dismissed, or replayed.
- No layout shifts or focus loss while the tour runs.

Report back per §1.5.

---

### Prompt D.8 — Sentry monitoring

**Brief.** Wire Sentry on both client and server. Tag environment, release, and user role (anonymized to role name only — never PII).

**Steps.**
1. Add `@sentry/nextjs`. Run the standard `sentry init` — accept the config that produces `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts`. Document the DSN env vars in `.env.example`.
2. Configure:
   - `environment`: from `NODE_ENV` and a `DEPLOY_ENV` env var (`development` / `staging` / `production`).
   - `release`: from build-time git SHA (configure in CI; locally fall back to `dev`).
   - `tracesSampleRate`: 0.1 in production, 1.0 in dev.
   - `beforeSend`: scrub PII — remove email addresses, names, phone numbers, attachment storage keys from event payloads. Tag with `user.role` only.
   - `ignoreErrors`: list known noise (e.g. ResizeObserver loop limit exceeded, third-party browser extension errors).
3. Wrap Server Actions with a Sentry-aware error boundary that captures unhandled exceptions, attaches the action name and user role, and surfaces a sanitized error to the user.
4. Add a tiny `/api/sentry-test` Server Action behind admin auth that intentionally throws, used to verify the integration in any environment.
5. Document the dashboard alert rules to set up in Sentry (high-error-rate, new-issue) in `/docs/observability.md` so Dr. Munroe can configure them.

**Acceptance.**
- Inducing a server error in dev surfaces the event in Sentry with the correct tags.
- Email addresses and names are scrubbed from captured payloads.
- Production sample rate is conservative; dev is full.

Report back per §1.5.

---

### Prompt D.9 — Rate limiting on Server Actions

**Brief.** Protect auth endpoints, mutations, and bulk operations from abuse with per-user and per-IP rate limits. Use Upstash Redis if a Redis instance is configured; fall back to in-memory limits in dev.

**Steps.**
1. Add `@upstash/ratelimit` and `@upstash/redis` (or an equivalent that supports both Redis and in-memory). Document `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env.example`.
2. Build a small `rateLimit({ identifier, scope, limit, window })` helper that wraps the chosen library and selects in-memory in dev (`NODE_ENV !== 'production'` and no Redis configured).
3. Apply limits:
   - **Auth (sign-in, password reset request):** 5 per 15 minutes per IP.
   - **MFA verification:** 10 per 15 minutes per user.
   - **Mutations (Server Actions that write):** 60 per minute per user.
   - **Bulk imports:** 3 per hour per user.
   - **Email sends triggered by users:** 30 per hour per user.
4. On limit, return a typed error and surface a brand-styled "Too many requests, try again in N seconds" message to the UI; log the event to Sentry as a warning (not an error).
5. Audit log records when an admin action is rate-limited (this should be rare and worth investigating).
6. Tests:
   - Unit: helper returns allowed / denied correctly across the boundary.
   - Playwright: hammer the sign-in endpoint with bad credentials 6 times; the 6th attempt is rate-limited.

**Acceptance.**
- Brute-force credential stuffing is throttled.
- Bulk import abuse is prevented.
- Real users never hit limits in normal use.

Report back per §1.5.

---

### Prompt D.10 — Playwright E2E coverage of critical paths

**Brief.** Earlier prompts have added per-feature Playwright tests. This prompt explicitly assembles the ten critical-path tests so the suite is auditable as a whole.

**Steps.**
1. Establish a Playwright config that runs against a freshly-seeded test database with deterministic fixtures (no shared state across tests). Use the existing demo seed mechanism, parameterised for test mode.
2. Author or consolidate the following ten tests under `e2e/`:
   1. `auth-sign-in-each-role.spec.ts` — sign in as each of the six demo roles via the demo shortcut.
   2. `ledger-transfer.spec.ts` — resident A transfers KCRD to resident B; both balances update; ledger entries balance.
   3. `voucher-redemption.spec.ts` — Master Admin issues a voucher; recipient redeems; balance updates; email sent.
   4. `settlement-approval.spec.ts` — pending settlement approved by Master Admin; status updates; email sent.
   5. `property-transfer.spec.ts` — pending property transfer approved; ownership updates; audit logged.
   6. `voting.spec.ts` — Master Admin creates a proposal; residents vote; visitor cannot vote; tallies match.
   7. `rental-extension.spec.ts` — request → approve → end_date and next_payment_due update.
   8. `bulk-import-members.spec.ts` — upload 5-row sheet → preview → commit → users created with welcome emails.
   9. `emergency-broadcast.spec.ts` — confirmed broadcast → all users receive in-app + email.
   10. `mfa-enrol.spec.ts` — fresh Master Admin enrols MFA, then signs in with TOTP challenge.
3. Add a CI job that runs these tests on every push to main against a staging DB. Keep the suite under 10 minutes wall time.
4. Document the test list and how to add new ones in `/docs/testing.md`.

**Acceptance.**
- All ten tests green on local and CI.
- Suite is reproducible from a clean checkout.

Report back per §1.5.

---

### Prompt D.11 — File storage strategy & implementation

**Brief.** Implement the storage architecture in §3.4 of this playbook. Phase 1+ supports both local (dev) and S3-compatible (prod) drivers under a unified interface.

**Steps.**
1. Build `lib/storage.ts` with a `StorageDriver` interface: `put(key, body, mime) → {storage_key, size, sha256}`; `getSignedUrl(key, ttl) → url`; `delete(key)`; `head(key) → {size, mime}`.
2. Implement `LocalStorageDriver` — encrypts at rest with AES-256-GCM using `STORAGE_ENCRYPTION_KEY`; per-file IV; stores under `/storage/`.
3. Implement `S3StorageDriver` — uses `@aws-sdk/client-s3` against an S3-compatible endpoint (Backblaze B2 / Cloudflare R2 / AWS S3). SSE-S3 enabled. Pre-signed URLs with TTL ≤ 5 min.
4. Driver chosen via `STORAGE_DRIVER=local|s3` env. All other config (`STORAGE_S3_BUCKET`, `STORAGE_S3_REGION`, `STORAGE_S3_ENDPOINT`, `STORAGE_S3_ACCESS_KEY`, `STORAGE_S3_SECRET_KEY`) documented in `.env.example`.
5. Migrate every existing file-upload code path to use this interface. Migrate any existing direct-URL exposure to signed-URL retrieval via `getAttachmentUrl(id)` (with authorization).
6. Build a "data protection" doc at `/docs/data-protection.md`:
   - Storage layout (§3.4).
   - Encryption at rest and in transit.
   - Access controls (signed URLs, TTL, authorization rule).
   - Retention policy (90 days post-deactivation unless legal hold).
   - Backup posture (D.12).
   - Master Admin Data Directory access and audit posture (D.4).
   - Incident response sketch.
7. Tests:
   - Unit: round-trip put → head → getSignedUrl → fetch → bytes match for both drivers.
   - Unit: local driver decrypts correctly; tampered ciphertext fails GCM auth and is rejected.
   - Playwright: upload via property form → file persists → admin views via Data Directory → URL is signed and expires.

**Acceptance.**
- Storage works in dev (local, encrypted) and prod (S3-compatible, SSE).
- No direct file URLs exist in the application.
- `/docs/data-protection.md` is published.

Report back per §1.5.

---

### Prompt D.12 — Backup & restore runbook

**Brief.** Document and verify a nightly backup of the Postgres database and the storage bucket, and a tested restore procedure. This is a runbook deliverable, not just code.

**Steps.**
1. **Database backup.** Use the hosting platform's native backup (Vercel Postgres / Neon / Supabase / RDS — confirm the platform from HANDOVER.md). Configure nightly automated backups with at least 14 days retention. If the platform doesn't provide automation, add a small server endpoint `/api/cron/db-backup` that runs `pg_dump`, encrypts with `STORAGE_ENCRYPTION_KEY`, and uploads to a separate `backups/` prefix in the storage bucket; schedule via cron.
2. **Storage backup.** If the storage bucket is S3-compatible, enable bucket versioning (recovers accidental deletes) and consider cross-region replication (note as recommended-not-required for Phase 1+).
3. **Encryption keys.** Document key management in `/docs/backup-and-restore.md`: who holds the master key, how it's rotated, what happens if it's lost.
4. **Restore drill.** Perform one full restore drill to a scratch environment: pull the most recent backup, run `pg_restore`, verify a smoke-test login and a sample entity retrieval. Record the drill in `/docs/backup-and-restore.md` with date and outcome.
5. **Runbook content** (`/docs/backup-and-restore.md`):
   - Schedule and retention.
   - Where backups live.
   - Step-by-step restore procedure.
   - Recovery time objective (RTO) and recovery point objective (RPO) for Phase 1+.
   - Drill log.

**Acceptance.**
- Nightly backups run and are visible in the storage / platform console.
- A documented restore drill has been performed and logged.
- Runbook is self-sufficient for someone other than the original engineer to execute.

Report back per §1.5.

---

### Prompt D.13 — Webhook handler for Clerk events

**Brief.** Phase 1 noted the Clerk webhook handler is untested. Make it robust and tested. It must handle `user.created`, `user.updated`, `user.deleted` and be safe under retry.

**Steps.**
1. Verify the webhook signing-secret check is in place (`svix-signature` header verification). If not, add it.
2. Implement / refine handlers:
   - `user.created`: ensure a corresponding `User` row exists (idempotent — upsert by Clerk id).
   - `user.updated`: sync mutable fields (email, name); does not change role.
   - `user.deleted`: soft-delete the `User` (set `deactivated_at`, `deactivation_reason='clerk_deleted'`) — never hard-delete because of audit log foreign keys.
3. Persist every received event in a `WebhookEvent` table with the event id; reject duplicates by event id.
4. On handler error, return 500 (Clerk will retry); on processed-already, return 200 quickly.
5. Tests:
   - Unit: simulate each event type with a mocked verified signature; assert the User row state after.
   - Unit: replay the same event id twice; second call is a no-op.
   - Unit: bad signature → 401; missing required fields → 400.

**Acceptance.**
- Handler is signature-verified, idempotent, and tested.
- Soft-delete preserves audit history.

Report back per §1.5.

---

### Prompt D.14 — System wallet floor protection & UI explanation

**Brief.** System wallets (Treasury, Promotions, Fiat Settlement, etc.) currently can go negative in development without UI explanation. Implement a configurable floor per system wallet; soft-lock mutations that would breach it; surface the state to Master Admin clearly.

**Steps.**
1. Extend the system-wallet record with a `floor_kcrd` column (default 0; nullable means "unlimited overdraft", reserved for explicitly authorised wallets).
2. Update the ledger transfer Server Action to check, in the same transaction, that the source system wallet's post-transfer balance ≥ `floor_kcrd`. On breach, abort with a typed error.
3. Surface in the Master Admin Treasury dashboard:
   - Each system wallet shows balance, floor, and a "headroom" figure.
   - Within 10 % of floor: a yellow warning banner on the wallet card.
   - At floor: a red banner "This wallet is at its floor. New transfers from it are blocked until topped up or the floor is adjusted."
4. Allow Master Admin to adjust a wallet's floor in Settings → Treasury, audit-logged.
5. Tests:
   - Unit: transfer that would breach floor is aborted; ledger remains unchanged.
   - Unit: floor adjustment is logged.
   - Playwright: induce near-floor; verify the warning banner; cross to floor; verify the block.

**Acceptance.**
- No system wallet can be silently driven negative.
- The user-facing UI explains what's happening when a transfer is blocked.

Report back per §1.5.

---

### Prompt D.15 — Full email template suite

**Brief.** Author and brand-style every transactional email used in the application; ensure each is tested and previewable. This is the consolidating prompt for everything email.

**Steps.**
1. Establish `react-email` as the templating system (or confirm if already in use). Templates live in `emails/`.
2. Build / refine the following templates with brand colors, brand voice, and clear CTAs:
   - `welcome.tsx` — first-login welcome with a "Sign in" button.
   - `credentials.tsx` — credentials envelope (when the admin issues a password directly rather than a self-set link).
   - `password-reset.tsx` — single-use reset link, 30-minute expiry.
   - `voucher-delivery.tsx` — voucher amount in user's display currency with KCRD note.
   - `settlement-confirmation.tsx` — settlement approved confirmation with receipt details.
   - `rental-extension-decision.tsx` — approval and decline variants in one template, switched by prop.
   - `emergency-broadcast.tsx` — severity-aware (info / urgent / critical) with severity-keyed accent.
   - `lease-ending-soon.tsx` — sent by the cron 14 days before lease end.
   - `treasury-reconciliation-alert.tsx` — Master Admin alert.
   - `mfa-reset-notice.tsx` — sent to a user when an admin resets their MFA.
3. Each template has a Storybook entry (or react-email preview) and a unit test asserting key text and link presence.
4. Each template uses inline styles compatible with the major email clients (Gmail, Apple Mail, Outlook desktop, Outlook web). No `position: absolute`, no flex tricks that fail in Outlook. Use tables where needed for layout.
5. Run a previewer pass on each template, screenshot to `/qa/screenshots/emails/`.

**Acceptance.**
- Every transactional flow uses a brand-styled, tested template.
- Templates render correctly in major clients.
- Preview screenshots are committed.

Report back per §1.5.

---

## BLOCK E — Quality gates

### Prompt E.1 — Technical function test sweep

**Brief.** Walk every flow listed in §5.1 against a freshly-seeded dev environment. Produce `/qa/function-test-report.md` with the full coverage matrix as a table, each row marked Pass / Fail / N-A, with screenshots for failures.

**Steps.**
1. Ensure the dev DB is seeded fresh from the demo seed; confirm all six demo accounts can sign in.
2. Walk each row of the §5.1 coverage matrix.
3. For each flow, attempt the happy path and at least one failure path. Record observations.
4. For any Fail, attempt to fix immediately if the fix is small (≤ 30 minutes effort); otherwise file the finding, mark the test as Fail, and continue.
5. Produce `/qa/function-test-report.md` with:
   - Test environment summary (commit SHA, DB seed version, browser).
   - Coverage matrix table (Domain, Flow, Status, Notes, Screenshot ref).
   - Findings list grouped by severity.
   - "Fixed during sweep" subsection.
   - "Open follow-ups" subsection.
6. Commit the report and any screenshots.

**Acceptance.**
- No Fail rows remain in the matrix without a corresponding open follow-up.
- Report exists and is comprehensive.

Report back per §1.5.

---

### Prompt E.2 — Security test sweep

**Brief.** Execute §5.2 against the application. Produce `/qa/security-test-report.md` with the OWASP ASVS L1 checklist, automated tooling outputs, and a findings list with severities.

**Steps.**
1. Run automated tooling and capture outputs:
   - `npm audit --omit=dev` — capture to `/qa/audit-output.txt`.
   - Secret scan (`gitleaks` against the repo) — capture to `/qa/secrets-scan.txt`.
   - Header scan (`curl -I` against several routes including auth and admin) — capture to `/qa/headers-scan.txt`.
2. Walk the ASVS L1 checklist (V1–V14 as listed in §5.2). For each item, write Pass / Fail / N-A with evidence.
3. Specifically verify the eleven enumerated items in §5.2.
4. Fix Critical and High findings during the sweep.
5. Produce `/qa/security-test-report.md` with:
   - Tooling summary.
   - ASVS L1 checklist with verdicts.
   - Specific verifications.
   - Findings list (Critical / High / Medium / Low / Info) with status (Fixed / Open / Accepted-with-rationale).
6. Commit.

**Acceptance.**
- No Critical or High findings open.
- Report is reproducible from the tooling outputs.

Report back per §1.5.

---

### Prompt E.3 — UX & accessibility test sweep

**Brief.** Execute §5.3 against the application. Produce `/qa/ux-accessibility-report.md`. Pay specific attention to visually-impaired-usability, dead links, malfunctions, incomplete or irrational interactions.

**Steps.**
1. Run automated tooling: `lighthouse` accessibility audit on five representative pages (sign-in, dashboard per role, a form, a list, a modal-heavy page); capture reports to `/qa/lighthouse/`.
2. Walk the twelve-step methodology in §5.3. Capture findings as you go.
3. For each finding, classify severity and propose remediation. Fix small findings immediately; queue larger ones with explicit follow-ups.
4. Produce `/qa/ux-accessibility-report.md` with:
   - Lighthouse summary table (Accessibility scores per page).
   - Keyboard-walk findings.
   - Screen-reader-walk findings.
   - Contrast findings.
   - Zoom & mobile findings.
   - Reduced-motion findings.
   - Dead-link / dead-button audit table.
   - Console-cleanliness audit.
   - Empty-state / error-state / loading-state audit.
   - "Visually impaired" specific section explicitly addressing color-only signaling, icon-without-text usage, and the currency display.
   - Findings list with severity and status.
5. Commit.

**Acceptance.**
- No Critical or High accessibility findings open.
- Lighthouse Accessibility ≥ 95 on all five representative pages.
- Report covers every methodology step with evidence.

Report back per §1.5.

---

### Prompt E.4 — Code quality inspection

**Brief.** Execute §5.4 against the codebase. Produce `/qa/code-quality-report.md`. Apply key remediations during the sweep where small.

**Steps.**
1. Run the ten-step methodology in §5.4. Capture every tool output to a file under `/qa/code-quality/`.
2. Apply small remediations (lint fixes, dead-code removal, typo cleanups) immediately. Record larger ones as follow-ups.
3. Produce `/qa/code-quality-report.md` with:
   - Lint output summary.
   - Type-check output summary.
   - Format-check summary.
   - Test results summary.
   - Top-10-largest-files table with line counts and split recommendations where over 400 lines.
   - Circular-dependency check output.
   - Dead-code output and actions.
   - Duplication clusters and actions.
   - Dependency footprint (unused packages list and security audit).
   - Naming-consistency notes.
   - Server-vs-client component hygiene notes.
   - Refactor backlog with effort estimates.
4. Commit.

**Acceptance.**
- Lint clean, type clean, tests green.
- No critical findings open.
- Report exists and is actionable.

Report back per §1.5.

---

## BLOCK F — Production readiness

### Prompt F.1 — Production build hardening

**Brief.** The application must build cleanly against a production configuration with all secrets sourced from environment, security headers set, and CSP configured. This is the final gate before packaging for the Play Store.

**Steps.**
1. **Env audit.** Walk the codebase for `process.env.*` references; ensure every one is documented in `.env.example` with a one-line description and a placeholder. Group them by domain (auth, db, email, storage, observability, feature flags).
2. **Secret hygiene.** Confirm via Prompt E.2's secret scan that no secret is committed. Confirm `.env*` files are gitignored. Confirm the deployment platform has the production secrets set.
3. **Security headers.** In `next.config.js` (or middleware), set:
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()` (adjust if features need them)
   - `X-Frame-Options: DENY` (or use CSP frame-ancestors)
   - `Content-Security-Policy:` carefully constructed — `default-src 'self'`; `script-src 'self' 'wasm-unsafe-eval' [Clerk domain] [Sentry domain]`; `style-src 'self' 'unsafe-inline'` (acknowledged; tighten in a later phase if a nonce-based approach is added); `img-src 'self' data: blob: [storage domain]`; `connect-src 'self' [Clerk] [Sentry] [Resend] [storage]`; `frame-ancestors 'none'`. Document every allowance.
4. **Build.** Run `npm run build` against a production-style env; resolve any warnings; confirm the bundle size budget is reasonable (homepage initial JS under 250 KB gzipped is the target).
5. **Smoke test.** Deploy to a staging environment; smoke-test sign-in, a transfer, and an admin action. Capture results in the report-back.
6. **Document the production checklist** in `/docs/production-deploy.md`:
   - Pre-deploy: secrets in vault, DNS configured for email (SPF/DKIM/DMARC), Sentry DSN set, Resend domain verified, Clerk production instance configured, storage bucket created with SSE.
   - Deploy steps.
   - Post-deploy verification.
   - Rollback procedure.

**Acceptance.**
- Production build succeeds with zero warnings.
- Headers verified via `curl -I` and `securityheaders.com` (or equivalent) — A grade.
- `/docs/production-deploy.md` published.

Report back per §1.5.

---

### Prompt F.2 — PWA and Play Store packaging

**Brief.** Package the existing Next.js application as a Progressive Web App, then wrap it in a Trusted Web Activity (TWA) using Bubblewrap to produce a signed Android App Bundle (AAB) for Play Store submission. Prepare the Play Console listing assets.

**Steps.**
1. **Make the app a complete PWA.**
   - `manifest.webmanifest` at the public root with: `name="City of Karis"`, `short_name="Karis"`, `start_url="/"`, `display="standalone"`, `background_color` and `theme_color` from brand tokens, full icon set (192, 256, 384, 512, plus 512 maskable).
   - Service worker via `next-pwa` (or equivalent), with a sane runtime caching policy: network-first for API and Server Action requests, cache-first for static assets, stale-while-revalidate for images. Disable in dev.
   - "Install" prompt UI that respects the platform's install criteria.
   - Offline fallback page.
   - Verify against Chrome DevTools' PWA audit — passes installability checks.
2. **Wrap with Bubblewrap (TWA).**
   - Install `@bubblewrap/cli`. Initialize a `twa-manifest.json` referencing the production URL of the deployed app.
   - Configure the package id (e.g. `org.cityofkaris.app`), versioning, signing key. Generate the upload key with `bubblewrap` and document the keystore path and password handling in `/docs/play-store.md` (the keystore is **never** committed; document where Dr. Munroe stores it — recommend a password manager + offline backup).
   - Configure Digital Asset Links — produce `/.well-known/assetlinks.json` on the production site to verify the TWA owns the domain. Without this, the address bar shows in the Android client; with it, the PWA runs full-screen.
   - Build the AAB with `bubblewrap build`. Capture the file path.
3. **Play Console listing assets.** Prepare the following in `/marketing/play-store/`:
   - App icon: 512×512 PNG (high-detail).
   - Feature graphic: 1024×500 PNG (brand wordmark on a brand-green background with the gold tagline).
   - Screenshots: at least four, in 9:16 portrait, at native resolution. Capture from the deployed app at common Android viewport sizes (1080×1920) — sign-in, dashboard, treasury, an announcement.
   - Short description (≤ 80 chars): "The community app for the City of Karis — wallets, governance, and home."
   - Full description (draft, ≤ 4000 chars): write a brand-voice description covering what the app is for, who uses it, and what it offers — Master Admins, Residents, Vendors, Visitors. Avoid implying the app is open to the public.
   - Privacy policy URL: produce `/legal/privacy.md` (a draft Dr. Munroe will review with counsel) and host at `/privacy` route.
   - Terms of service URL: produce `/legal/terms.md` (draft) and host at `/terms` route.
   - Data safety form answers: list every category of data collected (account info, ID documents, location-of-residence, financial transaction data) with purpose and sharing posture. Pre-fill in a `/docs/play-store-data-safety.md` for transcription into Play Console.
4. **Submission readiness checklist** in `/docs/play-store.md`:
   - Production URL live and verified.
   - Asset links file deployed at well-known path.
   - Bubblewrap-built AAB signed with the upload key.
   - Listing assets prepared.
   - Privacy policy and terms hosted.
   - Data safety answers prepared.
   - App content rating questionnaire answered (anticipate "Everyone" rating; this is a community admin app, not a game or social network).
   - Internal testing track strategy: invite Dr. Munroe and a small founding cohort as testers first.
5. Note: actual submission to Play Console (creating the developer account, uploading the AAB, completing the questionnaires, paying the one-time $25 fee, navigating closed → open → production tracks) is a manual step Dr. Munroe will perform. The deliverable here is everything she needs to do it confidently.

**Acceptance.**
- The deployed app passes PWA installability audit.
- A signed AAB exists at a known path and can be installed on a test Android device, opens full-screen with no browser chrome, and the app functions identically.
- All listing assets exist and are brand-correct.
- `/docs/play-store.md` is a complete submission runbook.

Report back per §1.5.

---

# PART VII — HANDOVER FORMAT

At the end of every prompt in Part VI, Claude Code returns a structured handover. The format below is canonical. Copy it verbatim.

```
## Prompt [Block.Id] handover

### Done
- [bullet list of completed items]

### Files touched
- [path/to/file.ts] — [one-line note: created / modified / deleted]
- ...

### New dependencies
- [package@version] — [one-line rationale]
- (or "None.")

### Tests added or updated
- [path/to/test.ts] — [one-line note]
- (or "None — and here is why: …")

### Migrations
- [migration name] — [one-line summary]
- (or "None.")

### Known issues / deferred items
- [item] — [why deferred / what will pick it up]
- (or "None.")

### Validation evidence
- [test output snippet, screenshot path, manual check note]
- ...

### Acceptance check
- [criterion 1] — Met / Not met (reason)
- [criterion 2] — Met / Not met (reason)
- ...

### Next prompt
- [the next prompt id this engagement should run]
```

If any acceptance criterion is "Not met," the next prompt does not run until it is addressed.

---

# APPENDIX A — Tailwind theme & token plugin

Drop the following into `tailwind.config.ts` (merge into the existing config). Components must reference colors only via these names.

```ts
// tailwind.config.ts (excerpt)
import type { Config } from "tailwindcss";

export default {
  theme: {
    extend: {
      colors: {
        brand: {
          green: {
            900: "#1F2E26",
            700: "#3A5A4D",
            500: "#5B7E70",
            100: "#DCE8E2",
          },
          gold: {
            700: "#8C7035",
            500: "#B89548",
            300: "#D4B878",
            100: "#F2E8D0",
          },
        },
        stone: {
          900: "#2A2521",
          700: "#5C544C",
          500: "#8C857B",
          300: "#C4BEB6",
          100: "#F0EBE3",
          50:  "#FAF7F2",
        },
        feedback: {
          success: "#3F8A5C",
          warning: "#C58A2D",
          danger:  "#B23A3A",
          info:    "#3A6E8C",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          alt:     "#FAF7F2",
        },
      },
      fontFamily: {
        display: ['"Cambria"', '"Cormorant Garamond"', "serif"],
        body:    ['"Calibri"', '"Inter"', "system-ui", "sans-serif"],
        mono:    ['"JetBrains Mono"', '"Roboto Mono"', "monospace"],
      },
      borderRadius: {
        sm:  "8px",
        DEFAULT: "12px",
        lg:  "16px",
      },
      boxShadow: {
        card: "0 4px 16px rgba(31, 46, 38, 0.08)",
      },
      transitionTimingFunction: {
        brand: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    },
  },
} satisfies Config;
```

A matching `:root` CSS-variable layer should also be exposed in `app/globals.css` so non-Tailwind contexts (emails, inline-styled components) can reference the same tokens.

---

# APPENDIX B — Prisma schema additions (consolidated)

The migrations introduced across the prompts above, consolidated for review. Each is added by its corresponding prompt (do not run all at once).

```prisma
// Currency (Prompt C.1)
enum CurrencyCode {
  KCRD
  USD
  GYD
}

model ConversionRate {
  id              String       @id @default(uuid())
  baseCurrency    CurrencyCode
  quoteCurrency   CurrencyCode
  rate            Decimal      @db.Decimal(18, 8)
  effectiveFrom   DateTime
  effectiveTo     DateTime?
  setBy           User         @relation(fields: [setById], references: [id])
  setById         String
  createdAt       DateTime     @default(now())

  @@unique([baseCurrency, quoteCurrency, effectiveFrom])
  @@index([baseCurrency, quoteCurrency, effectiveFrom, effectiveTo])
}

enum ConversionDirection {
  FIAT_TO_KCRD
  KCRD_TO_FIAT
}

enum PromotionEligibility {
  ALL
  FOUNDING_MEMBERS
  RESIDENTS_ONLY
  SPECIFIC_USERS
}

model ConversionPromotion {
  id              String                @id @default(uuid())
  name            String
  description     String                @db.Text
  bonusPercent    Decimal               @db.Decimal(5, 2)
  direction       ConversionDirection
  eligibility     PromotionEligibility
  eligibleUserIds String[]              @default([])
  startsAt        DateTime
  endsAt          DateTime
  active          Boolean               @default(true)
  createdBy       User                  @relation(fields: [createdById], references: [id])
  createdById     String
  createdAt       DateTime              @default(now())
}

// User additions (C.1)
// model User {
//   ...
//   displayCurrency  CurrencyCode  @default(KCRD)
//   foundingMember   Boolean       @default(false)
//   onboardingTourCompletedAt   DateTime?
//   onboardingTourDismissedAt   DateTime?
//   deactivatedAt               DateTime?
//   deactivationReason          String?
// }

// Visitor groups (Prompt C.2)
model VisitorGroup {
  id           String                    @id @default(uuid())
  name         String                    @unique
  theme        String?
  description  String                    @db.Text
  createdBy    User                      @relation(fields: [createdById], references: [id])
  createdById  String
  createdAt    DateTime                  @default(now())
  archived     Boolean                   @default(false)
  memberships  VisitorGroupMembership[]
}

model VisitorGroupMembership {
  id          String         @id @default(uuid())
  user        User           @relation("VisitorGroupMember", fields: [userId], references: [id])
  userId      String
  group       VisitorGroup   @relation(fields: [groupId], references: [id])
  groupId     String
  assignedBy  User           @relation("VisitorGroupAssigner", fields: [assignedById], references: [id])
  assignedById String
  assignedAt  DateTime       @default(now())
  removedAt   DateTime?

  @@index([userId, removedAt])
}

// Announcement extensions (C.2)
enum AnnouncementTargetType {
  COMMUNITY_WIDE
  ROLE
  VISITOR_GROUP
  SPECIFIC_USERS
}

// model Announcement {
//   ...
//   targetType       AnnouncementTargetType  @default(COMMUNITY_WIDE)
//   targetRole       Role?
//   targetGroupId    String?
//   targetUserIds    String[]                @default([])
//   isEmergency      Boolean                 @default(false)
//   severity         String?                  // info|urgent|critical
// }

// Lease & rental extensions (Prompt C.3)
enum LeaseCycle {
  DAILY
  WEEKLY
  MONTHLY
  ANNUAL
}

enum LeaseStatus {
  ACTIVE
  ENDING_SOON
  EXPIRED
  CANCELLED
}

// model Lease {
//   ...
//   cycleUnit         LeaseCycle
//   cycleAmountKcrd   Decimal       @db.Decimal(18, 2)
//   startDate         DateTime      @db.Date
//   endDate           DateTime      @db.Date
//   nextPaymentDue    DateTime      @db.Date
//   status            LeaseStatus   @default(ACTIVE)
// }

enum ExtensionStatus {
  PENDING
  APPROVED
  DECLINED
}

model RentalExtensionRequest {
  id                    String           @id @default(uuid())
  lease                 Lease            @relation(fields: [leaseId], references: [id])
  leaseId               String
  requestedBy           User             @relation("ExtensionRequester", fields: [requestedById], references: [id])
  requestedById         String
  requestedNewEndDate   DateTime         @db.Date
  reason                String?          @db.Text
  status                ExtensionStatus  @default(PENDING)
  reviewedBy            User?            @relation("ExtensionReviewer", fields: [reviewedById], references: [id])
  reviewedById          String?
  reviewedAt            DateTime?
  decisionNote          String?          @db.Text
  createdAt             DateTime         @default(now())

  @@index([status])
}

// Attachments (Prompt B.3 / D.11)
enum AttachmentEntityType {
  PROPERTY
  RESIDENT
  VISITOR
  VENDOR
  LEASE
  ISSUE_REPORT
  OTHER
}

model Attachment {
  id           String                @id @default(uuid())
  storageKey   String                @unique
  mimeType     String
  sizeBytes    BigInt
  sha256       String                @db.Char(64)
  uploadedBy   User                  @relation(fields: [uploadedById], references: [id])
  uploadedById String
  uploadedAt   DateTime              @default(now())
  entityType   AttachmentEntityType
  entityId     String
  category     String
  encrypted    Boolean               @default(false)
  iv           Bytes?

  @@index([entityType, entityId])
}

// Email log (Prompt A.1)
enum EmailStatus {
  QUEUED
  SENT
  FAILED
}

model EmailLog {
  id              String        @id @default(uuid())
  toEmail         String
  toName          String?
  subject         String
  template        String
  dataJson        Json
  idempotencyKey  String        @unique
  status          EmailStatus
  providerId      String?
  providerError   String?
  createdAt       DateTime      @default(now())
  sentAt          DateTime?

  @@index([toEmail])
  @@index([template, status])
}

// Audit log (verify shape — Prompt D.4)
// model AuditLog {
//   id           String    @id @default(uuid())
//   actorUserId  String?
//   action       String
//   entityType   String
//   entityId     String?
//   beforeJson   Json?
//   afterJson    Json?
//   metadataJson Json?
//   ipAddress    String?
//   userAgent    String?
//   createdAt    DateTime  @default(now())
//
//   @@index([actorUserId, createdAt])
//   @@index([entityType, entityId, createdAt])
// }

// Webhook events (Prompt D.13)
model WebhookEvent {
  id              String     @id
  source          String     // 'clerk'
  type            String
  payload         Json
  signatureValid  Boolean
  processedAt     DateTime?
  errorMessage    String?
  receivedAt      DateTime   @default(now())
}

// Reconciliation (Prompt D.5)
enum ReconciliationStatus {
  OK
  WARNING
  MISMATCH
}

model ReconciliationReport {
  id            String                  @id @default(uuid())
  runAt         DateTime                @default(now())
  status        ReconciliationStatus
  details       Json
  acknowledgedBy   User?                @relation(fields: [acknowledgedById], references: [id])
  acknowledgedById String?
  acknowledgedAt   DateTime?
}

// System wallet floors (Prompt D.14)
// model SystemWallet {
//   ...
//   floorKcrd       Decimal?  @db.Decimal(18, 2)
// }
```

---

# APPENDIX C — Environment variables (canonical list)

```
# App
NODE_ENV=development|production
DEPLOY_ENV=development|staging|production
NEXT_PUBLIC_APP_URL=https://app.cityofkaris.org
NEXT_PUBLIC_DEMO_MODE_ENABLED=true|false

# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...        # used by Prisma migrate; required by some hosts

# Auth (Clerk)
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@cityofkaris.org
RESEND_FROM_NAME=City of Karis

# Storage
STORAGE_DRIVER=local|s3
STORAGE_ENCRYPTION_KEY=...                       # 32 bytes base64 — local driver only
STORAGE_S3_BUCKET=cok-attachments
STORAGE_S3_REGION=us-west-002
STORAGE_S3_ENDPOINT=https://s3.us-west-002.backblazeb2.com
STORAGE_S3_ACCESS_KEY=...
STORAGE_S3_SECRET_KEY=...

# Observability (Sentry)
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...                             # for source maps in CI
SENTRY_ORG=...
SENTRY_PROJECT=...

# Rate limiting (Upstash, optional in dev)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Cron (shared secret for protected endpoints)
CRON_SECRET=...
```

---

# APPENDIX D — Acceptance summary checklist (for Dr. Munroe's sign-off)

A single page Dr. Munroe can use to confirm Phase 1+ is complete.

| Block | Item | Done? |
|---|---|---|
| A.1 | Resend transactional emails actually send across all flows | ☐ |
| A.2 | Master Admin can edit fees with history & audit | ☐ |
| A.3 | Approvals Center tabs (Settlements, Property Transfers, Vouchers) all functional | ☐ |
| B.1 | Sign-in page is brand-consistent; demo shortcut env-gated | ☐ |
| B.2 | Every modal complies with the spacing primitive | ☐ |
| B.3 | Every intake form captures every spec field with required uploads | ☐ |
| C.1 | KCRD / USD / GYD display toggle + admin rate editor + bonus promotions | ☐ |
| C.2 | Visitor Groups + group-targeted announcements + visitor permission lockdown | ☐ |
| C.3 | Lease cycles, next payment due, extension request workflow | ☐ |
| D.1 | Bulk Excel import — members | ☐ |
| D.2 | Bulk Excel import — properties | ☐ |
| D.3 | MFA enforced for staff roles | ☐ |
| D.4 | Audit log viewer + Master Admin Data Directory | ☐ |
| D.5 | Treasury reconciliation auto-alerts | ☐ |
| D.6 | Emergency broadcast | ☐ |
| D.7 | Onboarding tour per role | ☐ |
| D.8 | Sentry on client and server | ☐ |
| D.9 | Rate limiting on Server Actions | ☐ |
| D.10 | Ten Playwright E2E tests green | ☐ |
| D.11 | File storage layout, encryption, signed URLs | ☐ |
| D.12 | Backup & restore runbook + drill log | ☐ |
| D.13 | Clerk webhook handler robust + tested | ☐ |
| D.14 | System wallet floors enforced + UI explained | ☐ |
| D.15 | Full email template suite, brand-styled, tested | ☐ |
| E.1 | `/qa/function-test-report.md` complete, no open Fail rows | ☐ |
| E.2 | `/qa/security-test-report.md` complete, no Critical/High open | ☐ |
| E.3 | `/qa/ux-accessibility-report.md` complete, Lighthouse ≥ 95 | ☐ |
| E.4 | `/qa/code-quality-report.md` complete, lint/type/test green | ☐ |
| F.1 | Production build succeeds; security headers A-grade | ☐ |
| F.2 | PWA installable; AAB built and signed; Play Store assets ready | ☐ |

When every box is checked, the Phase 1+ engagement is complete and the application is ready for Dr. Munroe's official-launch decision.

---

*End of playbook.*
