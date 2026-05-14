import { adminDataDirectoryApi, ApiClientError } from '@/lib/api'
import { getServerApi } from '@/lib/api/server'

// D.4: thin JWT proxy. The ZIP build, SHA256 manifest, audit-log write, and
// MASTER_ADMIN gate all live on the backend at
// GET /v1/admin/data-directory/export/:userId. Forwarding the Clerk JWT
// keeps the existing `<a href="/api/...">` download link working.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params
  try {
    return await adminDataDirectoryApi.exportUser(getServerApi(), userId)
  } catch (err) {
    if (err instanceof ApiClientError) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: err.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    throw err
  }
}
