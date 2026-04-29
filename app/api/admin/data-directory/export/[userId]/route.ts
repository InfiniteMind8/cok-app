import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { getAttachmentsByEntity } from '@/lib/storage/attachments'
import { AttachmentEntityType } from '@prisma/client'
import JSZip from 'jszip'
import { createHash } from 'crypto'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const actor = await requireRole('MASTER_ADMIN')
  const { userId } = await params

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      wallet: { select: { id: true } },
      ownedProperties: { include: { property: { select: { code: true, type: true } } } },
      rentedProperties: { include: { property: { select: { code: true, type: true } } } },
      visitorProfile: true,
      vendorProfile: true,
    },
  })

  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const attachments = await getAttachmentsByEntity(AttachmentEntityType.USER, userId)

  const ledgerEntries = user.wallet
    ? await db.ledgerEntry.findMany({
        where: { walletId: user.wallet.id },
        include: { transaction: { select: { type: true, description: true, createdAt: true } } },
        orderBy: { createdAt: 'desc' },
      })
    : []

  const zip = new JSZip()

  // Serialize user data (strip wallet relation; include ledger separately)
  const userJson = JSON.stringify(
    {
      ...user,
      wallet: user.wallet ? { id: user.wallet.id } : null,
      // Prisma Decimal serializes as string via JSON.stringify
    },
    null,
    2,
  )
  zip.file('user.json', userJson)

  const userHash = createHash('sha256').update(userJson).digest('hex')

  // Ledger entries
  zip.file('ledger.json', JSON.stringify(ledgerEntries, null, 2))

  // Attachments
  const attachmentFolder = zip.folder('attachments')!
  const manifestEntries: Array<{
    id: string
    name: string
    mimeType: string
    storageKey: string
    status: 'ok' | 'error'
    error?: string
    hash?: string
  }> = []

  for (const att of attachments) {
    try {
      const res = await fetch(att.storageKey)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = await res.arrayBuffer()
      const bytes = new Uint8Array(buf)
      const attHash = createHash('sha256').update(bytes).digest('hex')
      attachmentFolder.file(att.name, bytes)
      manifestEntries.push({ id: att.id, name: att.name, mimeType: att.mimeType, storageKey: att.storageKey, status: 'ok', hash: attHash })
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      manifestEntries.push({ id: att.id, name: att.name, mimeType: att.mimeType, storageKey: att.storageKey, status: 'error', error })
    }
  }

  const manifest = {
    userId,
    exportedAt: new Date().toISOString(),
    actorId: actor.id,
    userJsonHash: userHash,
    attachments: manifestEntries,
  }
  const manifestJson = JSON.stringify(manifest, null, 2)
  const manifestHash = createHash('sha256').update(manifestJson).digest('hex')
  zip.file('manifest.json', manifestJson)

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

  await db.auditLog.create({
    data: {
      action: 'data_directory.export',
      entity: 'User',
      entityId: userId,
      actorId: actor.id,
      after: {
        targetUserId: userId,
        targetEmail: user.email,
        manifestHash,
        attachmentCount: attachments.length,
      },
    },
  })

  const filename = `user-export-${user.memberId}-${new Date().toISOString().slice(0, 10)}.zip`

  return new Response(new Uint8Array(zipBuffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
