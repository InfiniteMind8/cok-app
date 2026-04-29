'use server'

import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getAttachmentUrl } from '@/lib/storage/attachments'

export async function getAttachmentUrlAction(attachmentId: string): Promise<string> {
  const user = await requireRole(['MASTER_ADMIN', 'ADMIN', 'RESIDENT', 'VENDOR', 'VISITOR'])

  const attachment = await db.attachment.findUniqueOrThrow({
    where: { id: attachmentId },
  })

  const isUploader = attachment.uploadedBy === user.id
  const isAdmin = user.role === 'MASTER_ADMIN' || user.role === 'ADMIN'

  if (!isUploader && !isAdmin) {
    throw new Error('Forbidden: you do not have access to this attachment')
  }

  // Audit personal-document retrievals by admin staff
  if (isAdmin && !isUploader) {
    await db.auditLog.create({
      data: {
        action: 'RETRIEVE_ATTACHMENT',
        entity: 'Attachment',
        entityId: attachment.id,
        actorId: user.id,
        after: {
          attachmentId: attachment.id,
          entityType: attachment.entityType,
          entityId: attachment.entityId,
        },
      },
    })
  }

  // Return a short-lived signed URL (5 min TTL) — never expose raw storage keys
  return getAttachmentUrl(attachment.id)
}

export async function deleteAttachmentAction(attachmentId: string): Promise<void> {
  const user = await requireRole(['MASTER_ADMIN', 'ADMIN'])

  const attachment = await db.attachment.findUniqueOrThrow({
    where: { id: attachmentId },
  })

  await db.$transaction(async (tx) => {
    await tx.attachment.delete({ where: { id: attachmentId } })
    await tx.auditLog.create({
      data: {
        action: 'DELETE_ATTACHMENT',
        entity: 'Attachment',
        entityId: attachment.id,
        actorId: user.id,
        before: {
          attachmentId: attachment.id,
          name: attachment.name,
          entityType: attachment.entityType,
          entityId: attachment.entityId,
        },
      },
    })
  })

  revalidatePath('/')
}
