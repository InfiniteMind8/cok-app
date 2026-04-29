export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createId } from '@paralleldrive/cuid2'
import path from 'path'
import { requireRole } from '@/lib/auth'
import { getStorage } from '@/lib/storage/driver'

// ─── MIME validation (magic bytes) ───────────────────────────────────────────

const MAGIC: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  { mime: 'video/mp4', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
]

function detectMime(buf: Buffer): string | null {
  for (const { mime, bytes, offset = 0 } of MAGIC) {
    if (bytes.every((b, i) => buf[offset + i] === b)) return mime
  }
  return null
}

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'video/mp4',
  'video/quicktime',
])

const EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
}

const MAX_SIZE_BYTES = 64 * 1024 * 1024 // 64 MB hard cap

// ─── POST /api/attachments/upload ─────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    await requireRole(['MASTER_ADMIN', 'ADMIN', 'RESIDENT', 'VENDOR', 'VISITOR'])
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid multipart body' }, { status: 400 })
  }

  const fileField = formData.get('file')
  if (!(fileField instanceof File)) {
    return NextResponse.json({ error: 'Missing file field' }, { status: 400 })
  }

  const entityType = (formData.get('entityType') as string | null) ?? 'OTHER'
  const entityId = (formData.get('entityId') as string | null) ?? 'unknown'
  const fieldName = (formData.get('fieldName') as string | null) ?? 'attachment'
  const category = (formData.get('category') as string | null) ?? ''

  if (fileField.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File exceeds maximum allowed size of ${MAX_SIZE_BYTES / (1024 * 1024)} MB` },
      { status: 413 },
    )
  }

  const arrayBuf = await fileField.arrayBuffer()
  const buffer = Buffer.from(arrayBuf)

  // Validate magic bytes
  const detectedMime = detectMime(buffer)
  const declaredMime = fileField.type || 'application/octet-stream'
  const mime = detectedMime ?? declaredMime

  if (!ALLOWED_MIME.has(mime)) {
    return NextResponse.json(
      { error: `File type not allowed: ${mime}` },
      { status: 415 },
    )
  }

  // Build structured storage key
  const fileId = createId()
  const origExt = path.extname(fileField.name).toLowerCase()
  const ext = origExt && EXTENSION_MAP[mime] ? origExt : (EXTENSION_MAP[mime] ?? origExt)
  const storageKey = `${entityType.toLowerCase()}/${entityId}/${fieldName}/${fileId}${ext}`

  const storage = getStorage()
  const { storage_key, size, sha256 } = await storage.put(storageKey, buffer, mime)

  const encrypted = (process.env.STORAGE_DRIVER ?? 'local') === 'local'

  return NextResponse.json({
    storageKey: storage_key,
    sha256,
    encrypted,
    name: fileField.name,
    size,
    type: mime,
    category,
  })
}
