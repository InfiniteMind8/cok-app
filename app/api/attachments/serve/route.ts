export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { LocalStorageDriver } from '@/lib/storage/driver'

// GET /api/attachments/serve?token={hmac-signed-token}
// Only used with STORAGE_DRIVER=local. S3 driver returns direct pre-signed S3 URLs.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const encryptionKey = process.env.STORAGE_ENCRYPTION_KEY
  if (!encryptionKey) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 503 })
  }

  const driver = new LocalStorageDriver(encryptionKey)
  const payload = driver.verifyToken(token)

  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  if (Date.now() > payload.exp) {
    return NextResponse.json({ error: 'Token expired' }, { status: 410 })
  }

  let decrypted: { data: Buffer; mime: string }
  try {
    decrypted = await driver.decrypt(payload.key)
  } catch (err) {
    // GCM auth tag mismatch or file not found
    console.error('[serve] decrypt failed:', err)
    return NextResponse.json({ error: 'File unavailable' }, { status: 404 })
  }

  return new Response(new Uint8Array(decrypted.data), {
    status: 200,
    headers: {
      'Content-Type': decrypted.mime,
      'Content-Length': String(decrypted.data.length),
      'Cache-Control': 'private, no-store',
      'Content-Disposition': 'inline',
    },
  })
}
