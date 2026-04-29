import { test, describe } from '@playwright/test'

// TODO(phase1+/D.11): Full E2E — upload via property form → file persists in
// storage → admin views via Data Directory → URL is signed and expires after 5 min.
// Activate once STORAGE_DRIVER=local is set in .env.test and serve endpoint is reachable.
describe.skip('D.11 storage', () => {
  test('upload via property form persists encrypted file', async () => {
    // 1. Sign in as MASTER_ADMIN
    // 2. Navigate to /admin/properties and open add-property sheet
    // 3. Upload a test PDF to the Title Deed field
    // 4. Submit the form
    // 5. Navigate to /admin/data-directory, find the property
    // 6. Open the Attachments tab, click View
    // 7. Assert the URL starts with /api/attachments/serve?token=
    // 8. Assert the response decrypts to the original bytes
  })

  test('signed URL expires after TTL', async () => {
    // 1. Upload a file, obtain a signed URL
    // 2. Immediately: assert URL returns 200
    // 3. Manipulate token expiry (or fast-forward) → assert URL returns 410
  })

  test('admin in Data Directory sees signed URL, not raw storage path', async () => {
    // 1. Upload any attachment
    // 2. Master Admin opens Data Directory → entity attachment
    // 3. Click View → assert navigated URL contains /api/attachments/serve or S3 pre-signed
    // 4. Assert raw storage key is not exposed to the browser
  })
})
