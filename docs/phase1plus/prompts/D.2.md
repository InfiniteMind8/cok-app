# Prompt D.2 — Bulk Excel Import: Properties

## Source
`COK-Phase1Plus-ClaudeCode-Playbook.md` §D.2

## Acceptance Criteria

1. Master Admin imports the founding property roll in one operation via `/admin/imports/properties`.
2. Optional companion-zip attaches photos and documents correctly when used:
   - Top-level zip folder names match `external_ref`
   - Subfolders `photos/`, `title-deed/`, `occupancy-permit/`, `utility/` are ingested as `Attachment` rows on commit
3. Errors are row-specific and actionable (status pills: Valid / Warning / Error).

## Template Columns (14)

`external_ref`, `address_line_1`*, `address_line_2`, `lot_number`, `type`*, `size_sqm`,
`bedrooms`, `bathrooms`, `parking_spots`, `year_built`, `status`, `purchase_price_kcrd`,
`current_valuation_kcrd`, `notes`

(*required)

## Key Design Decisions

| ID | Decision |
|---|---|
| D-D2-01 | Property `code` = `external_ref` if provided, else `IMP-{rowNumber:04d}` |
| D-D2-02 | Duplicate `code` → WARNING (admin confirms before committing) |
| D-D2-03 | Zip attachment metadata stored in `ImportSession.metadata Json?` |
| D-D2-04 | UTApi upload skipped with `console.warn` when `UPLOADTHING_TOKEN` absent |
| D-D2-05 | `category` defaults to `RESIDENTIAL` (not in template; founding roll is residential) |

## Files Created

- `website/lib/imports/properties-parser.ts`
- `website/lib/imports/__tests__/properties-parser.test.ts`
- `website/app/(admin)/_actions/imports.ts` (3 new actions appended)
- `website/app/(admin)/admin/imports/properties/page.tsx`
- `website/app/(admin)/admin/imports/properties/_components/upload-form.tsx`
- `website/app/(admin)/admin/imports/properties/template/route.ts`
- `website/app/(admin)/admin/imports/properties/[sessionId]/page.tsx`
- `website/app/(admin)/admin/imports/properties/[sessionId]/_components/preview-table.tsx`
- `website/tests/e2e/d2-property-import.spec.ts` (describe.skip stubs for D.10)

## Migration

`20260429044638_add_import_session_metadata` — adds nullable `metadata Json?` column to `ImportSession`

## New Dependency

`jszip@3.10.1` — companion zip extraction (server-side)

## Commit

`feat(imports): D.2 bulk property import — upload, preview, commit flow`
