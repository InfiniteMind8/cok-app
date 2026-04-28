# Prompt C.2 — Visitor Groups System

**Phase:** 1+  
**Status:** Done  
**Commit:** (see qa/phase1plus-progress.md)  
**Tests:** 181/181 pass (16 new)

---

## Objective

Build a Visitor Groups system that allows admins to:
1. Create and manage named visitor groups (cohorts)
2. Assign/remove visitors from groups
3. Send announcements targeted to specific groups, roles, or the whole community
4. Enforce visitor permission lockdown at the Server Action layer

## Scope

1. Add `VisitorGroup`, `VisitorGroupMembership` models + `AnnouncementTargetType` enum + targeting fields on `CommunityUpdate` (one migration).
2. Build admin Visitor Groups CRUD: list page, group detail page with member assign/remove.
3. Refactor the announcement composer to add audience selector.
4. Extend Add Visitor form (create + edit) with visitor group multi-select picker.
5. Filter announcements feed by `targetType` + user memberships; enforce visitor permission lockdown.

## Acceptance Criteria

- [x] Master Admin can create, edit, and archive visitor groups.
- [x] Visitor sees only announcements they should see (community-wide OR group-targeted to their group OR individually targeted).
- [x] Visitor cannot vote, transact, or view governance internals (enforced at Server Action layer via `denyIfVisitor()`).
- [x] Audit log records: group creation, member assignments, announcement sends.

## Key Decisions

- **D-018:** Extended `CommunityUpdate` in-place rather than renaming to `Announcement` — zero regression risk.
- **D-019:** Playwright E2E spec created as `describe.skip` with full scenario documentation; live tests deferred to D.10.
- **D-020:** `vi.mock()` factory pattern used in vitest tests to avoid hoisting initialization errors.

## Files Added / Modified

**New:**
- `prisma/migrations/20260428215229_add_visitor_groups/`
- `lib/queries/visitor-groups.ts`
- `app/(admin)/_actions/visitor-groups.ts`
- `app/(admin)/admin/visitors/groups/page.tsx`
- `app/(admin)/admin/visitors/groups/loading.tsx`
- `app/(admin)/admin/visitors/groups/_components/create-group-dialog.tsx`
- `app/(admin)/admin/visitors/groups/_components/archive-group-button.tsx`
- `app/(admin)/admin/visitors/groups/[id]/page.tsx`
- `app/(admin)/admin/visitors/groups/[id]/loading.tsx`
- `app/(admin)/admin/visitors/groups/[id]/_components/member-manager.tsx`
- `app/(admin)/admin/visitors/groups/[id]/_components/edit-group-dialog.tsx`
- `lib/visitor-groups/__tests__/groups.test.ts`
- `lib/queries/__tests__/community-feed-filter.test.ts`
- `tests/e2e/c2-visitor-groups.spec.ts`

**Modified:**
- `prisma/schema.prisma`
- `lib/auth.ts` — added `denyIfVisitor()`
- `lib/queries/community.ts` — role/group feed filtering
- `lib/queries/accounts.ts` — include groupMemberships
- `app/(admin)/_actions/community.ts` — audience params + audit log + fan-out
- `app/(admin)/_actions/accounts.ts` — group assignment on create
- `app/(admin)/admin/community/_components/new-update-sheet.tsx` — audience selector
- `app/(admin)/admin/community/page.tsx` — pass visitorGroups
- `app/(admin)/admin/accounts/_components/create-account-dialog.tsx` — group picker
- `app/(admin)/admin/accounts/_components/accounts-table.tsx` — groupMemberships prop
- `app/(admin)/admin/accounts/_components/account-detail-drawer.tsx` — groups display
- `app/(admin)/admin/accounts/page.tsx` — fetch visitorGroups
- `app/(resident)/community/page.tsx` — visitor tab logic + group-filtered feed
- `app/(resident)/_actions/community.ts` — denyIfVisitor on castVoteAction
- `app/(resident)/_actions/wallet.ts` — denyIfVisitor on settlement actions
