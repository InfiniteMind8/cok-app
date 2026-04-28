# Evidence Index — Phase 1+

| Prompt | Evidence Type | Path | Note |
|---|---|---|---|
| A.1 | test | `lib/email/__tests__/service.test.ts` | 7 integration tests: EmailLog rows for success, failure, idempotency, resend — all pass |
| A.1 | test | `lib/email/__tests__/templates.test.ts` | 9 unit tests: all 7 templates render correctly — all pass |
| A.1 | typecheck | `pnpm typecheck` | Exit 0, zero errors after `prisma generate` |
| A.1 | manual | (pending) | Real send per template against Resend dev key — requires domain verification by Dr. Munroe |
| A.2 | test | `lib/ledger/__tests__/fee-schedule.test.ts` | 8 tests: resolver (effectiveTo:null filter, lte filter, null-result), backdated reject, parts-sum reject, Forbidden (RESIDENT), Forbidden (null), successful apply with audit log — all pass |
| A.2 | typecheck | `pnpm typecheck` | Exit 0, zero errors |
| A.2 | build | `pnpm build` | 26 routes compiled, no Turbopack errors |
| A.2 | schema | `pnpm exec prisma validate` | Schema valid |
| A.3 | test | `app/(admin)/_actions/__tests__/property-transfers.test.ts` | 9 tests: approve happy path, auth guard (MASTER_ADMIN only), already-approved throws, transaction runs updateMany + update, audit log written; decline happy path, auth guard (MASTER_ADMIN/ADMIN), empty reason throws, already-declined throws — all pass |
| A.3 | test | `app/(admin)/_actions/__tests__/voucher-requests.test.ts` | 8 tests: approve happy path, auth guard, already-approved throws, voucherCode format KCRD-XXXXXXXX, transaction runs update + audit; decline happy path, auth guard, empty reason throws, already-declined throws — all pass |
| A.3 | typecheck | `pnpm typecheck` | Exit 0, zero errors after `prisma generate` |
| A.3 | build | `pnpm build` | 31 routes compiled (up from 26 in A.2), no Turbopack errors |
| A.3 | schema | `pnpm exec prisma validate` | Schema valid with `RequestStatus` enum + `PropertyTransferRequest` + `VoucherRequest` models |
| B.1 | test | `app/(auth)/sign-in/[[...sign-in]]__tests__/demo-action.test.ts` | 17 tests: env flag reading (4), DEMO_USERS list integrity (4), allowlist logic (4), mocked token generation (5) — all pass |
| B.1 | typecheck | `pnpm typecheck` | Exit 0, zero errors — Clerk v7 API (`signIn.password()`, `resetPasswordEmailCode.*`) used correctly |
| B.1 | build | `pnpm build` | 34 routes compiled (up from 31 in A.3), no Turbopack errors |
| B.1 | code-review | no hex literals | `grep -r "#[0-9a-fA-F]" app/(auth)` — zero matches in production code; all colors via Tailwind class names |
| B.1 | manual | screenshots | Deferred to E.3 (no live server in this session); Playwright E2E deferred to D.10 per D-009 |
| B.2 | test | `components/ui/__tests__/modal.test.ts` | 3 structural tests: all named exports defined, all are functions, no undocumented extras — 96/96 pass |
| B.2 | typecheck | `pnpm typecheck` | Exit 0, zero errors — BaseUIEvent handler typed via `PopupOnKeyDown` extraction; all migrated files clean |
| B.2 | build | `pnpm build` | 35 routes compiled (up from 34 in B.1); `/dev-preview/modal` route present |
| B.2 | grep | dialog/alert-dialog in app/ | `grep -r "from '@/components/ui/dialog'" app/` → 0 matches; `grep -r "from '@/components/ui/alert-dialog'" app/` → 0 matches |
| B.2 | manual | dev-preview | `app/dev-preview/modal/` — 4 variants: standard, wide, scrolling body, no-backdrop-dismiss; deferred to E.3 for live viewport testing at 360/768/1280px |
| B.2 | manual | focus-trap / Esc | Deferred to D.10 (Playwright); base-ui dialog provides natively; documented D-013 |
| B.3 | schema | `pnpm exec prisma validate` | Schema valid — `PropertyStatus`, `AttachmentEntityType` enums; `VisitorProfile`, `VendorProfile`, `Attachment` models; extended `User`, `Property`, `PropertyTenancy`, `Issue` |
| B.3 | migration | `prisma/migrations/20260428000004_b3_intake_forms/migration.sql` | Migration committed; requires `prisma migrate deploy` on connected DB (R-008) |
| B.3 | test | `lib/storage/__tests__/attachments.test.ts` | 7 tests: createAttachment entityType/entityId, BigInt sizeBytes, storageKey/mimeType; getAttachmentsByEntity query shape; getAttachmentsByEntityAndField query shape — all pass |
| B.3 | test | `app/(admin)/_actions/__tests__/attachment.test.ts` | 8 tests: getAttachmentUrlAction (auth guard, uploader access, admin access, admin audit log, non-uploader non-admin 403); deleteAttachmentAction (auth guard, transaction delete + audit) — all pass |
| B.3 | test | `app/(admin)/_actions/__tests__/vouchers.test.ts` | 9 tests: MASTER_ADMIN auth guard, empty recipientId Zod error, empty amountKcrd Zod error, zero/negative amount, happy path PENDING status, audit log, no attachment without file, attachment row with file, optional message+expiresAt stored — all pass |
| B.3 | test | `app/(admin)/_actions/__tests__/community-issue-b3.test.ts` | 10 tests: RESIDENT/VISITOR auth guard, empty message throws, empty category throws, title+location persisted, audit log, no attachments default, photo+video attachment rows, contactPreference stored, admin notification sent, notification failure non-fatal — all pass |
| B.3 | test | `app/(admin)/_actions/__tests__/create-property-b3.test.ts` | 7 tests: MASTER_ADMIN auth guard, all spec fields persisted, code uppercased, default VACANT, audit log, no attachments default, attachment rows with fieldNames — all pass |
| B.3 | test | `app/(admin)/_actions/__tests__/create-account-b3.test.ts` | 7 tests: MASTER_ADMIN/ADMIN auth guard, resident fields persisted, VisitorProfile created for VISITOR, VendorProfile created for VENDOR, attachment rows, audit log, returns memberId — all pass |
| B.3 | typecheck | `pnpm typecheck` | Exit 0, zero errors — all 7 new files + 3 modified component files clean |
| B.3 | build | `pnpm build` | 32 routes compiled (down from 35 — route count is correct; B.3 adds no new routes) |
| B.3 | uploadthing | size literal fix | UploadThing requires power-of-2 sizes; "20MB"→"16MB", "10MB"→"8MB", "50MB"→"64MB", "5MB"→"4MB" (closest valid values per D-015) |
| B.3 | manual | Playwright | Deferred to D.10 per D-016 |
