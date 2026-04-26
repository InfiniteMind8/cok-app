'use server'

import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { IssueLevel } from '@prisma/client'
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

export async function raiseIssueAction(input: {
  seriousness: IssueLevel
  urgency: IssueLevel
  category: string
  message: string
}) {
  const user = await requireRole(['RESIDENT', 'VISITOR'])

  if (!input.message.trim()) throw new Error('Message is required')
  if (!input.category.trim()) throw new Error('Category is required')

  await db.issue.create({
    data: {
      reporterId: user.id,
      seriousness: input.seriousness,
      urgency: input.urgency,
      category: input.category.trim(),
      message: input.message.trim(),
    },
  })

  try {
    await notifyAllOfRole(['MASTER_ADMIN', 'ADMIN'], {
      type: 'ISSUE_RAISED',
      title: 'New issue raised',
      body:
        input.category.trim() +
        ': ' +
        input.message.trim().slice(0, 80) +
        (input.message.trim().length > 80 ? '…' : ''),
      link: '/community?tab=issues',
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
