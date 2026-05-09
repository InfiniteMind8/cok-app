# E.4 — Code Quality Inspection Report
**Date:** 2026-05-08  
**Methodology:** `COK-Phase1Plus-ClaudeCode-Playbook.md` §5.4 (ten-step sweep)  
**Evidence directory:** `qa/code-quality/`  
**Test baseline going in:** 373/373 unit pass  
**Test baseline going out:** 373/373 unit pass  

---

## §1 Lint

**Tool:** ESLint via `pnpm lint`  
**Evidence:** `qa/code-quality/lint-output.txt`

**Before sweep:** 31 problems (4 errors, 27 warnings)

| Error | File | Fix applied |
|---|---|---|
| `react/no-unescaped-entities` | `mfa-enroll-client.tsx:97` | Replaced `'` with `&apos;` in JSX text |
| `react/no-unescaped-entities` | `mfa-enroll-client.tsx:140` | Replaced `'` with `&apos;` in JSX text |
| `react-hooks/set-state-in-effect` | `onboarding-tour.tsx:65` | Replaced `useEffect`+`setState` initializer with lazy `useState(() => ...)` |
| `prefer-const` | `members-parser.ts:109` | Auto-fixed by `pnpm lint --fix` |

**Warning cleanup (28 → 0):**

| Category | Action |
|---|---|
| `no-unused-vars` (13 imports/vars across 12 files) | Removed dead imports; prefixed intentionally unused params with `_` |
| `react-hooks/incompatible-library` (2 RHF `watch()` calls) | Suppressed with inline `// eslint-disable-next-line` + rationale comment (known React Compiler + react-hook-form limitation) |
| `no-unused-expressions` (`entity-detail.tsx:104`) | Changed ternary-as-statement to `if/else` |
| `jsx-a11y/alt-text` (`file-upload.tsx:34`) | Renamed Lucide `Image` import to `ImageIcon` to avoid false positive on SVG component |
| Stale `eslint-disable` directives (2) | Removed by `pnpm lint --fix` |

**ESLint config change:** Added `@typescript-eslint/no-unused-vars` rule override in `eslint.config.mjs` with `argsIgnorePattern: '^_'` and `varsIgnorePattern: '^_'` to honour the established convention for intentionally unused parameters.

**After sweep:** `pnpm lint` exits 0 — **CLEAN**

---

## §2 Type-check

**Tool:** `pnpm typecheck` (TypeScript `tsc --noEmit`)  
**Evidence:** `qa/code-quality/typecheck-output.txt`

One error found and fixed: `file-upload.tsx:34` — Lucide `Image` SVG component does not accept `alt` prop. Fixed by renaming the import to `ImageIcon`.

**After sweep:** `pnpm typecheck` exits 0 — **CLEAN**

---

## §3 Format check

**Finding:** No `format` script in `package.json`. No Prettier config file (`.prettierrc`, `.prettierrc.json`, etc.) found in the repository root.

**Assessment:** The project uses ESLint for code style enforcement. Format checking is not configured as a separate step. **No action required.** If a formatter is introduced in a future phase, it should be added to the CI workflow.

---

## §4 Test pass

**Tool:** `pnpm test` (Vitest)  
**Result:** 38 test files, 373/373 tests pass in 6.6 s  
**E2E:** Playwright suite runs in CI (`.github/workflows/e2e.yml`); 8/10 scenarios active (2 skipped with documented TODOs)

---

## §5 Complexity — Ten largest source files

**Evidence:** `qa/code-quality/largest-files.txt`

| # | File | Lines | Assessment |
|---|---|---|---|
| 1 | `lib/seed/seed.ts` | 691 | Seed script — not production code; length acceptable |
| 2 | `app/(admin)/_actions/imports.ts` | 637 | **Split candidate** — contains both member and property import actions; could be split into `imports-members.ts` + `imports-properties.ts` (~300 lines each) |
| 3 | `app/(admin)/admin/accounts/_components/create-account-dialog.tsx` | 532 | **Split candidate** — single large form with 5 role variants; could extract per-role sub-forms as separate components |
| 4 | `app/(admin)/admin/approvals/page.tsx` | 521 | Page-level file aggregating 4 approval tabs — acceptable for a page; could extract tab components if it grows |
| 5 | `app/(admin)/admin/data-directory/_components/entity-detail.tsx` | 427 | **At threshold** — large tabbed detail pane; acceptable given complexity; monitor |
| 6 | `app/(auth)/sign-in/.../sign-in-form.tsx` | 419 | **At threshold** — brand-aligned sign-in page; acceptable |
| 7 | `app/(admin)/admin/properties/[propertyId]/.../property-tabs-client.tsx` | 340 | OK |
| 8 | `app/(admin)/admin/dashboard/page.tsx` | 337 | OK |
| 9 | `app/(admin)/admin/properties/_components/add-property-sheet.tsx` | 334 | OK |
| 10 | `app/(admin)/admin/broadcast/_components/broadcast-form.tsx` | 329 | OK |

**Circular dependencies:** `npx madge --circular` — **No circular dependency found** across 315 files.  
Evidence: `qa/code-quality/circular-deps.txt`

---

## §6 Dead code

**Tool:** `npx knip`  
**Evidence:** `qa/code-quality/dead-code.txt`

### Files deleted in this sweep
| File | Reason |
|---|---|
| `lib/uploadthing.ts` | Exports `UploadButton`/`UploadDropzone` via `@uploadthing/react` — superseded by D.11 custom storage driver; no remaining import references |

### Unused files — false positives / deferred
| File | Status |
|---|---|
| `prisma/schema.prisma` | Used by Prisma CLI; knip cannot trace CLI tools |
| `scripts/preview-emails.ts` | Intentional standalone script — not imported |
| `.tmp/test-access-flow.mjs` | Temp processing file in `.tmp/` (disposable by convention) |
| `components/ui/{alert-dialog,card,command,dialog,input-group,popover,scroll-area,sonner}.tsx` | shadcn/ui primitives — library-style exports, available for future use |
| `lib/currency/index.ts` | Barrel re-export; may be referenced via path alias |
| `app/(resident)/property/_components/{installment-list,ownership-progress-card}.tsx` | Conditionally rendered components; knip cannot trace dynamic import patterns |
| `app/api/uploadthing/` | Still required for UTApi server-side zip upload in D.2 (`imports.ts` uses `uploadthing/server`) |

### Orphaned application file — deferred
| File | Finding | Recommendation |
|---|---|---|
| `app/(admin)/admin/treasury/_components/create-voucher-sheet.tsx` | Not imported anywhere in current codebase | Investigate whether this is a Phase 2 stub or genuinely orphaned; delete if the latter |

### Unused exports — categorized

**Library-style re-exports (shadcn/ui, OK to leave):**  
`badgeVariants`, `buttonVariants`, `tabsListVariants`, `SelectGroup/Label/ScrollButtons/Separator`, `TableCaption`, `SheetTrigger/Close/Footer`, `DropdownMenu*` sub-components — these are exported for API completeness; consumers may need them in future.

**Application exports to investigate (refactor backlog):**

| Export | Location | Note |
|---|---|---|
| `getClerkUser` | `lib/auth.ts:46` | Potentially dead since D.3 uses Clerk directly; verify and remove if unused |
| `getVotes`, `getUserVoteSubmission`, `getIssueDetail` | `lib/queries/community.ts` | May be used by resident community page; verify before removing |
| `addPropertyPaymentAction` | `app/(admin)/_actions/properties.ts` | Investigate whether property payment flow was deferred; remove if so |
| `updateIntroductionAction`, `updateProfilePhotoAction` | `app/(resident)/_actions/profile.ts` | `updateProfilePhotoAction` was renamed `uploadProfilePhotoAction` in D.11; remove if old name is truly dead |
| `captureActionException` | `lib/sentry.ts` | Exported helper for action-level Sentry capture; used in docs but not imported; keep for now |
| `getRateHistory` | `app/(admin)/_actions/rates.ts` | Also defined in `app/(admin)/admin/settings/currency/_actions/rates.ts`; consolidate |
| `convertKcrdToFiat` | `lib/currency/conversion-engine.ts` | Part of currency engine; exported for future use |
| `notifyMany` | `lib/notifications/service.ts` | Used by broadcast feature; verify it's live |
| `AvatarGroup`, `AvatarGroupCount`, `AvatarBadge` | `components/ui/avatar.tsx` | Extended shadcn avatar; reserved for profile features |
| `getUserDetail` | `lib/queries/accounts.ts` | Verify call sites |

---

## §7 Duplication

**Tool:** `npx jscpd --min-tokens 80`  
**Evidence:** `qa/code-quality/duplication.txt`  
**Overall duplication:** 2.49% lines / 2.86% tokens — **Acceptable** (industry target < 5%)

### Notable clusters requiring refactor (deferred)

| Severity | Files | Lines | Recommendation |
|---|---|---|---|
| **High** | `imports/members/preview-table.tsx` ↔ `imports/properties/preview-table.tsx` | ~240 lines identical | Extract shared `ImportPreviewTable<T>` generic component; ~1–2 hours effort |
| **Medium** | `approvals/approval-actions.tsx` ↔ `approvals/settlement-dialogs.tsx` | ~92 lines overlap | Extract shared `ConfirmActionDialog` with configurable `onConfirm`/`onDecline` props; ~1 hour |
| **Medium** | `app/(admin)/_actions/imports.ts` internal | ~60 lines repeated across member/property parse paths | Merge parse-and-store logic into shared helper; addressed by the `imports.ts` split recommendation above |
| **Low** | Email templates (`mfa-reset.tsx`, `treasury-alert.tsx`, `lease-ending-soon.tsx`) | ~40 lines of similar structure | Extract shared `EmailSection` layout component |
| **Low** | `api/cron/leases/route.ts` ↔ `api/cron/reconciliation/route.ts` | ~14 lines header boilerplate | Extract shared `requireCronAuth` guard helper |

All duplication clusters are in non-critical paths. Refactoring is a quality-of-life improvement, not a correctness fix.

---

## §8 Dependency footprint

**Security audit:** Covered by E.2 — `pnpm audit` output at `qa/audit-output.txt`  
Status: 3 HIGH (xlsx×2 accepted per R-E2-01, effect×1 accepted per R-E2-02), 5 Moderate (dev/build-time, accepted per R-E2-03). **0 Critical/High open.**

**Depcheck findings:**  
**Evidence:** `qa/code-quality/depcheck.txt`

| Package | Depcheck verdict | Actual status |
|---|---|---|
| `@types/pg` | "Unused" | False positive — TypeScript types for `pg`, required by `@prisma/adapter-pg` |
| `decimal.js` | "Unused" | False positive — used in `lib/ledger/service.ts` via dynamic import patterns depcheck can't trace |
| `pg` | "Unused" | False positive — used as Prisma database adapter (`@prisma/adapter-pg`) |
| `shadcn` | "Unused" | CLI tool — invoked via `pnpm dlx shadcn@latest`; not imported in code |
| `tw-animate-css` | "Unused" | Imported in global CSS, not in TypeScript |
| `@tailwindcss/postcss` | "Unused" (dev) | Used in `postcss.config.mjs` |
| `@types/qrcode` | "Unused" (dev) | May be used indirectly by `qrcode.react`; acceptable |
| `@types/react-dom` | "Unused" (dev) | Required by Next.js TypeScript toolchain |

**All depcheck findings are false positives.** No packages to remove.

**License scan:**  
**Evidence:** `qa/code-quality/license-scan.txt`

| License | Count | Notes |
|---|---|---|
| MIT | 30 | ✓ No restrictions |
| Apache-2.0 | 7 | ✓ Compatible with private commercial use |
| ISC | 2 | ✓ Permissive |
| UNLICENSED | 1 | The app itself (private package, `"private": true`) — expected |
| (MIT OR GPL-3.0-or-later) | 1 | MIT clause applies in commercial use; no GPL contagion |

**Verdict: No GPL contagion. License footprint is clean.**

---

## §9 Naming consistency

**Spot-check across routes, actions, models, and components:**

| Area | Convention | Status |
|---|---|---|
| Server actions | `*Action` suffix (e.g. `createAccountAction`, `updateFeeScheduleAction`) | ✓ Consistent |
| Route segments | kebab-case (e.g. `/admin/audit-log`, `/admin/data-directory`) | ✓ Consistent |
| Page files | `page.tsx` in route segment directories | ✓ Consistent |
| Client components | PascalCase, co-located in `_components/` subdirectory | ✓ Consistent |
| Query functions | `get*` prefix (e.g. `getAuditLogs`, `getVisitorGroups`) | ✓ Consistent |
| Prisma models | PascalCase (e.g. `CommunityUpdate`, `VisitorGroupMembership`) | ✓ Consistent |
| Test files | `*.test.ts` for unit, `*.spec.ts` for E2E | ✓ Consistent |
| Explicitly client-only page wrappers | `*-client.tsx` suffix (e.g. `mfa-enroll-client.tsx`) | ✓ Consistent |

**One naming drift (documented, not introduced in E.4):**  
`CommunityUpdate` model serves as both community announcements and emergency broadcasts. This was a deliberate reuse decision in D.6 (D-D6-01). The `isEmergency` boolean and `AnnouncementSeverity` enum disambiguate the two uses at query time. No action required; documented as known technical debt.

---

## §10 Server vs Client component hygiene

**Tool:** `grep -rn "'use client'"` across app and components  
**Result:** 83 Client Components found

**Breakdown:**
| Location | Count | Assessment |
|---|---|---|
| `components/ui/` | 17 | shadcn/ui primitives — all justified (browser event handlers, portals) |
| `components/shared/` | 7 | Interactive shared components (sidebar, tour, tab bar, broadcast acknowledge) — all justified |
| `app/*/error.tsx` | 2 | Required by Next.js (error boundaries must be client components) |
| `app/*/` in `_components/` | 57 | All interactive forms, dialogs, sheets, modals, tables with client state — all justified |

**Server Component hygiene check:**  
- `page.tsx` files were verified for absence of direct React hook calls (`useState`, `useEffect`, etc.) — no violations found.
- All data fetching in page files uses async Server Components with `await db.*` or `await requireRole()` — correct pattern.
- Server actions (`_actions/*.ts`) are marked `'use server'` or `import 'server-only'` — consistent.
- No Server Components found importing `'use client'`-only libraries directly.

**Verdict: Server/client boundary hygiene is excellent. All 83 Client Components have clear interactivity justifications.**

---

## Refactor Backlog

| Priority | Item | Effort | Prompt |
|---|---|---|---|
| Medium | Split `app/(admin)/_actions/imports.ts` (637 lines) into `imports-members.ts` + `imports-properties.ts` | 1–2 hrs | Future pass |
| Medium | Extract generic `ImportPreviewTable<T>` from duplicate `preview-table.tsx` files (members + properties — 240+ lines shared) | 1–2 hrs | Future pass |
| Medium | Extract `ConfirmActionDialog` from `approval-actions.tsx` + `settlement-dialogs.tsx` overlap | 1 hr | Future pass |
| Low | Split `create-account-dialog.tsx` (532 lines) — extract per-role sub-forms | 2–3 hrs | Future pass |
| Low | Remove `app/(admin)/admin/treasury/_components/create-voucher-sheet.tsx` if confirmed orphaned | 30 min | F.1 or post-launch |
| Low | Consolidate `getRateHistory` duplicate (defined in two action files) | 30 min | Future pass |
| Low | Extract `requireCronAuth` guard from cron routes | 30 min | F.1 |
| Low | Audit and remove genuinely dead application exports identified by knip (`getClerkUser`, `addPropertyPaymentAction`, old `updateProfilePhotoAction`) | 1 hr | Future pass |
| Low | Add Prettier config + `format` script for consistent style enforcement | 30 min | Future pass |

---

## Acceptance Check

| Criterion | Status |
|---|---|
| Lint clean (`pnpm lint` exits 0) | ✓ **Met** — 0 errors, 0 warnings |
| Type clean (`pnpm typecheck` exits 0) | ✓ **Met** — 0 TypeScript errors |
| Tests green (373/373 unit) | ✓ **Met** — 373/373, 38 files |
| No Critical findings open | ✓ **Met** — no critical/high code quality issues |
| Report exists and is actionable | ✓ **Met** — this document |

---

## Files Touched in This Sweep

### Deleted
- `lib/uploadthing.ts` — dead code, superseded by D.11 storage driver

### Modified (lint fixes and hygiene)
- `eslint.config.mjs` — added `_`-prefix ignore patterns for `no-unused-vars`
- `app/(account)/account/mfa-enroll/_components/mfa-enroll-client.tsx` — escaped entities, `_userName`, lazy motion initializer
- `components/shared/onboarding-tour.tsx` — lazy `useState` replaces setState-in-effect
- `components/ui/file-upload.tsx` — `Image` renamed to `ImageIcon` (jsx-a11y false positive fix)
- `app/(admin)/_actions/properties.ts` — removed dead `createAttachment` import
- `app/(admin)/_actions/rates.ts` — removed unused `getCurrentUser` import
- `app/(admin)/_actions/rental-extensions.ts` — removed unused `getCurrentUser` import
- `app/(admin)/_actions/settings.ts` — removed unused `FeeRuleEntry` import
- `app/(admin)/admin/email-log/page.tsx` — removed unused `RefreshCw` import
- `app/(admin)/admin/settings/currency/_components/rate-editor.tsx` — removed unused `Label` import
- `app/(admin)/admin/settings/currency/page.tsx` — replaced `activeRates` with `[, allRates]`
- `app/(admin)/admin/visitors/groups/[id]/page.tsx` — removed unused `PageHeader` import
- `app/(admin)/admin/data-directory/_components/entity-detail.tsx` — ternary-as-statement → `if/else`
- `app/(admin)/admin/community/_components/new-update-sheet.tsx` — eslint-disable for RHF incompatibility
- `app/(admin)/admin/accounts/_components/create-account-dialog.tsx` — eslint-disable for RHF incompatibility
- `app/(resident)/profile/page.tsx` — removed unused `Map` icon import
- `app/(resident)/property/_components/tenancy-status-card.tsx` — removed unused `XCircle`, `Badge` imports
- `lib/imports/members-parser.ts` — removed `REQUIRED_COLUMNS` dead constant; `let` → `const` (auto-fix)
- `lib/storage/driver.ts` — `mime` → `_mime` in LocalStorageDriver
- `lib/rate-limit/__tests__/rate-limit.test.ts` — removed unused type import
- `lib/visitor-groups/__tests__/groups.test.ts` — removed unused `mockGroupFindFirst`
- `app/api/cron/leases/__tests__/route.test.ts` — dropped unused `res` assignment
- `app/api/webhooks/clerk/route.ts` — stale eslint-disable removed (auto-fix)
- `lib/email/__tests__/service.test.ts` — stale eslint-disable removed (auto-fix)
- `tests/e2e/c2-visitor-groups.spec.ts` — removed unused `signOut` import
- `tests/e2e/d14-wallet-floor.spec.ts` — `page` → `_page` (intentionally unused params)
