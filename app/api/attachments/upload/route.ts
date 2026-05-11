import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// D.4: thin JWT proxy. The actual MIME-magic check, encryption, and storage
// write live on the backend at POST /v1/attachments/upload. This handler
// just attaches the caller's Clerk JWT and streams the multipart body
// through, so existing client uploaders that POST to `/api/attachments/upload`
// keep working without changing every form.
export async function POST(req: NextRequest) {
  const { getToken } = await auth()
  const token = await getToken()
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!baseUrl) {
    return NextResponse.json({ error: 'Backend URL not configured' }, { status: 503 })
  }

  const backendUrl = `${baseUrl.replace(/\/+$/, '')}/v1/attachments/upload`
  const contentType = req.headers.get('content-type') ?? 'application/octet-stream'

  const upstream = await fetch(backendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType,
    },
    body: req.body,
    // @ts-expect-error — Node fetch requires duplex: 'half' for streamed bodies
    duplex: 'half',
  })

  const body = await upstream.arrayBuffer()
  return new NextResponse(new Uint8Array(body), {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
    },
  })
}
