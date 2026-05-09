# Phase 1+ Evidence Index

| Prompt | Evidence Type | Path / Note | Short Note |
|---|---|---|---|
| A.1 | code | `website/lib/email/service.ts` | sendEmail function with Zod validation, Resend client, EmailLog persistence |
| A.1 | code | `website/lib/email/templates/` | 8 react-email templates |
| A.1 | code | `website/app/(admin)/admin/email-log/` | Email log viewer with resend capability |
| A.1 | test | `website/lib/email/__tests__/service.test.ts` | Service tests (mock Resend) |
| A.1 | test | `website/lib/email/__tests__/templates.test.ts` | Template render tests |
| A.2 | code | `website/app/(admin)/admin/settings/_components/fee-schedule-editor.tsx` | Fee schedule editor UI with history |
| A.2 | code | `website/app/(admin)/_actions/settings.ts` | `updateFeeScheduleAction` |
| A.2 | test | `website/lib/ledger/__tests__/fee-schedule.test.ts` | Fee schedule resolver tests |
| A.3 | code | `website/app/(admin)/admin/approvals/_components/transfer-dialogs.tsx` | Property transfer approve/decline |
| A.3 | code | `website/app/(admin)/admin/approvals/_components/voucher-request-dialogs.tsx` | Voucher approve/decline |
| B.1 | code | `website/app/(auth)/sign-in/[[...sign-in]]/_components/sign-in-form.tsx` | Brand-aligned sign-in form |
| B.1 | code | `website/app/(auth)/sign-in/[[...sign-in]]/_components/demo-block.tsx` | Demo block behind DEMO_MODE_ENABLED |
| B.2 | code | `website/components/ui/modal.tsx` | Modal primitive enforcing §4.4 |
| B.2 | test | `website/components/ui/__tests__/modal.test.ts` | Structural exports test |
| B.3 | code | `website/lib/storage/attachments.ts` | Attachment creation + retrieval |
| B.3 | code | `website/app/(admin)/_actions/` | 6 server actions with Attachment support |
| B.3 | test | `website/lib/storage/__tests__/attachments.test.ts` | Storage layer tests |
| A.1–B.3 | test | `pnpm test` 141/141 | Baseline test suite green after B.3 commit `fd1db6c` |
| C.1 | migration | `prisma/migrations/*_add_currency_models/` | ConversionRate, ConversionPromotion, DisplayCurrency enum, User.displayCurrency, User.foundingMember |
| C.1 | code | `website/lib/currency/rate-resolver.ts` | getActiveRate, getCurrentRates |
| C.1 | code | `website/lib/currency/promotion-resolver.ts` | getApplicablePromotion |
| C.1 | code | `website/lib/currency/format-amount.ts` | formatAmount pure helper |
| C.1 | code | `website/lib/currency/conversion-engine.ts` | convertFiatToKcrd, convertKcrdToFiat |
| C.1 | test | `pnpm test` 165/165 | 24 new tests: rate resolver (8), promotion resolver (7), conversion engine (5), format-amount (6) |
| C.1 | code | `website/app/(admin)/admin/settings/currency/page.tsx` | Rate editor page (live rate + history) |
| C.1 | code | `website/app/(admin)/admin/settings/promotions/page.tsx` | Promotions manager (active / scheduled / expired) |
| C.1 | code | `website/app/(admin)/admin/settings/page.tsx` | Settings hub with currency + promotions nav cards |
| C.1 | code | `website/components/admin/k-amount.tsx` | KAmount accepts displayCurrency + rates props |
| C.1 | code | `website/app/(resident)/profile/_components/display-currency-selector.tsx` | KCRD/USD/GYD selector |
| C.1 | code | `website/app/(resident)/_actions/profile.ts` | updateDisplayCurrencyAction |
| C.1 | code | `website/app/(resident)/wallet/page.tsx` | Fetches displayCurrency + rates, passes to stat cards |
| C.1 | commit | `2d6ec95` | feat(currency): C.1 multi-currency display, conversion rates, and bonus promotions |
| C.2 | code | `website/app/(admin)/admin/community/page.tsx` | C.2.1: extended SearchParams with `announce`/`groupId`; extracts `defaultGroupId`; passes to `NewUpdateSheet` — enables "Send announcement to this group" deep-link |
| C.2 | code | `website/app/(admin)/admin/community/_components/new-update-sheet.tsx` | Already-complete composer; accepts `defaultGroupId` prop; pre-selects VISITOR_GROUP audience + group when deep-linked |
| C.2 | code | `website/app/(admin)/admin/visitors/groups/` | List + detail pages + `CreateGroupDialog`, `EditGroupDialog`, `MemberManager`, `ArchiveGroupButton` — all complete from D-block scaffolding |
| C.2 | code | `website/app/(admin)/_actions/visitor-groups.ts` | `createGroupAction`, `editGroupAction`, `archiveGroupAction`, `assignMemberAction`, `removeMemberAction` — all write audit logs |
| C.2 | code | `website/lib/queries/visitor-groups.ts` | `getVisitorGroups`, `getVisitorGroupById`, `getUserActiveGroups`, `getUserActiveGroupIds` |
| C.2 | code | `website/app/(resident)/community/page.tsx` | Visitors get VISITOR_TABS (updates/my-groups/notifications); `getUpdatesWithAcknowledgements` filters by `activeGroupIds`; votes not fetched for visitors |
| C.2 | code | `website/lib/auth.ts` | `denyIfVisitor()` — server-side guard; used in `castVoteAction` and wallet mutation actions |
| C.2 | test | `website/lib/visitor-groups/__tests__/groups.test.ts` | 11 unit tests for createGroupAction, archiveGroupAction, assignMemberAction, removeMemberAction (in 367 count) |
| C.2 | test | `website/tests/e2e/c2-visitor-groups.spec.ts` | 3 Playwright serial scenarios: (1) create group → assign Marcus → deep-link announce → verify member sees it; (2) visitor has My Groups tab, no Voting tab; (3) visitor files issue |
| C.2 | test | `pnpm test` 367/367 | Baseline maintained — no regressions from C.2.1 change |
| C.2 | commit | `a176007` | feat(visitors): C.2 visitor groups — wire announce-to-group UX, activate Playwright E2E |
| C.3 | code | `website/lib/lease/cycle.ts` | `addOneCycle`, `computeNextPaymentDue`, `computeLeaseStatus`, `isLeaseExpired` — all complete from D-block scaffolding |
| C.3 | code | `website/app/(resident)/property/_components/tenancy-status-card.tsx` | Displays lease status, cycle, nextPaymentDue, endDate; `ExtensionRequestModal` CTA when ACTIVE/ENDING_SOON |
| C.3 | code | `website/app/(resident)/property/_components/extension-request-modal.tsx` | Date + reason form; calls `requestExtensionAction` |
| C.3 | code | `website/app/(admin)/_actions/rental-extensions.ts` | `requestExtensionAction`, `approveExtensionAction`, `declineExtensionAction` — all with DB transaction + audit log + email |
| C.3 | code | `website/app/(admin)/admin/approvals/page.tsx` | Rental Extensions tab with `RentalExtensionApprovalActions` |
| C.3 | code | `website/app/api/cron/leases/route.ts` | Nightly cron: ACTIVE→ENDING_SOON→EXPIRED transitions, nextPaymentDue rollover, email on ENDING_SOON |
| C.3 | test | `website/lib/lease/__tests__/cycle.test.ts` | 19 unit tests covering all 4 functions (addOneCycle×4, computeNextPaymentDue×5, computeLeaseStatus×6, isLeaseExpired×4) |
| C.3 | test | `website/app/api/cron/leases/__tests__/route.test.ts` | 8 unit tests: auth guards, empty DB, nextPaymentDue rollover, ACTIVE→ENDING_SOON, email trigger, ENDING_SOON→EXPIRED, missing CRON_SECRET |
| C.3 | test | `website/tests/e2e/c3-rental-extensions.spec.ts` | 3 Playwright serial scenarios: request, approve, decline |
| C.3 | test | `website/tests/e2e/rental-extension.spec.ts` | D.10 test 7 implemented: full request→approve cycle, end date verification |
| C.3 | test | `website/tests/e2e/global-setup.ts` | Aaliyah RESIDENCE-B07 tenancy fixture: startDate, endDate=today+30, leaseStatus=ACTIVE |
| C.3 | test | `pnpm test` 373/373 | 6 new tests (4 isLeaseExpired + 2 cron) added; full suite green |
| C.3 | commit | `9e2cd3f` | feat(tenancy): C.3 rental cycle — cycle unit tests, cron tests, E2E specs activated |
| Block-C | checkpoint | `qa/block-C-checkpoint.md` | All C.1–C.3 ACs met; 373/373 unit; c2+c3 E2E specs + D.10 test 7 active; D-SEQUENCE-01 resolved |
| E.1 | report | `qa/function-test-report.md` | Full §5.1 coverage matrix: 0 Fail, 5 PENDING (live run); all flows code-reviewed or unit/E2E verified |
| E.1 | test | `pnpm test` 373/373 | E.1 unit baseline; all lease/cron/visitor/auth tests green |
| D.1 | migration | `prisma/migrations/20260429120000_add_import_models/` | ImportSession, ImportRecord models; ImportStatus, ImportRowStatus enums |
| D.1 | code | `website/lib/imports/members-parser.ts` | Pure SheetJS parse + per-row Zod validation; normalizeDate, normalizePhone helpers |
| D.1 | code | `website/app/(admin)/_actions/imports.ts` | parseAndStoreImportAction, commitImportAction, cancelImportAction |
| D.1 | code | `website/app/(admin)/admin/imports/members/page.tsx` | Upload page with instruction sidebar |
| D.1 | code | `website/app/(admin)/admin/imports/members/template/route.ts` | Template download GET route (members-template.xlsx with Read me sheet) |
| D.1 | code | `website/app/(admin)/admin/imports/members/[sessionId]/page.tsx` | Preview page (server) |
| D.1 | code | `website/app/(admin)/admin/imports/members/[sessionId]/_components/preview-table.tsx` | Preview table client component (filter pills, warning checkboxes, commit/cancel) |
| D.1 | test | `website/lib/imports/__tests__/members-parser.test.ts` | 23 unit tests: date formats, phone normalization, duplicate emails, error/warning/valid classification |
| D.1 | test | `website/tests/e2e/d1-member-import.spec.ts` | Playwright stubs (describe.skip, 2 scenarios for D.10 harness) |
| D.1 | test | `pnpm test` 241/250 | 23 new tests green; 9 skipped are Playwright stubs across C.2, C.3, D.1 |
| D.1 | commit | `b84c926` | feat(imports): D.1 bulk member import — upload, preview, commit flow |
| D.2 | migration | `prisma/migrations/20260429044638_add_import_session_metadata/` | Adds nullable metadata Json? column to ImportSession |
| D.2 | code | `website/lib/imports/properties-parser.ts` | Pure SheetJS parse + per-row Zod validation; normalizePositiveDecimal, normalizeNonNegativeInt, normalizeYearBuilt helpers |
| D.2 | code | `website/app/(admin)/_actions/imports.ts` | parseAndStorePropertyImportAction, commitPropertyImportAction, cancelPropertyImportAction + processCompanionZip |
| D.2 | code | `website/app/(admin)/admin/imports/properties/page.tsx` | Upload page with zip toggle |
| D.2 | code | `website/app/(admin)/admin/imports/properties/_components/upload-form.tsx` | Upload form with optional companion zip toggle |
| D.2 | code | `website/app/(admin)/admin/imports/properties/template/route.ts` | Template download route (14 columns + Read me sheet) |
| D.2 | code | `website/app/(admin)/admin/imports/properties/[sessionId]/page.tsx` | Preview page (server) |
| D.2 | code | `website/app/(admin)/admin/imports/properties/[sessionId]/_components/preview-table.tsx` | Preview table (property-specific columns) |
| D.2 | test | `website/lib/imports/__tests__/properties-parser.test.ts` | 21 unit tests: valid rows, required fields, enum validation, numeric coercion, duplicates |
| D.2 | test | `website/tests/e2e/d2-property-import.spec.ts` | Playwright stubs (describe.skip, 2 scenarios for D.10 harness) |
| D.2 | test | `pnpm test` 262/273 | 21 new tests green; 11 skipped are Playwright stubs across C.2, C.3, D.1, D.2 |
| D.2 | commit | `1a8ba8d` | feat(imports): D.2 bulk property import — upload, preview, commit flow |
| D.3 | code | `website/middleware.ts` | Clerk auth gate; protects all routes; exempts /account/mfa-enroll and webhook paths |
| D.3 | code | `website/lib/mfa/index.ts` | STAFF_ROLES constant, isStaffRole() pure fn, requireMfaEnrolled() server utility |
| D.3 | code | `website/app/(admin)/layout.tsx` | Calls requireMfaEnrolled(user) after requireRole(); redirects unenrolled staff |
| D.3 | code | `website/app/(account)/layout.tsx` | Account route group layout — any authenticated role, no MFA check |
| D.3 | code | `website/app/(account)/account/mfa-enroll/page.tsx` | Server wrapper; checks twoFactorEnabled; redirects if already enrolled |
| D.3 | code | `website/app/(account)/account/mfa-enroll/_components/mfa-enroll-client.tsx` | 3-phase client component: setup → QR/verify → backup codes with confirmation |
| D.3 | code | `website/app/(resident)/profile/page.tsx` | 2FA CTA in Settings section; shows "Enabled" badge when enrolled |
| D.3 | test | `website/lib/mfa/__tests__/index.test.ts` | 14 unit tests: STAFF_ROLES (2), isStaffRole (5), requireMfaEnrolled (7) |
| D.3 | test | `website/tests/e2e/d3-mfa.spec.ts` | Playwright stubs (describe.skip, 5 scenarios for D.10 harness) |
| D.3 | test | `pnpm test` 276/292 | 14 new tests green; 16 skipped are Playwright stubs across D.1–D.3 |
| D.3 | docs | `website/docs/mfa.md` | Enrollment flow, backup codes, recovery process, admin reset, Clerk dashboard setup |
| D.3 | commit | `802fe1f` | feat(mfa): D.3 MFA enforcement for staff roles |
| D.4 | code | `website/lib/audit/index.ts` | Shared createAuditEntry helper (typed wrapper around db.auditLog.create) |
| D.4 | code | `website/lib/queries/audit-log.ts` | getAuditLogs (paginated, filterable), getAuditLogsForExport (cursor-paginated), getEntityAuditLogs |
| D.4 | code | `website/lib/queries/data-directory.ts` | getDirectoryTree, getUserEntityDetail, getPropertyEntityDetail, getLeaseEntityDetail, getIssueEntityDetail |
| D.4 | code | `website/app/(admin)/admin/audit-log/page.tsx` | Audit log viewer: filters, pagination, CSV export link |
| D.4 | code | `website/app/(admin)/admin/audit-log/_components/audit-table.tsx` | Expandable audit rows with before/after toggle |
| D.4 | code | `website/app/(admin)/admin/audit-log/_components/json-diff-view.tsx` | Before (red) / after (green) JSON diff view |
| D.4 | code | `website/app/api/admin/audit-log/export/route.ts` | GET CSV export; writes AUDIT_LOG_EXPORT audit entry |
| D.4 | code | `website/app/(admin)/admin/data-directory/page.tsx` | Data directory page: left-rail tree + right-pane detail |
| D.4 | code | `website/app/(admin)/admin/data-directory/_components/entity-tree.tsx` | Collapsible tree (users/props/leases/issues) with local search |
| D.4 | code | `website/app/(admin)/admin/data-directory/_components/entity-detail.tsx` | Tabbed detail: Overview, Records, Attachments, Transactions, Audit; MFA reset + export buttons |
| D.4 | code | `website/app/(admin)/_actions/data-directory.ts` | resetUserMfaAction (MASTER_ADMIN only; Clerk disableUserMFA + audit + email) |
| D.4 | code | `website/app/api/admin/data-directory/export/[userId]/route.ts` | ZIP export: user.json + ledger.json + attachments/ + manifest.json; writes data_directory.export audit entry |
| D.4 | code | `website/lib/email/templates/mfa-reset.tsx` | mfa-reset email template; registered in service.ts TemplateMap |
| D.4 | docs | `website/docs/data-protection.md` | Data directory purpose, access controls, export rules, MFA reset process |
| D.4 | test | `website/lib/queries/__tests__/audit-log.test.ts` | 7 unit tests: empty filter, actorId, action contains, entity, date range, pagination, getEntityAuditLogs |
| D.4 | test | `website/tests/e2e/d4-audit-data-directory.spec.ts` | Playwright stubs (describe.skip, 5 scenarios for D.10 harness) |
| D.4 | test | `pnpm test` 283/304 | 7 new tests green; 21 skipped are Playwright stubs across D.1–D.4 |
| D.4 | commit | `ac0ce41` | feat(audit): D.4 audit log viewer, data directory, MFA reset, data-protection docs |
| D.5 | migration | `prisma/migrations/20260429100000_add_reconciliation_report/` | ReconciliationStatus enum (OK/WARNING/MISMATCH) + ReconciliationReport table with indexes |
| D.5 | code | `website/lib/ledger/reconciliation-report.ts` | runAndSaveReconciliation() — credit/debit aggregation, saves report, emails MASTER_ADMINs on MISMATCH; getActiveAlert() banner query |
| D.5 | code | `website/lib/ledger/types.ts` | ReconciliationReportDetails interface added |
| D.5 | code | `website/lib/email/templates/treasury-alert.tsx` | treasury-alert email template; registered in service.ts TemplateMap |
| D.5 | code | `website/app/api/cron/reconciliation/route.ts` | Nightly reconciliation cron (CRON_SECRET Bearer); returns status + reportId |
| D.5 | code | `website/app/(admin)/_actions/reconciliation.ts` | runNowAction (MASTER_ADMIN only), acknowledgeAlertAction (audited, revalidates path) |
| D.5 | code | `website/app/(admin)/admin/treasury/reconciliation/page.tsx` | Reconciliation list page: status pills, date filter, RunNowButton |
| D.5 | code | `website/app/(admin)/admin/treasury/reconciliation/[reportId]/page.tsx` | Report detail page: AcknowledgeButton on unacknowledged MISMATCH |
| D.5 | code | `website/components/admin/reconciliation-alert-banner.tsx` | Sticky MISMATCH banner in admin layout; async RSC querying unacknowledged reports |
| D.5 | code | `website/proxy.ts` | Added /account/mfa-enroll and /api/cron public routes; middleware.ts deleted (Next.js 16 dual-file conflict) |
| D.5 | code | `website/lib/env.ts` | Lazy Proxy replaces eager validateEnv(); prevents build-time env failures across all pages |
| D.5 | test | `website/lib/ledger/__tests__/reconciliation-report.test.ts` | 8 unit tests: balanced/imbalanced/empty ledger, MISMATCH email triggered, getActiveAlert (null/unacknowledged/acknowledged) |
| D.5 | test | `website/tests/e2e/d5-reconciliation.spec.ts` | Playwright stubs (describe.skip, 2 scenarios for D.10 harness) |
| D.5 | test | `pnpm test` 291/314 | 8 new tests green; 23 skipped are Playwright stubs across D.1–D.5 |
| D.5 | commit | `2750ec0` | feat(treasury): D.5 treasury reconciliation auto-alerts, cron, banner, admin pages |
| D.6 | migration | `website/prisma/migrations/20260429130000_add_broadcast_severity/` | AnnouncementSeverity enum (INFO/URGENT/CRITICAL); severity + isEmergency fields on CommunityUpdate; isEmergency index |
| D.6 | code | `website/lib/queries/broadcast.ts` | getActiveEmergencyBroadcasts (unacknowledged filter), getEmergencyBroadcastById, getRecentEmergencyBroadcasts |
| D.6 | code | `website/app/(admin)/_actions/broadcast.ts` | sendBroadcastAction (chunked 50/batch, audit log, AC1/AC3/AC4); acknowledgeEmergencyBroadcastAction (AC5) |
| D.6 | code | `website/app/(admin)/admin/broadcast/page.tsx` | Broadcast page: active user count, composer, 5-item history table |
| D.6 | code | `website/app/(admin)/admin/broadcast/_components/broadcast-form.tsx` | Client form: idle→confirming(BROADCAST gate)→sending→done/error; preview pane; channel checkboxes (AC2) |
| D.6 | code | `website/components/shared/emergency-broadcast-banner.tsx` | Async RSC: renders unacknowledged emergency banners with severity color (AC5) |
| D.6 | code | `website/components/shared/acknowledge-broadcast-button.tsx` | Client dismiss button using useTransition + router.refresh() |
| D.6 | code | `website/app/(admin)/layout.tsx` | EmergencyBroadcastBanner added above ReconciliationAlertBanner |
| D.6 | code | `website/app/(resident)/layout.tsx` | EmergencyBroadcastBanner added between header and main |
| D.6 | test | `website/lib/queries/__tests__/broadcast.test.ts` | 6 unit tests: empty result, unacknowledged broadcast, acknowledged exclusion, isEmergency filter, getById found/not-found |
| D.6 | test | `website/tests/e2e/d6-broadcast.spec.ts` | Playwright stubs (describe.skip, 3 scenarios for D.10 harness) |
| D.6 | test | `pnpm test` 297/323 | 6 new tests green; 26 skipped are Playwright stubs across D.1–D.6 |
| D.6 | build | `pnpm build` clean | /admin/broadcast registered as dynamic route; no TypeScript errors |
| D.6 | commit | `7c489b0` | feat(broadcast): D.6 emergency broadcast — composer, chunked email, in-app banner, acknowledge |
| D.7 | migration | `website/prisma/migrations/20260429140000_add_tour_fields/` | Adds onboardingTourCompletedAt + onboardingTourDismissedAt nullable DateTime to User |
| D.7 | code | `website/lib/tour/steps.ts` | getTourSteps(role) — 5 roles × 4-8 steps; TourStep type |
| D.7 | code | `website/lib/queries/tour.ts` | getTourStatus(userId) — shouldShow when both timestamps null |
| D.7 | code | `website/app/(admin)/_actions/tour.ts` | completeTourAction / dismissTourAction |
| D.7 | code | `website/components/shared/onboarding-tour.tsx` | In-house coachmark overlay: backdrop, spotlight ring, tooltip, keyboard nav, prefers-reduced-motion |
| D.7 | code | `website/components/shared/tour-provider.tsx` | TourProvider context: visible state, startTour(), onNext/onBack/onSkip wired to server actions |
| D.7 | code | `website/components/shared/tour-trigger-button.tsx` | "Show me around" button using useTour() context |
| D.7 | code | `website/components/shared/admin-sidebar.tsx` | data-tour-id on nav links + user footer; Audit Log nav item added; TourTriggerButton in footer |
| D.7 | code | `website/components/shared/resident-tab-bar.tsx` | data-tour-id on all 4 tab links |
| D.7 | code | `website/app/(admin)/layout.tsx` | getTourStatus + TourProvider wrapper |
| D.7 | code | `website/app/(resident)/layout.tsx` | getTourStatus concurrent with unreadCount + TourProvider wrapper |
| D.7 | code | `website/app/(resident)/profile/page.tsx` | TourTriggerButton in Settings section |
| D.7 | test | `website/lib/tour/__tests__/steps.test.ts` | 17 unit tests: step counts per role, required fields, no duplicate IDs, no exclamation marks, unknown role |
| D.7 | test | `website/tests/e2e/d7-tour.spec.ts` | Playwright stubs (describe.skip, 2 scenarios for D.10 harness) |
| D.7 | test | `pnpm test` 314/342 | 17 new tests green; 28 skipped are Playwright stubs across D.1–D.7 |
| D.7 | commit | `b8313cb` | feat(tour): D.7 onboarding tour — role-specific coachmarks, auto-show first login, replay trigger |
| D.8 | code | `website/sentry.client.config.ts` | Client SDK init — PII scrub beforeSend, tracesSampleRate 1.0/0.1, ignoreErrors list |
| D.8 | code | `website/sentry.server.config.ts` | Server SDK init — same PII scrub + server-side config |
| D.8 | code | `website/sentry.edge.config.ts` | Edge runtime SDK init — minimal config |
| D.8 | code | `website/instrumentation.ts` | Next.js register() + onRequestError hook; imports server/edge configs by runtime |
| D.8 | code | `website/lib/sentry.ts` | withSentryAction HOF + captureActionException utility |
| D.8 | code | `website/app/global-error.tsx` | Root-level client error boundary; captures to Sentry in useEffect |
| D.8 | code | `website/app/(admin)/error.tsx` | Admin segment error boundary with context tag |
| D.8 | code | `website/app/(resident)/error.tsx` | Resident segment error boundary with context tag |
| D.8 | code | `website/app/(admin)/_actions/accounts.ts` | Canonical withSentryAction pattern on createAccountAction |
| D.8 | code | `website/app/api/sentry-test/route.ts` | Intentional-throw test endpoint; MASTER_ADMIN auth required |
| D.8 | docs | `website/docs/observability.md` | Sentry DSN setup, alert rules, PII policy, withSentryAction usage guide |
| D.8 | config | `website/next.config.ts` | Wrapped with withSentryConfig; silent when SENTRY_AUTH_TOKEN absent |
| D.8 | config | `website/.env.example` | Added SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN, DEPLOY_ENV, SENTRY_AUTH_TOKEN vars |
| D.8 | test | `pnpm test` 314/342 | No regressions from D.8 changes; Sentry config is integration-tested via /api/sentry-test |
| D.8 | commit | `fdf8ad5` | feat(observability): D.8 Sentry monitoring — client/server init, PII scrub, error boundaries, sentry-test endpoint |
| D.9 | code | `website/lib/rate-limit/index.ts` | InMemoryRatelimit, createLimiter factory, checkRateLimit() — edge + Node.js compatible; no 'server-only' |
| D.9 | code | `website/proxy.ts` | IP rate limit (5/15 min) on /sign-in + /sign-up; (10/15 min) on /account/mfa-enroll; 429 + Retry-After header |
| D.9 | code | `website/app/(admin)/_actions/imports.ts` | bulk-import limit (3/hr/user) on parseAndStoreImportAction + parseAndStorePropertyImportAction; audit on denial |
| D.9 | code | `website/app/(admin)/_actions/broadcast.ts` | email-send limit (30/hr/user) on sendBroadcastAction; returns {ok:false, error} on denial; audit on denial |
| D.9 | code | `website/app/(admin)/_actions/accounts.ts` | mutation limit (60/min/user) on createAccountAction (canonical); audit on denial |
| D.9 | config | `website/.env.example` | Added UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN with production guidance |
| D.9 | test | `website/lib/rate-limit/__tests__/rate-limit.test.ts` | 12 unit tests: boundary (auth 5, bulk-import 3, mutation 60), identifier isolation, window reset, RateLimitError fields, Sentry warning, createLimiter factory |
| D.9 | test | `website/tests/e2e/d9-rate-limit.spec.ts` | Playwright stubs (describe.skip, 2 scenarios for D.10 harness) |
| D.9 | test | `pnpm test` 326/356 | 12 new tests green; 30 skipped are Playwright stubs across D.1–D.9 |
| D.9 | build | `pnpm build` clean | No TypeScript errors; proxy.ts middleware compiles correctly with rate-limit imports |
| D.10 | config | `website/playwright.config.ts` | Chromium-only, webServer, globalSetup, testIgnore for d*.spec.ts stubs, workers=1 |
| D.10 | code | `website/tests/e2e/global-setup.ts` | migrate deploy + seed + test fixtures (SettlementRequest, PropertyTransferRequest, VoucherRequest) + xlsx fixture |
| D.10 | code | `website/tests/e2e/helpers/auth.ts` | signInAs() helper using demo shortcut buttons |
| D.10 | test | `website/tests/e2e/auth-sign-in-each-role.spec.ts` | 6 demo roles; redirects away from /sign-in |
| D.10 | test | `website/tests/e2e/ledger-transfer.spec.ts` | test.skip — no resident transfer UI; gap documented |
| D.10 | test | `website/tests/e2e/voucher-redemption.spec.ts` | Admin approves seeded voucher request for Aaliyah |
| D.10 | test | `website/tests/e2e/settlement-approval.spec.ts` | Admin approves seeded settlement request for Devon |
| D.10 | test | `website/tests/e2e/property-transfer.spec.ts` | Admin approves seeded property transfer + audit log check |
| D.10 | test | `website/tests/e2e/voting.spec.ts` | Aaliyah votes on open proposal; Marcus cannot cast vote |
| D.10 | test | `website/tests/e2e/rental-extension.spec.ts` | test.skip — C.3 not started |
| D.10 | test | `website/tests/e2e/bulk-import-members.spec.ts` | Upload 5-row xlsx fixture → preview 5 rows → commit |
| D.10 | test | `website/tests/e2e/emergency-broadcast.spec.ts` | Send broadcast; verify email log; Devon acknowledges banner |
| D.10 | test | `website/tests/e2e/mfa-enrol.spec.ts` | TOTP enrollment flow; handles already-enrolled case gracefully |
| D.10 | test | `pnpm test` 326/326 | Vitest unit suite green; E2E excluded from Vitest (tests/e2e/ in exclude list) |
| D.10 | ci | `.github/workflows/e2e.yml` | Postgres 16 service + chromium + pnpm build + pnpm test:e2e on push to main |
| D.10 | docs | `website/docs/testing.md` | Test list, env setup, add-a-test guide, CI secrets |
| D.10 | config | `website/.env.test.example` | E2E required vars (DATABASE_URL, Clerk, DEMO_MODE_ENABLED) |
| D.10 | fixture | `website/tests/e2e/fixtures/members-5row.xlsx` | 5-row xlsx created by global-setup for bulk import test |
| D.11 | migration | `website/prisma/migrations/20260429150000_add_attachment_crypto/migration.sql` | Adds sha256 TEXT, category TEXT, encrypted BOOLEAN, iv BYTEA to Attachment |
| D.11 | code | `website/lib/storage/driver.ts` | StorageDriver interface; LocalStorageDriver (AES-256-GCM, HMAC tokens); S3StorageDriver (SSE-S3, pre-signed URLs ≤300s); getStorage() singleton factory; _resetStorageForTest |
| D.11 | code | `website/app/api/attachments/upload/route.ts` | POST multipart upload: auth, magic-bytes MIME check, getStorage().put(), returns {storageKey, sha256, encrypted, name, size, type} |
| D.11 | code | `website/app/api/attachments/serve/route.ts` | GET signed serve endpoint: HMAC verify, expiry check (410 Gone), LocalStorageDriver.decrypt(), stream Uint8Array |
| D.11 | code | `website/lib/storage/attachments.ts` | getAttachmentUrl(id): DB query → getStorage().getSignedUrl(storageKey, 300) |
| D.11 | code | `website/app/(admin)/_actions/attachment.ts` | getAttachmentUrlAction now returns signed URL via getAttachmentUrl(); deleteAttachmentAction unchanged |
| D.11 | code | `website/components/ui/file-upload.tsx` | UploadThing replaced with fetch-based custom upload; UploadEndpointConfig type; endpoint prop changed |
| D.11 | code | `website/app/(resident)/profile/_components/profile-photo-upload.tsx` | UploadButton replaced with fetch-based upload; calls uploadProfilePhotoAction after upload |
| D.11 | code | `website/app/(resident)/_actions/profile.ts` | uploadProfilePhotoAction: saves storageKey to User.profilePhotoUrl, returns {signedUrl} |
| D.11 | code | `website/app/(resident)/profile/page.tsx` | Conditional profile photo signing (new storageKey vs. legacy CDN URL) |
| D.11 | docs | `website/docs/data-protection.md` | Added Storage Architecture, Encryption at Rest/Transit, Signed URL access controls, Retention, Backup, Incident Response |
| D.11 | config | `website/.env.example` | Added STORAGE_DRIVER, STORAGE_ENCRYPTION_KEY, STORAGE_S3_BUCKET/REGION/ENDPOINT/ACCESS_KEY/SECRET_KEY |
| D.11 | test | `website/lib/storage/__tests__/driver.test.ts` | 22 unit tests: LocalStorageDriver (encrypted write, round-trip, tamper detection, head, signed URL, token verify/expire/tamper, delete), S3StorageDriver (put SSE-S3, sha256, head, signed URL, TTL clamp, delete), getStorage factory (local/s3/unset/missing env) |
| D.11 | test | `website/app/(admin)/_actions/__tests__/attachment.test.ts` | Updated: getStorage mocked, expects signed URL (not raw storageKey) |
| D.11 | test | `website/tests/e2e/d11-storage.spec.ts` | Playwright stubs (describe.skip, 3 TODO scenarios) |
| D.11 | test | `pnpm test` 347/347 | All passing; 21 new tests from driver.test.ts + 1 new in attachment.test.ts (assertion updated) |
| D.11 | build | `pnpm build` clean | /api/attachments/serve and /api/attachments/upload registered as dynamic routes; no TypeScript errors |
| D.11 | commit | `45d0934` | feat(storage): D.11 — file storage strategy with encrypted local/S3 drivers and signed URLs |
| D.12 | docs | `website/docs/backup-and-restore.md` | Full backup & restore runbook: Supabase native backup (PITR + daily), manual pg_dump procedure, storage backup (local dir + S3 versioning), encryption key management (rotation procedure, off-site storage requirement), step-by-step restore (PITR, snapshot, pg_dump, S3 versioning), post-restore smoke-test checklist, drill log |
| D.12 | docs | `website/docs/cron.md` | Added section cross-referencing backup-and-restore.md; documents that database backup is handled by Supabase natively (no cron endpoint required) |
| D.12 | decision | `qa/decision-log.md` D-D12-01 | Restore drill requires project owner / Supabase dashboard access; procedure documented in full; drill log entry marked PENDING |
| D.12 | decision | `qa/decision-log.md` D-D12-02 | No cron endpoint added — Supabase provides native automation per playbook condition |
| D.12 | test | `pnpm test` 347/347 | No regressions — all existing tests pass after docs-only changes |
| D.13 | migration | `website/prisma/migrations/20260429160000_d13_webhook_events/migration.sql` | Adds deactivatedAt/deactivationReason to User; creates WebhookEvent table |
| D.13 | code | `website/app/api/webhooks/clerk/route.ts` | Svix signature check, idempotency by svix-id, user.created/updated/deleted handlers, soft-delete on deletion |
| D.13 | test | `website/app/api/webhooks/clerk/__tests__/route.test.ts` | 7 unit tests: valid events, signature rejection, idempotency, user.deleted soft-delete |
| D.13 | test | `pnpm test` 354/354 | 7 new tests green; build clean |
| D.13 | commit | `53f3633` | feat(webhooks): D.13 Clerk webhook handler — idempotency, user.deleted soft-delete, signature fix |
| D.14 | migration | `website/prisma/migrations/20260429170000_d14_wallet_floor/migration.sql` | ALTER TABLE Wallet ADD COLUMN floor_kcrd DECIMAL(20,8) |
| D.14 | code | `website/lib/ledger/types.ts` | FloorBreachError class + SystemWalletFloor interface |
| D.14 | code | `website/lib/ledger/service.ts` | Floor check in transferCredits() — aborts with FloorBreachError if post-transfer balance < floor_kcrd |
| D.14 | code | `website/lib/queries/dashboard.ts` | getSystemWalletSummary: returns walletId, floor, headroom (SystemWalletSummaryRow) |
| D.14 | code | `website/app/(admin)/_actions/treasury.ts` | updateWalletFloorAction: MASTER_ADMIN only, validates non-negative, audit-logged |
| D.14 | code | `website/app/(admin)/admin/treasury/_components/wallet-floor-card.tsx` | Card with balance/floor/headroom stats, yellow/red banners, inline editor |
| D.14 | code | `website/app/(admin)/admin/treasury/page.tsx` | System wallet floor cards grid |
| D.14 | code | `website/app/(admin)/admin/settings/page.tsx` | System Wallet Floors nav card → /admin/treasury |
| D.14 | test | `website/lib/ledger/__tests__/service.test.ts` | 2 new: FloorBreachError thrown and txCreate not called; floor=null succeeds |
| D.14 | test | `website/app/(admin)/_actions/__tests__/treasury.test.ts` | 4 tests: audit entry written, negative floor rejected, null floor accepted, non-system wallet rejected |
| D.14 | test | `website/tests/e2e/d14-wallet-floor.spec.ts` | Playwright stubs (describe.skip, 2 scenarios) |
| D.14 | test | `pnpm test` 360/360 | 6 new tests green; pnpm build clean; TypeScript strict |
| D.14 | commit | `e42b030` | feat(treasury): D.14 system wallet floor protection & UI explanation |
| D.15 | code | `lib/email/templates/lease-ending-soon.tsx` | New template: gold100 accent badge, property code card, extension CTA |
| D.15 | code | `lib/email/templates/emergency-broadcast.tsx` | Updated: severity prop (INFO/URGENT/CRITICAL) with keyed background/border/label |
| D.15 | code | `lib/email/service.ts` | `lease-ending-soon` added to TemplateMap and renderTemplate switch |
| D.15 | code | `app/(admin)/_actions/broadcast.ts` | `severity` now passed to emergency-broadcast template data |
| D.15 | code | `app/api/cron/leases/route.ts` | Uses `lease-ending-soon` template (replaces `rental-extension-decision` hack) |
| D.15 | test | `lib/email/__tests__/templates.test.ts` | +7 tests: property-transfer-decision (×2), mfa-reset, treasury-alert, lease-ending-soon, emergency-broadcast CRITICAL/INFO variants |
| D.15 | test-total | `pnpm test --run` | 367/367 pass — 7 new tests above baseline of 360 |
| D.15 | build | `pnpm build` | Build clean; no TypeScript errors |
| D.15 | previews | `qa/screenshots/emails/` | 13 HTML preview files generated by `scripts/preview-emails.ts` (3 broadcast severity variants + 10 unique templates) |
| D.15 | commit | `be788f5` | feat(email): D.15 full email template suite — lease-ending-soon, severity-aware broadcast, complete tests, HTML previews |
| E.2 | report | `qa/security-test-report.md` | OWASP ASVS L1 checklist (V1–V14), 11 specific §5.2 verifications, 11 findings (1 Fixed High, 3 Accepted High, 5 Accepted Medium, 2 Low/Info); 0 Critical/High open |
| E.2 | tooling | `qa/audit-output.txt` | pnpm audit output: 8 vulnerabilities (3 High, 5 Moderate) — all classified in security report |
| E.2 | tooling | `qa/secrets-scan.txt` | Grep-based secret scan: 1 match (test-stub `whsec_test` in unit test file); no real credentials found |
| E.2 | tooling | `qa/headers-scan.txt` | curl -sI header scan (post-fix): 5 security headers confirmed on /, /sign-in, /api/attachments/upload |
| E.2 | code | `website/next.config.ts` | Added `headers()` function with HSTS + X-Content-Type-Options + X-Frame-Options + Referrer-Policy + Permissions-Policy (Fixed: E2-F-01) |
| E.2 | test | `pnpm test` 373/373 | No regressions from next.config.ts security header addition |
| E.2 | build | `pnpm build` clean | TypeScript strict; no errors after headers() addition |
| E.2 | decision | `qa/decision-log.md` D-E2-01 | CSP deferred to F.1 — requires Clerk/Sentry/storage domain enumeration; F.1 explicitly handles this |
| E.2 | risk | `qa/risk-register.md` R-E2-01/02/03/04 | xlsx HIGH (no npm patch), effect HIGH (transitive), dev moderate deps, CSP deferred |
| E.3 | report | `qa/ux-accessibility-report.md` | Full 12-step §5.3 methodology; 8 fixes; 6 accepted/open findings; WCAG 2.1 AA assessment across 5 pages |
| E.3 | axe scan | `qa/lighthouse/axe-sign-in.json` | Live axe scan of /sign-in: 0 violations post-fix (25 passes, 0 incomplete) |
| E.3 | axe evidence | `qa/lighthouse/axe-admin_dashboard.json` | Code-review axe evidence for /admin/dashboard |
| E.3 | axe evidence | `qa/lighthouse/axe-community.json` | Code-review axe evidence for /community |
| E.3 | axe evidence | `qa/lighthouse/axe-admin_approvals.json` | Code-review axe evidence for /admin/approvals |
| E.3 | axe evidence | `qa/lighthouse/axe-wallet.json` | Code-review axe evidence for /wallet |
| E.3 | fix | `website/app/layout.tsx` (FIX-01) | Removed `maximumScale: 1` + `userScalable: false` from viewport export — WCAG SC 1.4.4 compliance |
| E.3 | fix | `website/app/(auth)/sign-in/[[...sign-in]]/_components/sign-in-form.tsx` (FIX-02a) | ghostBtnCls: `text-karis-stone-500` → `text-karis-stone-700` (contrast: 3.25:1 → ~4.9:1) |
| E.3 | fix | `website/app/(auth)/sign-in/[[...sign-in]]/page.tsx` (FIX-02b) | "New to Karis?" link: `text-karis-stone-500` → `text-karis-stone-700` (same contrast fix) |
| E.3 | fix | `website/components/shared/admin-sidebar.tsx` (FIX-03) | Added `aria-label="Main navigation"` to `<aside>` |
| E.3 | fix | `website/components/shared/resident-tab-bar.tsx` (FIX-04) | Added `aria-label="Main navigation"` to `<nav>` |
| E.3 | fix | `website/components/shared/resident-tab-bar.tsx` (FIX-05) | Notification badge: added `aria-hidden="true"` to visual dot + sr-only unread count span |
| E.3 | fix | `website/app/(resident)/community/page.tsx` (FIX-06) | Tab nav: `aria-label="Community sections"` on `<nav>`; `aria-current="page"` on active tab `<a>` |
| E.3 | fix | `website/components/shared/emergency-broadcast-banner.tsx` (FIX-07) | `aria-hidden="true"` on decorative pulse dot |
| E.3 | fix | `website/components/shared/onboarding-tour.tsx` (FIX-08) | `aria-live="polite" aria-atomic="true"` on step counter span |
| E.3 | test | `website/tests/e2e/e3-axe-sweep.spec.ts` | Axe sweep spec for 5 pages; saves evidence to qa/lighthouse/; asserts 0 critical/serious violations |
| E.3 | test | `pnpm test` 373/373 | No regressions from 8 accessibility fixes across 7 files |
| E.3 | typecheck | `pnpm typecheck` clean | d14-wallet-floor.spec.ts pre-existing `describe.skip` → `test.describe.skip` fixed; e3-axe-sweep.spec.ts type cast widened |
| E.3 | decision | `qa/decision-log.md` D-E3-01 | axe-core/playwright used instead of Lighthouse CLI for authenticated pages (Clerk auth barrier) |
| E.3 | risk | `qa/risk-register.md` R-E3-01/02/03 | karis-stone-500 remaining contrast (medium), status-red borderline (low), iOS input zoom (low) |
| E.4 | report | `qa/code-quality-report.md` | Full §5.4 ten-step sweep; all acceptance criteria Met; 9-item refactor backlog |
| E.4 | tooling | `qa/code-quality/lint-output.txt` | Final lint output: EXIT:0, 0 problems (post-fix) |
| E.4 | tooling | `qa/code-quality/typecheck-output.txt` | tsc --noEmit output: EXIT:0, 0 errors |
| E.4 | tooling | `qa/code-quality/circular-deps.txt` | madge --circular: "No circular dependency found!" |
| E.4 | tooling | `qa/code-quality/largest-files.txt` | Top 20 files by line count; largest is 457 lines (acceptable) |
| E.4 | tooling | `qa/code-quality/dead-code.txt` | knip output; 1 genuine dead file deleted (lib/uploadthing.ts); 15 false positives documented |
| E.4 | tooling | `qa/code-quality/duplication.txt` | jscpd: 2.49% duplication (below 5% threshold); 39 clones documented |
| E.4 | tooling | `qa/code-quality/depcheck.txt` | depcheck: all flagged packages are false positives (config-file usage, peer deps) |
| E.4 | tooling | `qa/code-quality/license-scan.txt` | license-checker: MIT/Apache-2.0/ISC/BSD only; no GPL contagion |
| E.4 | fix | `website/eslint.config.mjs` | Added _-prefix ignore patterns for no-unused-vars (all 4 categories) |
| E.4 | fix | `website/app/(account)/account/mfa-enroll/_components/mfa-enroll-client.tsx` | Escape apostrophes in JSX text; rename _ → _userName |
| E.4 | fix | `website/components/shared/onboarding-tour.tsx` | Replace setState-in-effect with lazy useState initializer (React Compiler) |
| E.4 | fix | `website/components/ui/file-upload.tsx` | Rename Image → ImageIcon to resolve false jsx-a11y/alt-text lint positive |
| E.4 | fix | 18 website source files | Remove dead imports (unused variables, types, icon names) across actions, pages, tests, E2E specs |
| E.4 | fix | `website/lib/uploadthing.ts` (DELETED) | Dead file removed — UploadThing React component wrapper superseded by D.11 custom driver |
| E.4 | fix | `website/lib/imports/members-parser.ts` | Remove dead REQUIRED_COLUMNS constant; let→const auto-fix |
| E.4 | commit | `192cf7b` | chore(qa): E.4 code quality inspection — lint/type/test clean, report produced |
| E.4 | test | `pnpm test` 373/373 | No regressions from all E.4 remediations; full suite green |
| F.1 | code | `website/next.config.ts` | CSP added to `securityHeaders` (resolves R-E2-04); `cspDirectives` object with 14 directives; deprecated `disableLogger` removed from `withSentryConfig` |
| F.1 | code | `website/.env.example` | Added `NEXT_PUBLIC_APP_URL`, `IMPORT_MAX_ROWS`, `CRON_SECRET` (with one-line descriptions, grouped by domain); also bundles pre-existing PRE-3 `NEXT_PUBLIC_DEMO_SHOWCASE_ENABLED` line |
| F.1 | code | `website/app/dev-preview/modal/page.tsx` | `NEXT_PUBLIC_DEMO_MODE` typo → `NEXT_PUBLIC_DEMO_MODE_ENABLED` (aligns with `.env.example` and rest of codebase) |
| F.1 | code | `website/app/dev-preview/modal/_client.tsx` | Same typo correction in body copy |
| F.1 | docs | `website/docs/production-deploy.md` | Production deploy runbook: pre-deploy checklist (vault secrets, DNS, storage, DB, cron), deploy steps (Vercel + manual), post-deploy verification (curl, securityheaders.com, smoke flows, observability, backup), rollback (app, DB, secret rotation), pending owner actions table |
| F.1 | docs | `docs/phase1plus/prompts/F.1.md` | Protocol-required prompt file (per CLAUDE_EXECUTION_ROOT.md §1) |
| F.1 | build | `qa/f1-build.txt` | `pnpm build` output: ✓ Compiled successfully in 41s; ✓ TypeScript finished in 27.4s; 40/40 static pages; zero warnings post-`disableLogger` removal |
| F.1 | typecheck | `qa/f1-typecheck.txt` | `pnpm typecheck` exit 0; clean (initial baseline contamination from stale `.next/dev/types/validator.ts` cleared after build regenerated artifacts) |
| F.1 | test | `qa/f1-test.txt` | `pnpm test` 396/396 pass; 43 test files; same baseline as pre-F.1 — zero regressions introduced |
| F.1 | lint | `qa/f1-lint.txt` | `pnpm lint` exit 1 — 1 error + 1 warning, both in `app/access/callback/_components/access-callback-client.tsx` (untracked PRE-3 file). Same baseline as pre-F.1; F.1 introduced zero new lint failures. R-F1-01 captures the pre-existing regression |
| F.1 | header scan | `qa/headers-scan-f1.txt` | `curl -sI http://localhost:3000/` against running dev server; all 6 security headers present and correct: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, Content-Security-Policy (full enumeration of Clerk, Sentry, Upstash, storage hosts) |
| F.1 | decision | `qa/decision-log.md` D-F1-01/02/03 | CSP composition; Sentry `disableLogger` removal; F.1 commit scope vs. uncommitted PRE-3 work |
| F.1 | risk | `qa/risk-register.md` | R-E2-04 closed (CSP delivered); R-F1-01 (pre-existing PRE-3 lint regression), R-F1-02 (bundled `.env.example` PRE-3 line), R-F1-03 (smoke + securityheaders.com pending owner), R-F1-04 (tracker divergence) added |
| F.1 | pending | `website/docs/production-deploy.md` §5 | 9 owner-only acceptance items (DNS, Clerk prod, Upstash, storage, Supabase Pro, encryption key backup, smoke flows, securityheaders.com scan, wallet floors, restore drill) listed for project-owner sign-off before public launch |
| F.2 | code | `website/app/manifest.ts` | PWA manifest fixed: `start_url='/'`, `scope='/'`, `lang='en'`, `categories: ['lifestyle','finance','productivity']`, full icon set (192/256/384/512 + 512 maskable) |
| F.2 | code | `website/public/sw.js` | Hand-rolled service worker (no `next-pwa`/`@serwist`); cache-first static, network-first navigation with `/offline` fallback, stale-while-revalidate images; `VERSION = 'karis-v1'` for cache eviction |
| F.2 | code | `website/components/shared/sw-register.tsx` | Production-only SW registration client component |
| F.2 | code | `website/components/shared/install-prompt.tsx` | Chromium `beforeinstallprompt` install banner; sibling to existing `IOSInstallPrompt`; brand-styled |
| F.2 | code | `website/app/offline/page.tsx` | Brand offline fallback page (no auth, no DB); referenced by SW navigation fallback |
| F.2 | code | `website/app/layout.tsx` | Mounts `<InstallPrompt />` and `<SwRegister />` alongside the existing `<IOSInstallPrompt />` |
| F.2 | code | `website/app/privacy/page.tsx`, `website/app/terms/page.tsx` | Public legal routes; server components reading the markdown drafts |
| F.2 | code | `website/components/legal/legal-document.tsx`, `website/components/legal/render-markdown.tsx` | Hand-rolled markdown→JSX (h1-3, paragraphs, blockquote, tables, lists, bold/italic/code/link) — no new dep |
| F.2 | code | `website/proxy.ts` | Public-route matcher extended: `/privacy`, `/terms`, `/offline`, `/.well-known/(.*)` |
| F.2 | docs | `website/legal/privacy.md` | Privacy policy DRAFT (counsel review pending — banner at top); covers data categories, retention, sub-processors, rights |
| F.2 | docs | `website/legal/terms.md` | Terms of service DRAFT (counsel review pending — banner at top); covers eligibility, KCRD/Promotions Wallet, lease lifecycle, visitor groups |
| F.2 | docs | `website/docs/play-store.md` | Mobile submission runbook: Bubblewrap install + commands, key management section, Asset Links update, Play Console step-by-step (developer account → app → listing → content rating → data safety → target audience → AAB upload → tracks), pre-submission checklist, monitoring, rejection reasons |
| F.2 | docs | `website/docs/play-store-data-safety.md` | Pre-filled Data Safety form for transcription into Play Console; rows for personal info, financial info, photos, files, app activity, diagnostics |
| F.2 | docs | `website/docs/go-live.md` | **Master chronological runbook** — Phases A (account provisioning) → B (deploy) → C (web verification) → D (PWA verification) → E (counsel review) → F (mobile build) → G (Play Console) → H (stabilise → production) → I (post-launch monitoring). Single owner entry point; references existing setup docs. Includes master pre-go-live checklist |
| F.2 | docs | `docs/phase1plus/prompts/F.2.md` | Protocol-required prompt file (mirrors `F.1.md`) |
| F.2 | code | `website/scripts/generate-pwa-icons.ts` | sharp-based icon generator — 5 PWA PNGs + Play Console listing icon, 70% safe-area for maskable variant |
| F.2 | code | `website/scripts/generate-feature-graphic.ts` | sharp + SVG overlay → 1024×500 brand-green feature graphic with metallic logo + gold tagline |
| F.2 | code | `website/scripts/capture-play-store-screenshots.ts` | Playwright capture at 1080×1920 (Android Pixel 8 UA) — sign-in / privacy / terms / offline |
| F.2 | asset | `website/public/icons/icon-192.png` … `icon-512-maskable.png` | 5 PWA icons generated from `brand_assets/COK-Logo-Main-Metallic-NoGuyana-NoBKG.png` |
| F.2 | asset | `marketing/play-store/icon-512.png` | Play Console listing icon (512×512, on stone background) |
| F.2 | asset | `marketing/play-store/feature-graphic.png` | Play Console feature graphic (1024×500, brand-green base + gold tagline) |
| F.2 | asset | `marketing/play-store/screenshots/{sign-in,privacy,terms,offline}-1080x1920.png` | 4 brand-correct 1080×1920 screenshots — sign-in / privacy / terms / offline. Dashboard / treasury / announcement deferred to owner action (D-F2-04) |
| F.2 | asset | `marketing/play-store/listing-copy.md` | Drop-in Play Console listing copy: short description (verbatim playbook), full description ≤4000 chars, contact, category, content rating |
| F.2 | asset | `marketing/play-store/twa-manifest.json` | Bubblewrap TWA manifest template (`org.cityofkaris.app`, host placeholder for production URL) |
| F.2 | asset | `website/public/.well-known/assetlinks.json` | Digital Asset Links template — placeholder SHA-256, owner replaces post-`bubblewrap build` (R-F2-02) |
| F.2 | dep | `package.json` | New devDep: `sharp@^0.34.4`. Added to `pnpm.onlyBuiltDependencies`. New scripts: `pwa:icons`, `pwa:graphic`, `pwa:screenshots`. |
| F.2 | build | `qa/f2-build.txt` | `pnpm build` — zero warnings; 40 routes (incl. /privacy, /terms, /offline, /manifest.webmanifest as static prerendered) |
| F.2 | typecheck | `qa/f2-typecheck.txt` | `pnpm typecheck` exit 0 |
| F.2 | test | `qa/f2-test.txt` | `pnpm test` 396/396 — same baseline as F.1, zero regressions |
| F.2 | lint | `qa/f2-lint.txt` | `pnpm lint` — same baseline as `qa/f1-lint.txt` (1 error + 1 warning, both in untracked PRE-3 file `app/access/callback/_components/access-callback-client.tsx`); F.2 introduced zero new lint failures |
| F.2 | endpoint scan | `qa/f2-endpoint-scan.txt` | Live `curl -sI` against running production build — all 8 PWA endpoints (`/manifest.webmanifest`, `/sw.js`, `/.well-known/assetlinks.json`, `/privacy`, `/terms`, `/offline`, `/icons/icon-192.png`, `/icons/icon-512-maskable.png`) return 200 with all 6 security headers + CSP |
| F.2 | decision | `qa/decision-log.md` D-F2-01..04 | Service worker library choice (hand-rolled vs next-pwa/@serwist); legal route + markdown renderer (hand-rolled vs deps); Bubblewrap build deferred to owner; screenshots scope (4 public vs 7 total) |
| F.2 | risk | `qa/risk-register.md` | R-F2-01 (owner AAB build), R-F2-02 (assetlinks fingerprint placeholder), R-F2-03 (privacy/terms drafts pending counsel), R-F2-04 (sharp install — mitigated), R-F2-05 (SW cache versioning) added |
| F.2 | pending | `website/docs/play-store.md` §8 + `website/docs/go-live.md` Phase A–I | Owner-only items: Bubblewrap install + AAB build + device install (R-F2-01), Asset Links fingerprint update (R-F2-02), counsel review of legal drafts (R-F2-03), authenticated screenshots (D-F2-04 — script delta in `6502eb3`; capture step is owner-runnable per script header), Play Console developer account + submission, internal → closed → open → production track promotion |
| Closure | code | `website/scripts/capture-play-store-screenshots.ts` (commit `6502eb3`) | Closure session: extended with three authenticated shot definitions (dashboard / treasury / announcement) pinned to MASTER_ADMIN demo account; opt-in via `SCREENSHOT_INCLUDE_AUTHENTICATED=1`; owner runs against `pnpm dev` per the in-script docblock (D-F2-05) |
| Closure | code | `website/app/access/callback/_components/access-callback-client.tsx` (commit `ff23fa7`) | Closure session: PRE-3 `react-hooks/set-state-in-effect` regression resolved by deriving the missing-ticket error at render time. Lint exit 0 (was exit 1). R-F1-01 closed. |
| Closure | repo | `website/qa/` deletion (commit `04982a6`) | Closure session: stale website-tree tracker copies removed; root `COK-City-of-Karis/qa/` is canonical. R-F1-04 closed. |
| Closure | test | `qa/f3-{lint,typecheck,test,build}.txt` | Closure session validation: lint exit 0 (1 pre-existing imports.ts warning unchanged, 0 errors); typecheck exit 0; test 396/396; build zero-warning |
| Block-F | checkpoint | `qa/block-F-checkpoint.md` | F.1 + F.2 + closure Steps 1–4 acceptance status, test summary, regressions, remaining risks (Closed/Owner-action/Mitigated), Phase 1+ §9 closure-gate decision: Conditional Go for production deploy + Play Store submission gated on documented owner-action items. Mirrors `block-D-checkpoint.md` structure. |
| Final | audit | `qa/final-phase1plus-readiness.md` | §9 closure gate per `CLAUDE_EXECUTION_ROOT.md`. Walks every Appendix D checkbox with explicit evidence path. Three Go/No-Go verdicts: Phase 1+ implementation **Go**; Production deployment **Conditional Go** (gated on `go-live.md` Phase A → C + E.4/E.2 owner items); Play Store submission **Conditional Go** (gated on Phase F → G + counsel-approved legal text). Recommended next actions in priority order mapped 1:1 to `go-live.md` Phase A → I. |
| Final | runbook | `qa/deploy-coordination.md` | Owner companion plan to `go-live.md`, paced for the 1–2 week deploy window. Day-by-day grid (Day 1 Phase A+B → Day 2 Phase C+D → Day 3 Phase C tail + start E → Day 4 Phase F + auth screenshots → Day 5 Phase G → Day 6–7 wait on review + counsel → Week 2+ Phase H+I), per-phase prereqs + evidence-to-capture (`qa/launch/...` paths), hard-gate dependency graph, build-agent vs operational escalation list. |
