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

---

## Storage Architecture

All uploaded files are stored in a structured layout under a single storage root, organised by entity type:

```
storage/
  property/
    {entity_id}/
      photos/           {file_id}.jpg
      titledeed/        {file_id}.pdf
      occupancypermit/  {file_id}.pdf
      utilitydocs/      {file_id}.pdf
  user/
    {entity_id}/
      idscan/           {file_id}.pdf
      profilephoto/     {file_id}.jpg
      vendordocs/       {file_id}.pdf
  issue/
    {entity_id}/
      media/            {file_id}.jpg | .mp4
  lease/
    {entity_id}/
      leaseagreement/   {file_id}.pdf
  voucher_request/
    {entity_id}/
      attachment/       {file_id}.pdf
```

In production, the same key layout is used in an S3-compatible object store (Backblaze B2 recommended; Cloudflare R2 or AWS S3 are supported).

The storage driver is selected via `STORAGE_DRIVER=local|s3` in the environment. All other storage configuration is in `.env.example`.

---

## Encryption at Rest

**Local driver (`STORAGE_DRIVER=local`):**
- Every file is encrypted with AES-256-GCM before writing to disk.
- A random 12-byte IV is generated per file.
- The on-disk format is: `[12-byte IV][16-byte GCM auth tag][ciphertext]`.
- The key is derived from `STORAGE_ENCRYPTION_KEY` (64 hex chars / 32 bytes). Generate with `openssl rand -hex 32`.
- GCM auth tag verification ensures tampered or corrupt files are rejected at read time.

**S3 driver (`STORAGE_DRIVER=s3`):**
- Server-side encryption is enabled on every `PutObject` call with `ServerSideEncryption: 'AES256'` (SSE-S3).
- The bucket should also have a bucket policy enforcing `aws:SecureTransport` (deny HTTP).

---

## Encryption in Transit

- All traffic is served over HTTPS only. HTTP is not accepted in production.
- Pre-signed S3 URLs are HTTPS-only; the query-string signature covers the URL path and expiry.
- Local serve tokens are HMAC-SHA256 signed and validated before the file is decrypted and streamed.
- A `Strict-Transport-Security` header should be set at the CDN/load-balancer layer.

---

## Access Controls & Signed URLs

Files are **never served by direct URL or raw storage path**. All access goes through a short-lived signed URL:

| Driver | Signed URL mechanism | TTL |
|---|---|---|
| local | HMAC-SHA256 token → `GET /api/attachments/serve?token=…` | 5 min |
| s3 | AWS `getSignedUrl` (GetObjectCommand) | ≤ 5 min |

**Authorization rule (enforced in `getAttachmentUrlAction`):**
A user may retrieve a signed URL only if they are:
1. The `uploadedBy` user for the attachment, OR
2. A `MASTER_ADMIN` or `ADMIN` role (retrieval is then audit-logged).

All other callers receive a `Forbidden` error. There are no anonymous reads. Server Actions enforce this before generating any URL.

---

## Retention Policy

- Attachment records and files are retained indefinitely unless explicitly deleted.
- On user **deactivation**: a background process (not yet implemented; target: D.12 scope) should purge attachments 90 days after `deactivatedAt`, unless a legal-hold flag is set on the user record.
- Audit log entries referencing the attachment are append-only and are not deleted.
- `deleteAttachmentAction` removes the DB record and the file from the storage backend. It is audit-logged.

---

## Backup Posture

See `docs/backup-and-restore.md` (produced by D.12) for the full runbook.

**Summary:**
- **Local driver**: The `storage/` directory must be included in nightly server backups. Backups should themselves be encrypted with the same `STORAGE_ENCRYPTION_KEY`.
- **S3 driver**: Enable bucket versioning to protect against accidental deletes. Cross-region replication is recommended (not required) for Phase 1+.

---

## Incident Response Sketch

**Key compromise (STORAGE_ENCRYPTION_KEY rotated):**
1. Generate a new key with `openssl rand -hex 32`.
2. For the local driver: re-encrypt all existing files (read → decrypt with old key → encrypt with new key → write). A migration script should be prepared before rotating.
3. Update `STORAGE_ENCRYPTION_KEY` in the environment and restart all instances.
4. Old signed URLs become invalid immediately (they depend on the HMAC key).

**S3 access key compromise:**
1. Immediately rotate `STORAGE_S3_ACCESS_KEY` / `STORAGE_S3_SECRET_KEY` in the S3 console.
2. Update environment variables and restart instances.
3. Any outstanding pre-signed URLs become invalid (they are signed with the old access key).
4. Review S3 access logs for unauthorised reads.

**Unauthorised file access detected:**
1. Identify the attachment ID and requestor from the audit log (`RETRIEVE_ATTACHMENT` entries).
2. If the file contained PII, notify the affected data subject per the applicable privacy regulation.
3. Revoke the user's session if access was via a compromised account.
4. Preserve the audit log entries — do not delete them.
