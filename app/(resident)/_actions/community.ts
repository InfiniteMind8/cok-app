'use server'

import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { IssueLevel, AttachmentEntityType } from '@prisma/client'
import { notifyAllOfRole } from '@/lib/notifications/service'
import { revalidatePath } from 'next/cache'

export async function acknowledgeUpdateAction(updateId: string) {
  const user = await requireRole(['RESIDENT', 'VISITOR'])

  await db.updateAcknowledgement.upsert({
    where: { updateId_userId: { updateId, userId: user.id } },
    update: {},
    create: { updateId, userId: user.id },
  })

  revalidatePath('/community')
}

export async function castVoteAction(voteId: string, optionId: string) {
  const user = await requireRole(['RESIDENT', 'VISITOR'])

  const vote = await db.vote.findUnique({ where: { id: voteId } })
  if (!vote) throw new Error('Vote not found')
  if (!vote.isOpen) throw new Error('This vote is no longer open')

  await db.voteSubmission.create({
    data: { voteId, optionId, userId: user.id },
  })

  revalidatePath('/community')
}

interface IssueAttachment {
  storageKey: string
  mimeType: string
  sizeBytes: number
  name: string
  fieldName: string
}

export async function raiseIssueAction(input: {
  seriousness: IssueLevel
  urgency: IssueLevel
  category: string
  message: string
  title?: string
  location?: string
  propertyId?: string
  contactPreference?: string
  attachments?: IssueAttachment[]
}) {
  const user = await requireRole(['RESIDENT', 'VISITOR'])

  if (!input.message.trim()) throw new Error('Message is required')
  if (!input.category.trim()) throw new Error('Category is required')

  await db.$transaction(async (tx) => {
    const issue = await tx.issue.create({
      data: {
        reporterId: user.id,
        seriousness: input.seriousness,
        urgency: input.urgency,
        category: input.category.trim(),
        message: input.message.trim(),
        title: input.title?.trim() ?? null,
        location: input.location?.trim() ?? null,
        propertyId: input.propertyId ?? null,
        contactPreference: input.contactPreference ?? null,
      },
    })

    if (input.attachments && input.attachments.length > 0) {
      for (const att of input.attachments) {
        await tx.attachment.create({
          data: {
            storageKey: att.storageKey,
            mimeType: att.mimeType,
            sizeBytes: BigInt(att.sizeBytes),
            name: att.name,
            entityType: AttachmentEntityType.ISSUE,
            entityId: issue.id,
            fieldName: att.fieldName,
            uploadedBy: user.id,
          },
        })
      }
    }

    await tx.auditLog.create({
      data: {
        action: 'RAISE_ISSUE',
        entity: 'Issue',
        entityId: issue.id,
        actorId: user.id,
        after: { category: issue.category, seriousness: issue.seriousness },
      },
    })
  })

  try {
    await notifyAllOfRole(['MASTER_ADMIN', 'ADMIN'], {
      type: 'ISSUE_RAISED',
      title: 'New issue raised',
      body:
        (input.title ? input.title + ': ' : '') +
        input.category.trim() +
        ': ' +
        input.message.trim().slice(0, 80) +
        (input.message.trim().length > 80 ? '…' : ''),
      link: '/admin/community',
    })
  } catch {
    // Notification failure must not fail the issue submission
  }

  revalidatePath('/community')
}

export async function markAllNotificationsReadAction() {
  const user = await requireRole(['RESIDENT', 'VISITOR'])

  await db.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  })

  revalidatePath('/community')
}
