# Block C Checkpoint

**Date:** 2026-05-08
**Session:** Phase 1+ C.2 → C.3 execution (resumes after D-SEQUENCE-01 deferral)

---

## Completed Prompts

| Prompt | Title | Commit | Status |
|---|---|---|---|
| C.1 | Multi-currency display & conversion | `2d6ec95` | Done (prior session 2026-04-28) |
| C.2 | Visitor Groups system | `a176007` | Done (this session 2026-05-08) |
| C.3 | Rental cycle + extension request | `9e2cd3f` | Done (this session 2026-05-08) |

---

## Acceptance Criteria Status

### C.1 — Multi-currency

| AC | Description | Status |
|---|---|---|
| C1-AC1 | ConversionRate CRUD with history | Met |
| C1-AC2 | `formatAmount` display helper (pure) | Met |
| C1-AC3 | `convertFiatToKcrd` is the sole conversion path | Met |
| C1-AC4 | Display currency toggle writes `User.displayCurrency` only | Met |
| C1-AC5 | Wallet page and KAmount component use display currency | Met |
| C1-AC6 | Rate backdating rejected (effectiveFrom ≥ now − 60s) | Met |

### C.2 — Visitor Groups

| AC | Description | Status |
|---|---|---|
| C2-AC1 | Master Admin can create, edit, archive visitor groups | Met — `CreateGroupDialog`, `EditGroupDialog`, `ArchiveGroupButton` wired |
| C2-AC2 | Visitor assigned to group sees targeted announcements only | Met — `getUpdatesWithAcknowledgements` filters by `activeGroupIds` |
| C2-AC3 | Visitor cannot vote or transact (server-side) | Met — `denyIfVisitor()` in `castVoteAction` + wallet mutation actions |
| C2-AC4 | "Send announcement to this group" deep-link pre-selects audience | Met — C.2.1: community page reads `announce`/`groupId` params, passes `defaultGroupId` to `NewUpdateSheet` |
| C2-AC5 | Audit log for group creation, member assignment, announcement sends | Met — all actions call `createAuditEntry` |
| C2-AC6 | Visitor can file issue reports | Met — `raiseIssueAction` permits VISITOR role |

### C.3 — Rental Cycle & Extension

| AC | Description | Status |
|---|---|---|
| C3-AC1 | Tenant sees lease status, cycle, next-payment-due | Met — `TenancyStatusCard` wired to `/property` page |
| C3-AC2 | Extension request → admin approval/decline lifecycle | Met — `requestExtensionAction` / `approveExtensionAction` / `declineExtensionAction` |
| C3-AC3 | Lease state transitions correct under date logic | Met — `computeLeaseStatus` tested; 19 unit tests green |
| C3-AC4 | Audit log captures every state change | Met — all rental-extension actions call `createAuditEntry` |
| C3-AC5 | Cron rolls lease status correctly | Met — `route.test.ts` 8 tests: ACTIVE→ENDING_SOON, ENDING_SOON→EXPIRED, nextPaymentDue rollover |
| C3-AC6 | ENDING_SOON email sent to resident on transition | Met — `lease-ending-soon` template; tested in route.test.ts |
| C3-AC7 | E2E coverage: request, approve, decline paths | Met — `c3-rental-extensions.spec.ts` (3 serial scenarios); `rental-extension.spec.ts` (D.10 test 7 activated) |

---

## Test Summary

| Suite | Count | Status |
|---|---|---|
| Unit (Vitest) | 373/373 | Green |
| E2E: c2-visitor-groups.spec.ts | 3 scenarios (serial) | Active (Playwright) |
| E2E: c3-rental-extensions.spec.ts | 3 scenarios (serial) | Active (Playwright) |
| E2E: rental-extension.spec.ts | 1 test | Active — D.10 test 7 no longer skipped |

**Previously skipped E2E tests now active:**
- `tests/e2e/rental-extension.spec.ts` — C.3 not implemented → now implemented (D.10 test 7)
- `tests/e2e/c2-visitor-groups.spec.ts` — vitest describe.skip → real Playwright serial spec
- `tests/e2e/c3-rental-extensions.spec.ts` — vitest describe.skip → real Playwright serial spec

---

## Scaffolding Already Present from D-Block (Not Touched This Session)

The following were found complete and required no changes:

- `prisma/schema.prisma` — VisitorGroup, VisitorGroupMembership, CommunityUpdate targeting fields, PropertyTenancy cycle fields, RentalExtensionRequest
- `lib/queries/visitor-groups.ts`, `app/(admin)/_actions/visitor-groups.ts`
- `app/(admin)/admin/visitors/groups/` — list + detail pages + 4 components
- `app/(resident)/community/page.tsx` — visitor-aware tab set, filtered update feed
- `app/(admin)/admin/community/_components/new-update-sheet.tsx` — audience picker with `defaultGroupId` support
- `app/(admin)/_actions/rental-extensions.ts` — all three actions
- `app/(resident)/property/_components/tenancy-status-card.tsx` + `extension-request-modal.tsx`
- `app/(resident)/property/page.tsx` — TenancyStatusCard wired
- `app/api/cron/leases/route.ts` — cron endpoint complete
- `lib/lease/cycle.ts` — all four functions
- `docs/cron.md` — complete (added in D.12)
- `lib/visitor-groups/__tests__/groups.test.ts` — 11 tests (in prior count)
- `lib/lease/__tests__/cycle.test.ts` — 15 base tests (in prior count)
- `app/api/cron/leases/__tests__/route.test.ts` — 6 base tests (in prior count)

---

## Regressions Found and Fixed

None. All changes were additive to existing scaffolding.

---

## Remaining Risks from Risk Register Relevant to Block C

| Risk ID | Description | Status |
|---|---|---|
| R-C1-01 | `prisma migrate dev` requires live DB | Open — no new migration in C.2/C.3; C.1 migration pre-applied |
| R-D10-01 | E2E demo sign-in requires real Clerk instance | Open — requires GitHub secrets setup (project owner) |
| R-D10-02 | Test 2 (ledger-transfer) still skipped — no resident-to-resident KCRD transfer UI | Open — deferred to future prompt |

---

## D-SEQUENCE-01 Resolution

Decision **D-SEQUENCE-01** (2026-04-29) documented that C.2 and C.3 were deferred ahead of Block D execution. This checkpoint closes that gap:

- C.2 ✅ Done
- C.3 ✅ Done
- The prerequisite for F.2 production readiness gate is now satisfied for Block C

---

## Gate Verdict for E.1

**Go** — all Block C acceptance criteria met, 373/373 unit tests green, build clean, E2E specs active.
