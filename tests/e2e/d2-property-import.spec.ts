/**
 * TODO(phase1+/D.2): Playwright E2E tests for bulk property import.
 * These require @playwright/test to be installed and a running dev server + seeded DB.
 * Install with: pnpm add -D @playwright/test
 *
 * Scenarios:
 * 1. Admin uploads a valid 10-row property xlsx without companion zip → preview shows 10 VALID
 *    rows → commit → 10 Property records appear in /admin/properties → audit log shows import
 *    session + 10 per-row IMPORT_CREATE_PROPERTY entries.
 * 2. Admin uploads the same xlsx + companion zip (folders matching external_ref, subfolders
 *    photos/ and title-deed/) → commit → Attachment records created and visible on the
 *    property detail page for each matched property.
 *
 * Skipped here — kept as documentation for future E2E harness (Prompt D.10).
 */

import { describe, it } from 'vitest'

describe.skip('D.2 Bulk Property Import — E2E (requires live server + @playwright/test)', () => {
  it('uploads valid 10-row property xlsx → preview → commit → 10 Property records created', () => {
    // TODO(phase1+/D.2): implement with Playwright
    // 1. Sign in as MASTER_ADMIN
    // 2. Navigate to /admin/imports/properties
    // 3. Download template, fill 10 valid rows with external_ref UNIT-001..UNIT-010
    // 4. Upload xlsx → expect redirect to /admin/imports/properties/[sessionId]
    // 5. Verify preview table shows 10 "Valid" pills
    // 6. Click "Commit 10 rows"
    // 7. Expect success screen: "10 properties created · 0 skipped"
    // 8. Navigate to /admin/properties, verify 10 new rows
    // 9. Navigate to /admin/audit-log, verify IMPORT_SESSION_COMMITTED entry
    //    + 10 IMPORT_CREATE_PROPERTY entries
  })

  it('uploads xlsx + companion zip → attachments created and visible on property detail', () => {
    // TODO(phase1+/D.2): implement with Playwright
    // 1. Sign in as MASTER_ADMIN
    // 2. Navigate to /admin/imports/properties
    // 3. Toggle "Include attachments zip"
    // 4. Upload xlsx (with external_ref UNIT-001) + zip containing:
    //      UNIT-001/photos/front.jpg
    //      UNIT-001/title-deed/deed.pdf
    // 5. Preview → commit → expect success
    // 6. Navigate to property detail for the created UNIT-001 property
    // 7. Verify 2 Attachment records visible: front.jpg (photos) and deed.pdf (title-deed)
  })
})
