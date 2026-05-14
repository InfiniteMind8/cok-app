import { type NextRequest } from 'next/server'
import { adminAuditLogApi, ApiClientError } from '@/lib/api'
import { getServerApi } from '@/lib/api/server'

// D.4: thin JWT proxy. The actual CSV generation, audit-log write, and
// role gate live on the backend at GET /v1/admin/audit-log/export. This
// handler just forwards query params with the caller's Clerk JWT and
// streams the response back to the browser so the existing
// `<a href="/api/...">` download UX keeps working.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const filters = {
    actorId: searchParams.get('actorId') ?? undefined,
    action: searchParams.get('action') ?? undefined,
    entity: searchParams.get('entity') ?? undefined,
    entityId: searchParams.get('entityId') ?? undefined,
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
  }

  try {
    return await adminAuditLogApi.export(getServerApi(), filters)
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
