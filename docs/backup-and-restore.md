# Backup & Restore Runbook

**Status:** Active  
**Last updated:** 2026-04-29  
**Owner:** Master Administrator / DevOps lead  
**Audience:** Anyone executing a restore — this document must be self-sufficient without the original engineer.

---

## 1. Overview & Objectives

### Recovery targets

| Objective | Target | Notes |
|---|---|---|
| **RPO** (Recovery Point Objective) | 24 hours | Daily Supabase snapshot; <1 minute with PITR on Pro plan |
| **RTO** (Recovery Time Objective) | 4 hours | Supabase restore (~30 min) + Vercel redeploy (~5 min) + smoke-test verification (~30 min) |

### What is backed up

1. **PostgreSQL database** — the Supabase-managed Postgres instance (all tables, schema, seed data).
2. **File storage** — the `storage/` directory (local driver) or S3-compatible bucket (production driver), containing all encrypted uploaded attachments.
3. **Encryption key** — `STORAGE_ENCRYPTION_KEY` must be backed up independently (see §4).

### What is NOT backed up here

- Vercel environment variables — managed in the Vercel dashboard; export these manually and store in a password manager.
- Clerk user data — Clerk maintains its own redundant infrastructure; contact Clerk support for recovery.
- Code — the Git repository is the source of truth; push to GitHub/GitLab as the backup.

---

## 2. Database Backup

### 2a. Supabase native backup (primary mechanism)

Supabase performs automated daily backups. The backup tier depends on the project plan:

| Plan | Backup type | Retention | PITR |
|---|---|---|---|
| Free | Daily snapshot | 1 day | No |
| Pro | Daily snapshot | 7 days | Yes (7-day window, 1-min granularity) |
| Team / Enterprise | Daily snapshot | 30 days | Yes (30-day window) |

> **Production recommendation:** Upgrade to the **Pro plan** before go-live. The Free plan retains only 1 day — insufficient for the 14-day target. Pro PITR enables recovery to any point within the last 7 days.

#### Verifying backups are running

1. Log in to [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Select the **City of Karis** project.
3. Navigate to **Project Settings → Database → Backups**.
4. Confirm the most recent backup timestamp is within the last 24 hours.
5. For PITR (Pro plan): the **Point in Time Recovery** panel shows the continuous WAL archive status.

> Verify this at least weekly. Set a calendar reminder.

#### Triggering a manual snapshot (Pro plan)

In **Project Settings → Database → Backups**, click **Create backup** to create an on-demand snapshot before high-risk operations (migrations, bulk imports, schema changes).

---

### 2b. Manual pg_dump (supplemental / operator-initiated)

Use this procedure when:
- You need a backup outside the Supabase schedule window.
- You want an independent off-platform copy.
- You are migrating to a different hosting provider.

**Prerequisites:**
- `pg_dump` installed locally (`brew install postgresql@16` or `apt install postgresql-client-16`).
- `openssl` available (pre-installed on macOS and most Linux distros).
- `DIRECT_URL` from `.env` (port 5432 direct connection — **not** the pooler URL on port 6543).
- `STORAGE_ENCRYPTION_KEY` available (64 hex chars).

**Step 1 — Dump the database**

```bash
pg_dump \
  --format=custom \
  --no-password \
  "postgresql://USER:PASSWORD@HOST:5432/postgres" \
  --file=cok-backup-$(date +%Y%m%d-%H%M%S).dump
```

Replace the connection string with the value of `DIRECT_URL` from your `.env`.

**Step 2 — Encrypt the dump**

```bash
openssl enc -aes-256-cbc -pbkdf2 -iter 600000 \
  -in  cok-backup-YYYYMMDD-HHMMSS.dump \
  -out cok-backup-YYYYMMDD-HHMMSS.dump.enc \
  -pass env:STORAGE_ENCRYPTION_KEY
```

> This uses the same encryption key as the storage driver for key consolidation. Store the encrypted file securely (see §2c below).

**Step 3 — Upload to the backup prefix (S3 driver)**

```bash
aws s3 cp cok-backup-YYYYMMDD-HHMMSS.dump.enc \
  s3://YOUR_BUCKET/backups/db/cok-backup-YYYYMMDD-HHMMSS.dump.enc \
  --endpoint-url https://YOUR_S3_ENDPOINT
```

Or, for local driver: copy to an off-server location (external drive, separate cloud folder).

**Step 4 — Clean up local plaintext**

```bash
shred -u cok-backup-YYYYMMDD-HHMMSS.dump   # Linux
# On macOS: rm -P cok-backup-YYYYMMDD-HHMMSS.dump
```

---

### 2c. Backup retention targets

| Backup type | Frequency | Retention |
|---|---|---|
| Supabase daily snapshot | Nightly (automated) | 7 days (Pro) / 30 days (Team) |
| Manual pg_dump | As needed | Keep last 3; delete older than 30 days |

---

## 3. File Storage Backup

### 3a. Local driver (development / staging)

When `STORAGE_DRIVER=local`, files are written to `website/storage/` on the server filesystem, encrypted at rest.

**Backup procedure:**
1. Include the `storage/` directory in your nightly OS-level or server backup job.
2. The files are already AES-256-GCM encrypted — they are safe to back up to any destination without additional encryption.
3. Verify the backup includes the `storage/` directory with a periodic spot-check:

```bash
ls -lh website/storage/
```

**Important:** Back up `STORAGE_ENCRYPTION_KEY` separately (see §4). Without it, backed-up files cannot be decrypted.

### 3b. S3 driver (production)

When `STORAGE_DRIVER=s3`, files are stored in an S3-compatible bucket (Backblaze B2, Cloudflare R2, or AWS S3).

**Enable bucket versioning (required for production):**

AWS S3:
```bash
aws s3api put-bucket-versioning \
  --bucket YOUR_BUCKET \
  --versioning-configuration Status=Enabled
```

Backblaze B2:
- In the B2 console: Buckets → Your bucket → Enable versioning.

Cloudflare R2:
- R2 does not currently support versioning natively. Use lifecycle rules or a secondary bucket for backup copies.

**Cross-region replication (recommended, not required for Phase 1+):**

Replication protects against full-region outages. Configure via AWS console (Management → Replication rules) or Backblaze's bucket replication feature. Designate a secondary bucket in a different region as the replication target.

**Verifying storage backups:**
1. Log in to the S3 provider console.
2. Navigate to the bucket.
3. Confirm versioning is enabled (Version column visible on objects).
4. Spot-check: retrieve a recent file via the Supabase Data Directory or direct S3 CLI call.

---

## 4. Encryption Key Management

### The key

`STORAGE_ENCRYPTION_KEY` is a 64-character hex string (32 bytes) used for:
- AES-256-GCM encryption of every file in the local storage driver.
- HMAC-SHA256 signing of local serve tokens.

**Generate:**
```bash
openssl rand -hex 32
```

### Where the key lives

| Location | Who has access |
|---|---|
| Vercel project environment variables | Master Admin (Vercel owner) |
| Password manager (1Password / Bitwarden) | Master Admin + designated backup operator |
| Off-site secure note | Master Admin |

> **Critical:** If this key is lost, all files stored with the local driver are **permanently unrecoverable**. No reset is possible. Back it up in at least two independent locations before writing any files.

### Key rotation procedure

Rotate `STORAGE_ENCRYPTION_KEY` when:
- The key is compromised or suspected leaked.
- A staff member with key access leaves.
- Annual security review requires rotation.

**Steps:**

1. **Generate a new key:**
   ```bash
   openssl rand -hex 32
   # e.g. → a3f9...
   ```

2. **Re-encrypt all local files** using a migration script (not yet implemented — prepare before rotating):
   ```bash
   # Pseudocode — implement as website/scripts/rotate-encryption-key.ts
   for each file in storage/:
     bytes = decryptAESGCM(file, OLD_KEY)
     write encryptAESGCM(bytes, NEW_KEY) back to file
   ```

3. **Update Vercel env var:** In Vercel → Project → Settings → Environment Variables, update `STORAGE_ENCRYPTION_KEY` to the new value.

4. **Restart all instances:** Trigger a new Vercel deployment to pick up the new env var.

5. **Invalidate outstanding signed URLs:** Old HMAC tokens (derived from the old key) become invalid immediately on restart. This is expected behaviour.

6. **Update the password manager** with the new key.

> For the S3 driver, the key is only used for the local driver. S3 uses SSE-S3 (managed by the S3 provider) — rotation follows the S3 provider's SSE key rotation procedure.

---

## 5. Restore Procedure

### 5a. Database restore from Supabase PITR (Pro plan)

1. Log in to the Supabase dashboard.
2. Navigate to **Project Settings → Database → Backups → Point in Time Recovery**.
3. Select the target date and time.
4. Click **Start recovery** and confirm.
5. Supabase will restore to a new database endpoint. The project will be temporarily unavailable (~5–30 minutes depending on database size).
6. After restore completes, verify the connection is re-established (Supabase shows "Active" status).

### 5b. Database restore from Supabase daily snapshot

1. Log in to the Supabase dashboard.
2. Navigate to **Project Settings → Database → Backups**.
3. Select the snapshot to restore from the list.
4. Click **Restore** and confirm. The project will be briefly unavailable.
5. Verify restore success in the Backups panel.

### 5c. Database restore from manual pg_dump archive

Use this if Supabase backups are unavailable (e.g. account inaccessible, migrating to new provider).

**Step 1 — Decrypt the archive:**
```bash
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 \
  -in  cok-backup-YYYYMMDD-HHMMSS.dump.enc \
  -out cok-backup-YYYYMMDD-HHMMSS.dump \
  -pass env:STORAGE_ENCRYPTION_KEY
```

**Step 2 — Restore to target database:**
```bash
pg_restore \
  --format=custom \
  --no-password \
  --dbname="postgresql://USER:PASSWORD@HOST:5432/postgres" \
  --clean \
  --if-exists \
  cok-backup-YYYYMMDD-HHMMSS.dump
```

`--clean --if-exists` drops existing objects before recreating them. Use `--schema-only` or `--data-only` if you need a partial restore.

**Step 3 — Re-apply any migrations run after the backup:**
```bash
cd website
pnpm exec prisma migrate deploy
```

Verify with:
```bash
pnpm exec prisma migrate status
```

All migrations should show "Applied."

### 5d. File storage restore (local driver)

1. Stop the application to prevent writes during restore.
2. Replace the `storage/` directory with the backup copy.
3. Restart the application. New signed URLs will be valid immediately (token is derived from current key).

### 5e. File storage restore (S3 driver)

Use bucket versioning to recover accidentally deleted objects:
```bash
# List versions of a deleted object
aws s3api list-object-versions \
  --bucket YOUR_BUCKET \
  --prefix property/ENTITY_ID/photos/FILE_ID.jpg

# Restore by deleting the delete marker
aws s3api delete-object \
  --bucket YOUR_BUCKET \
  --key property/ENTITY_ID/photos/FILE_ID.jpg \
  --version-id DELETE_MARKER_VERSION_ID
```

### 5f. Post-restore smoke test

After any database restore, verify the system is working before opening to users:

1. **Application starts:** Deploy to Vercel (or restart local server) and confirm the build succeeds.
2. **Sign in:** Log in as Master Admin via the demo shortcut or real credentials.
3. **Data check:** Navigate to `/admin/data-directory` and retrieve one user record. Confirm fields are present.
4. **Balance check:** Navigate to `/admin/treasury` and verify the ledger balances are non-zero and consistent.
5. **Attachment check:** Open one attachment via the Data Directory. Confirm the signed URL resolves and the file renders.
6. **Audit log:** Navigate to `/admin/audit-log` and confirm recent entries are present up to the RPO boundary.

Document the smoke-test outcome in the Drill Log (§6).

---

## 6. Drill Log

A restore drill must be performed at least once before production launch and once per year thereafter.

| # | Date | Performed by | Backup source | Restore target | Duration | Result | Notes |
|---|---|---|---|---|---|---|---|
| 1 | PENDING | Project owner | Supabase daily snapshot | Scratch/staging environment | — | PENDING | Drill procedure documented 2026-04-29. Execute against live Supabase project before production launch. Follow §5b + §5f. |

### How to record a completed drill

After completing a drill, add a row to this table with:
- **Date** — YYYY-MM-DD of the drill.
- **Performed by** — Name of the operator.
- **Backup source** — "Supabase PITR", "Supabase daily snapshot YYYY-MM-DD", or "pg_dump archive YYYY-MM-DD".
- **Restore target** — "staging-db" or "scratch Supabase project".
- **Duration** — Wall-clock time from start of restore to smoke-test pass.
- **Result** — Pass / Fail.
- **Notes** — Any deviations, errors encountered, or items to improve.

---

## 7. Quick Reference

| Task | Path |
|---|---|
| View Supabase backups | Supabase dashboard → Project Settings → Database → Backups |
| Create manual snapshot | Supabase dashboard → Backups → Create backup |
| Generate new encryption key | `openssl rand -hex 32` |
| Verify backup key | Vercel → Project → Environment Variables → `STORAGE_ENCRYPTION_KEY` |
| Run manual pg_dump | §2b above |
| Restore from snapshot | §5b above |
| Restore from pg_dump | §5c above |
| Post-restore smoke test | §5f above |
| Update drill log | §6 above |

---

## 8. Related Documents

- [`docs/data-protection.md`](data-protection.md) — Storage architecture, encryption, access controls, retention, incident response.
- [`docs/observability.md`](observability.md) — Sentry monitoring; alerts for runtime errors.
- [Supabase backup documentation](https://supabase.com/docs/guides/platform/backups) — Official Supabase reference.
