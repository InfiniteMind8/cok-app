'use server'

import { withAdminAction, type AuthUser } from '@/lib/action'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getAttachmentUrl } from '@/lib/storage/attachments'

async function _getAttachmentUrlAction(user: AuthUser, attachmentId: string): Promise<string> {
  const attachment = await db.attachment.findUniqueOrThrow({
    where: { id: attachmentId },
  })

  const isUploader = attachment.uploadedBy === user.id
  const isAdmin = user.role === 'MASTER_ADMIN' || user.role === 'ADMIN'

  if (!isUploader && !isAdmin) {
    throw new Error('Forbidden: you do not have access to this attachment')
  }

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

  return getAttachmentUrl(attachment.id)
}

export const getAttachmentUrlAction = withAdminAction(_getAttachmentUrlAction, {
  roles: ['MASTER_ADMIN', 'ADMIN', 'RESIDENT', 'VENDOR', 'VISITOR'],
})

async function _deleteAttachmentAction(user: AuthUser, attachmentId: string): Promise<void> {
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

export const deleteAttachmentAction = withAdminAction(_deleteAttachmentAction, {
  roles: ['MASTER_ADMIN', 'ADMIN'],
})
