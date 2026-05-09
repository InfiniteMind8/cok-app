# Privacy Policy — City of Karis

> **DRAFT — pending counsel review.** This document is an author-best-effort working draft. It must be reviewed and approved by the City of Karis project owner together with qualified legal counsel before the app is promoted out of the Play Store internal-testing track.

**Effective date:** _to be set on counsel approval_
**Operator:** City of Karis Limited (Guyana)
**Contact:** privacy@cityofkaris.org

---

## 1. About this policy

The City of Karis Community App ("Karis", "the app") is a private community platform serving the residents, vendors, master administrators, and visitors of the City of Karis development in Guyana. This policy explains what personal data we collect, why, how it is stored, who it is shared with, and what rights you have over it.

The app is **not open to the general public**. Access is granted by invitation through the City of Karis administration. By signing in, you confirm you are an authorised member of one of the four roles below.

## 2. Roles and the data each one provides

| Role | Why we collect data |
|---|---|
| **Master Admin** | Operating the platform, treasury, audits, and member management. |
| **Resident / Tenant** | Wallet, governance voting, lease and payment lifecycle, community announcements. |
| **Vendor** | Offer listings, transactions, vouchers. |
| **Visitor** | Time-bound access to specific community announcements via Visitor Groups. |

## 3. Categories of data we collect

| Category | Examples | Purpose |
|---|---|---|
| Account info | Name, email, phone, role, profile photo | Authenticate you, route notifications, display in directories visible to staff. |
| Identity documents | Government ID images uploaded during onboarding (B.3) | Verify membership eligibility. Stored encrypted; access restricted to Master Admin and the affected user. |
| Location of residence | Property linkage (address / lot / unit) | Lease lifecycle, voting eligibility, emergency broadcast routing. |
| Financial transaction data | KCRD ledger transactions, fiat conversion rates, fee schedule history | Accounting, reconciliation, statutory reporting. |
| Authentication & security | Hashed passwords (held by Clerk), MFA secrets / backup codes, IP and user-agent during sign-in, rate-limit counters | Account security, audit, abuse prevention. |
| Communications | Email delivery logs, in-app announcements you have read, voting submissions | Operational integrity, audit trail. |
| Device & technical | Browser type, OS, screen size (collected via the deployed app and Sentry), error reports | Reliability, security monitoring, UX improvement. PII-stripped before storage. |

We do **not** collect: precise GPS location, contact lists, microphone or camera streams, advertising identifiers, or biometric data.

## 4. How long we keep data

| Data | Retention |
|---|---|
| Account, property, ledger | For the lifetime of the account; archived (not deleted) on closure for statutory and audit purposes. |
| Identity documents | Until verification is complete plus 24 months, then deleted unless retention is required by law. |
| Audit logs | Indefinite, immutable. Required for treasury reconciliation. |
| Email logs | 24 months. |
| Sentry / observability | 90 days. PII-stripped. |
| Backups | Per `docs/backup-and-restore.md` — Supabase Pro tier, point-in-time recovery + daily snapshots, 14-day target. |

## 5. Where data is processed and stored

- **Database** — Supabase (PostgreSQL), region selected by the operator at deploy time. Encrypted at rest by Supabase.
- **File attachments (ID documents, property photos, etc.)** — encrypted at rest using AES-256-GCM with per-file IVs (see `docs/data-protection.md`). Served only via signed, short-lived URLs.
- **Authentication** — Clerk (cloud-hosted, GDPR-aligned).
- **Email delivery** — Resend (transactional only).
- **Error monitoring** — Sentry (PII-scrubbed).
- **Rate limiting** — Upstash Redis.

Data may be processed in jurisdictions outside Guyana by these sub-processors. We choose providers who maintain industry-standard encryption in transit (TLS 1.2+) and at rest.

## 6. Who we share data with

We share personal data only:

- With the providers listed in §5, strictly to operate the service.
- With City of Karis staff (Master Admin, Admin) on a need-to-know basis for community administration.
- When required by Guyanese law, court order, or to investigate suspected unlawful activity affecting the City of Karis or its members.

We do **not** sell personal data. We do **not** share data with advertising networks or data brokers.

## 7. Your rights

If you are a Karis member you may, at any time:

- **Access** the data we hold about you. The Master Admin can export your record on request.
- **Correct** inaccuracies (use the Profile screen, or contact a Master Admin).
- **Delete** your account; certain ledger and audit-log data must be retained for accounting and statutory purposes but personal identifiers are removed.
- **Object** to processing for any purpose other than running the community.
- **Lodge a complaint** with the appropriate Guyanese data-protection authority once it is gazetted.

To exercise any right, contact privacy@cityofkaris.org.

## 8. Security

- TLS 1.2+ in transit, enforced by HSTS.
- All file attachments encrypted at rest.
- MFA enforced for staff roles.
- Rate limiting on authentication and bulk actions.
- Audit log of every privileged action.
- Quarterly security review by the project owner.

If you suspect your account has been compromised, contact privacy@cityofkaris.org immediately. We will follow the procedure documented in `docs/data-protection.md`.

## 9. Children

The Karis app is for adult Karis members. Anyone under 18 must use the platform only under the supervision of a primary tenant of record.

## 10. Changes

We will notify members in-app and by email at least 14 days before any material change to this policy.

---

*This document tracks the engineering implementation in this repo as of 2026-05-09. Counsel review is mandatory before publication.*
