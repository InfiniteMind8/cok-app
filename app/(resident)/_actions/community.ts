'use server'

import { withResidentAction, type AuthUser } from '@/lib/action'
import { db } from '@/lib/db'
import { IssueLevel, AttachmentEntityType } from '@prisma/client'
import { notifyAllOfRole } from '@/lib/notifications/service'
import { revalidatePath } from 'next/cache'

async function _acknowledgeUpdateAction(user: AuthUser, updateId: string) {
  await db.updateAcknowledgement.upsert({
    where: { updateId_userId: { updateId, userId: user.id } },
    update: {},
    create: { updateId, userId: user.id },
  })

  revalidatePath('/community')
}

export const acknowledgeUpdateAction = withResidentAction(_acknowledgeUpdateAction, {
  roles: ['RESIDENT', 'VISITOR', 'ADMIN', 'MASTER_ADMIN'],
})

async function _castVoteAction(user: AuthUser, voteId: string, optionId: string) {
  await db.$transaction(async (tx) => {
    const option = await tx.voteOption.findUnique({
      where: { id: optionId },
      select: { voteId: true, vote: { select: { isOpen: true } } },
    })

    if (!option || option.voteId !== voteId) {
      throw new Error('Invalid vote option')
    }
    if (!option.vote.isOpen) {
      throw new Error('This vote is no longer open')
    }

    await tx.voteSubmission.create({
      data: { voteId, optionId, userId: user.id },
    })
  })

  revalidatePath('/community')
}

export const castVoteAction = withResidentAction(_castVoteAction, {
  roles: ['RESIDENT'],
})

interface IssueAttachment {
  storageKey: string
  mimeType: string
  sizeBytes: number
  name: string
  fieldName: string
}

async function _raiseIssueAction(
  user: AuthUser,
  input: {
    seriousness: IssueLevel
    urgency: IssueLevel
    category: string
    message: string
    title?: string
    location?: string
    propertyId?: string
    contactPreference?: string
    attachments?: IssueAttachment[]
  },
) {
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

export const raiseIssueAction = withResidentAction(_raiseIssueAction, {
  roles: ['RESIDENT', 'VISITOR'],
})

async function _markAllNotificationsReadAction(user: AuthUser) {
  await db.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  })

  revalidatePath('/community')
}

export const markAllNotificationsReadAction = withResidentAction(_markAllNotificationsReadAction)
