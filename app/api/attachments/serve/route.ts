import { type NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// D.4: thin proxy. The HMAC-token verification + decryption live on the
// backend at GET /v1/attachments/serve. This handler forwards the `token`
// query param to the backend and streams the binary response. No Clerk
// JWT is forwarded — the HMAC token is the authorisation for this path.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing token' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!baseUrl) {
    return new Response(JSON.stringify({ error: 'Backend URL not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const upstream = await fetch(
    `${baseUrl.replace(/\/+$/, '')}/v1/attachments/serve?token=${encodeURIComponent(token)}`,
  )

  const body = await upstream.arrayBuffer()
  return new Response(new Uint8Array(body), {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
      'Content-Length': String(body.byteLength),
      'Cache-Control': 'private, no-store',
      'Content-Disposition': 'inline',
    },
  })
}
