# Play Console Data Safety — Pre-filled Answers

> Transcribe these answers into the Play Console **Data Safety** form when submitting the City of Karis app. Each section maps to a Play Console question. Lines marked _(verify with privacy.md)_ should be cross-checked against `legal/privacy.md` before submission to keep the two in sync.

Last reviewed: 2026-05-09 against the Phase 1+ implementation.

---

## A. Data collection and security (top-level)

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes.** |
| Is all of the user data collected by your app encrypted in transit? | **Yes.** TLS 1.2+ enforced via HSTS (`Strict-Transport-Security`, see `qa/headers-scan-f1.txt`). |
| Do you provide a way for users to request that their data is deleted? | **Yes.** Users may request deletion via support@cityofkaris.org. The Master Admin "Reset / close account" flow performs the deletion subject to retention required for ledger and audit records. _(verify with privacy.md §7)_ |

---

## B. Data types collected

For each row: collected (Y/N), shared with third parties (Y/N), processing is **required** (R) / **optional** (O), purposes selected.

### Personal info

| Type | Collected | Shared | R/O | Purposes |
|---|---|---|---|---|
| Name | Yes | No | R | Account management, Communications |
| Email | Yes | No | R | Account management, Communications, Fraud prevention / security |
| Phone number | Yes | No | O | Account management, Communications |
| User IDs (Clerk user id) | Yes | No | R | Account management, Analytics, Fraud prevention / security |
| Address | No | No | — | — |
| Race or ethnicity | No | No | — | — |
| Political or religious beliefs | No | No | — | — |
| Sexual orientation | No | No | — | — |
| Other personal info — government ID image | Yes | No | O | Account management (membership eligibility verification only). Stored encrypted at rest (`docs/data-protection.md`). |

### Financial info

| Type | Collected | Shared | R/O | Purposes |
|---|---|---|---|---|
| User payment info | No | No | — | — _(KCRD is internal accounting; no payment-card data is collected by the app — see legal/terms.md §4)_ |
| Purchase history | No | No | — | — |
| Credit score | No | No | — | — |
| Other financial info — KCRD ledger transactions | Yes | No | R | App functionality, Account management _(internal community accounting unit; see legal/terms.md §4)_ |

### Location

| Type | Collected | Shared | R/O | Purposes |
|---|---|---|---|---|
| Approximate location | No | No | — | — |
| Precise location | No | No | — | — |

> Property linkage (lot / unit) is **not** location data per Play Console's definition — it is an operational identifier under "Account info," already covered above.

### Messages

| Type | Collected | Shared | R/O | Purposes |
|---|---|---|---|---|
| Emails | No | No | — | — _(Email **delivery records** are kept in `EmailLog` for audit and idempotency; we do not collect or read user-to-user email content)_ |
| SMS or MMS | No | No | — | — |
| Other in-app messages | No | No | — | — |

### Photos and videos

| Type | Collected | Shared | R/O | Purposes |
|---|---|---|---|---|
| Photos (profile photo, property photo, attachment) | Yes | No | O | Account management, App functionality. Stored encrypted at rest. |
| Videos | No | No | — | — |

### Audio files

| Type | Collected | Shared | R/O | Purposes |
|---|---|---|---|---|
| Voice or sound recordings | No | No | — | — |
| Music files | No | No | — | — |
| Other audio files | No | No | — | — |

### Files and docs

| Type | Collected | Shared | R/O | Purposes |
|---|---|---|---|---|
| Files and docs (lease attachments, voucher proof, etc.) | Yes | No | O | App functionality. Stored encrypted at rest. Signed-URL access only. |

### Calendar / contacts

| Type | Collected | Shared | R/O | Purposes |
|---|---|---|---|---|
| Calendar events | No | No | — | — |
| Contacts | No | No | — | — |

### App activity

| Type | Collected | Shared | R/O | Purposes |
|---|---|---|---|---|
| App interactions (Sentry breadcrumbs, audit log entries) | Yes | No | R | Analytics, App functionality, Fraud prevention / security |
| In-app search history | No | No | — | — |
| Installed apps | No | No | — | — |
| Other user-generated content | Yes | No | R | App functionality (governance votes, announcement acknowledgements, issue reports) |
| Other user actions | Yes | No | R | App functionality, Fraud prevention / security (admin actions logged immutably) |

### Web browsing

| Type | Collected | Shared | R/O | Purposes |
|---|---|---|---|---|
| Web browsing history | No | No | — | — |

### App info and performance

| Type | Collected | Shared | R/O | Purposes |
|---|---|---|---|---|
| Crash logs (Sentry) | Yes | No | R | Analytics, App functionality. PII-scrubbed before storage. |
| Diagnostics (Sentry breadcrumbs / performance traces) | Yes | No | O | Analytics, App functionality |
| Other app performance data | No | No | — | — |

### Device or other IDs

| Type | Collected | Shared | R/O | Purposes |
|---|---|---|---|---|
| Device or other IDs | Yes | No | R | Fraud prevention / security (rate limiting via Upstash Redis is keyed on IP; user-agent included in audit log) |

---

## C. Security practices to declare

- [x] Data is encrypted in transit.
- [x] You can request that data be deleted.
- [x] Committed to following the Play Families Policy (N/A — app is invitation-only and gated for adult Karis members per legal/terms.md §1).
- [x] Independent security review — **No** for Phase 1+. Plan: schedule an external review before opening the app to wider community use.

---

## D. Notes for the reviewer / submitter

- Replace the production privacy/terms URLs in the Play Console form with the live URLs once `https://<production-domain>/privacy` and `/terms` are reachable. Both routes are part of this build (F.2) and are public, no auth gate.
- The Data Safety form tooltip "shared with third parties" considers our sub-processors (Clerk, Resend, Sentry, Supabase, Upstash, S3) **not** to be sharing for the purpose of these answers — they process data on our instructions only. If the Play Console reviewer's interpretation differs, mark "Yes" for the affected row and choose purpose "Account management" plus "Fraud prevention / security."
- Sentry's PII scrubbing is configured in `website/sentry.{client,server,edge}.config.ts`; user data passed to Sentry is reduced to `{ role }` only (no email, name, phone, or storageKey). This is referenced when the Play Console form asks about analytics data.
- KCRD ledger entries are not "user payment info" in the Play Console sense — KCRD is an internal accounting unit (legal/terms.md §4). The app does not handle credit cards, debit cards, or bank account numbers itself.
