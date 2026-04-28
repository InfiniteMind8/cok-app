# Prompt B.3 — Intake Form Completion Across All Entries

**Status:** Done  
**Date executed:** 2026-04-28  
**Preceded by:** B.2 (Modal/popup edge pass)  
**Followed by:** C.1 (Multi-currency display)

---

## Scope

Ensure every "add"/"edit" form captures every field from the spec (`COK-CommunityApp-AccountFunctions-V1.pdf`) and supports all specified file uploads. This covers the full intake surface: Property, Resident, Visitor, Vendor, Voucher, Issue, and Lease forms.

## Acceptance Criteria Met

- [x] Every form contains every spec field with correct required/optional markers
- [x] Inline validation errors, loading states, success toasts, cancel-if-dirty confirmation per §4.6
- [x] File uploads work end-to-end: UploadThing → Attachment row → storageKey retrievable
- [x] All server actions: Zod validation, transaction, AuditLog, typed result
- [x] Non-authorized role → 403 from server action
- [x] `pnpm exec prisma validate` — schema valid
- [x] `pnpm typecheck` — zero errors
- [x] `pnpm test --run` — 141 tests pass (45 new)
- [x] `pnpm build` — 32 routes compiled, zero errors

## Files Touched

### Schema
- `prisma/schema.prisma` — added `PropertyStatus`, `AttachmentEntityType` enums; extended `Property`, `User`, `PropertyTenancy`, `Issue`; added `VisitorProfile`, `VendorProfile`, `Attachment` models
- `prisma/migrations/20260428000004_b3_intake_forms/migration.sql` — migration SQL (requires `prisma migrate deploy` on connected DB)

### Storage layer
- `app/api/uploadthing/core.ts` — added endpoints: `propertyDocuments`, `profileDocuments`, `issueMedia`, `vendorDocuments`, `leaseDocuments`, `voucherAttachments`
- `lib/storage/attachments.ts` — NEW: `createAttachment()`, `getAttachmentsByEntity()`, `getAttachmentsByEntityAndField()`
- `app/(admin)/_actions/attachment.ts` — NEW: `getAttachmentUrlAction()` (auth-gated URL return + admin audit log), `deleteAttachmentAction()` (transaction + audit log)

### UI component
- `components/ui/file-upload.tsx` — NEW: `FileUpload` wrapper on `UploadDropzone` with file list, type icons, remove, error display

### Forms
- `app/(admin)/admin/properties/_components/add-property-sheet.tsx` — full rewrite: 6 sections + 4 file upload zones
- `app/(admin)/admin/accounts/_components/create-account-dialog.tsx` — role-aware expansion: Resident/Visitor/Vendor sections with file uploads
- `app/(admin)/admin/properties/[propertyId]/_components/property-tabs-client.tsx` — expanded AssignTenantDialog with dates, deposit, lease PDF upload
- `app/(resident)/community/_components/raise-issue-fab.tsx` — added title, location, contactPreference, photo/video upload
- `app/(admin)/admin/treasury/_components/create-voucher-sheet.tsx` — NEW: full voucher creation form

### Server Actions
- `app/(admin)/_actions/properties.ts` — extended `createPropertyAction` + `assignTenantAction` with B.3 fields + Attachment creation
- `app/(admin)/_actions/accounts.ts` — extended `createAccountAction` with role-specific profile data + Attachment rows
- `app/(resident)/_actions/community.ts` — extended `raiseIssueAction` with title, location, contactPreference, Attachment rows
- `app/(admin)/_actions/vouchers.ts` — NEW: `createVoucherAction`

### Tests (45 new)
- `lib/storage/__tests__/attachments.test.ts`
- `app/(admin)/_actions/__tests__/attachment.test.ts`
- `app/(admin)/_actions/__tests__/create-property-b3.test.ts`
- `app/(admin)/_actions/__tests__/create-account-b3.test.ts`
- `app/(admin)/_actions/__tests__/vouchers.test.ts`
- `app/(admin)/_actions/__tests__/community-issue-b3.test.ts`

## Key Decisions

| ID | Summary |
|---|---|
| D-015 | UploadThing CDN URLs used as `storageKey`; full §3.4 signed-URL compliance deferred to D.11 |
| D-016 | Playwright form tests deferred to D.10 per precedent D-006/D-009/D-013 |
| D-017 | `VisitorProfile` + `VendorProfile` as separate tables (not JSON blob) — required for D.1 column-mapped import |

## Key Risks

| ID | Summary |
|---|---|
| R-008 | Migration `20260428000004_b3_intake_forms` requires `prisma migrate deploy` on connected DB |
| R-009 | UploadThing CDN URLs are long-lived (not signed); admin URL access logged in AuditLog |
