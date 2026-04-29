# Data Directory & Data Protection

## Purpose

The Master Admin Data Directory (`/admin/data-directory`) is the single point of access for inspecting any record in the system. It is designed so that a Master Administrator can locate, review, and export the full digital footprint of any user, property, lease, or issue report without needing direct database access.

Every sensitive action performed through the Data Directory — opening an attachment, running an export, resetting MFA — is recorded in the audit log with the actor's identity, timestamp, and target entity.

---

## Access Controls

| Role | View Data Directory | View Attachments | Export Records | Reset MFA |
|---|---|---|---|---|
| MASTER_ADMIN | Yes | Yes (audited) | Yes (audited) | Yes (audited) |
| ADMIN | Yes* | Yes* (audited) | No | No |
| RESIDENT / VENDOR / VISITOR | No | No | No | No |

\* ADMIN access to the admin section is disabled in Phase 1+ (all admin routes require MASTER_ADMIN per the layout). This table reflects the intended permission model; ADMIN access will be enabled in a future phase.

Non-permitted roles receive a redirect to the home page (enforced by `app/(admin)/layout.tsx`). There are no client-only guards — all authorization is enforced server-side before any data is returned.

---

## Audit Log Viewer

`/admin/audit-log` provides a filterable, paginated view of the append-only `AuditLog` table.

**Filters available:** actor ID, action (free-text contains), entity type, entity ID, date range.

**Export:** The "Export CSV" button downloads all matching entries as CSV. The export itself is written to the audit log as `AUDIT_LOG_EXPORT`.

**Row expansion:** Each row can be expanded to show the `before` and `after` JSON payloads in a side-by-side diff view.

---

## Data Directory — Entity Detail

Selecting an entity in the left-rail tree opens a tabbed detail panel:

| Tab | Content |
|---|---|
| Overview | Key identity fields |
| Records | Complete field set including KYC and profile data |
| Attachments | Thumbnail grid (images) or file list (PDFs) with View button |
| Transactions | Ledger entry history (users only) |
| Audit | Audit log entries scoped to this entity |

### Attachment Viewing

Clicking "View" on an attachment:
1. Calls `getAttachmentUrlAction(attachmentId)` server-side.
2. The action verifies the requesting user is an admin.
3. An `RETRIEVE_ATTACHMENT` audit entry is created before the URL is returned.
4. The file opens in a new browser tab.

Attachment URLs are the UploadThing CDN storage keys and are publicly accessible once you have the URL. Access controls are enforced at the retrieval-action layer, not at the CDN layer.

---

## Record Export

Only MASTER_ADMIN may initiate a record export for a user.

**Export route:** `GET /api/admin/data-directory/export/[userId]`

**ZIP contents:**
```
user-export-{memberId}-{date}.zip
├── user.json          # All user fields
├── ledger.json        # Ledger entries for the user's wallet
├── manifest.json      # Export metadata, SHA-256 hashes
└── attachments/
    ├── {filename}     # Attachment binary files
    └── ...
```

**Manifest structure:**
```json
{
  "userId": "...",
  "exportedAt": "2026-...",
  "actorId": "...",
  "userJsonHash": "sha256:...",
  "attachments": [
    {
      "id": "...",
      "name": "...",
      "mimeType": "...",
      "status": "ok | error",
      "hash": "sha256:..."
    }
  ]
}
```

An `data_directory.export` audit entry is created with the actor, target user, and manifest hash. This entry cannot be deleted.

If an individual attachment fetch fails (e.g. CDN unavailable), the attachment is noted in the manifest with `"status": "error"` and the export continues — it does not abort.

---

## MFA Reset

Only MASTER_ADMIN may reset another staff member's MFA.

**Action:** `resetUserMfaAction(userId)` in `app/(admin)/_actions/data-directory.ts`

**Process:**
1. Calls `clerkClient().users.disableUserMFA(clerkId)` to disable 2FA in Clerk.
2. Creates a `RESET_MFA` audit entry with actor, target, and timestamp.
3. Sends a `mfa-reset` email to the affected user notifying them of the reset.

The affected user will be redirected to `/account/mfa-enroll` on their next sign-in to the admin section.

**Prerequisite:** Clerk dashboard must have TOTP_OR_BACKUP_CODE strategy enabled. See `docs/mfa.md` for setup instructions.

---

## Retention and Deletion Policy

- Audit log entries are append-only and have no automated deletion.
- Exports are downloaded directly — no export files are stored server-side.
- Attachment binaries are stored in UploadThing. Deletion of an attachment record (via `deleteAttachmentAction`) removes the DB record but does not currently delete the CDN file. A CDN cleanup procedure should be implemented before production if PII storage compliance requires it (out of scope for Phase 1+).

---

## D.11 Note

This document will be extended by Prompt D.11 (storage architecture), which will define the full file lifecycle, signed-URL expiry, and PII retention timelines.
