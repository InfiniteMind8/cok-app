'use server'

import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { IssueStatus } from '@prisma/client'
import { notify, notifyAllOfRole } from '@/lib/notifications/service'
import { revalidatePath } from 'next/cache'

export async function publishUpdateAction(input: {
  headline: string
  category: string
  message: string
  photoUrl?: string
}) {
  const admin = await requireRole(['MASTER_ADMIN', 'ADMIN'])

  if (!input.headline.trim()) throw new Error('Headline is required')
  if (!input.message.trim()) throw new Error('Message is required')

  await db.communityUpdate.create({
    data: {
      headline: input.headline.trim(),
      category: input.category.trim(),
      message: input.message.trim(),
      photoUrl: input.photoUrl ?? null,
      publishedBy: admin.id,
    },
  })

  try {
    await notifyAllOfRole(['RESIDENT', 'VISITOR'], {
      type: 'COMMUNITY_UPDATE',
      title: `New update: ${input.headline.trim()}`,
      link: '/community',
    })
  } catch {
    // Notification failure must not fail publish
  }

  revalidatePath('/community')
}

export async function createVoteAction(input: {
  headline: string
  description: string
  options: { label: string; description: string }[]
}) {
  const admin = await requireRole(['MASTER_ADMIN', 'ADMIN'])

  if (!input.headline.trim()) throw new Error('Headline is required')
  if (input.options.length < 2) throw new Error('At least 2 options are required')

  await db.vote.create({
    data: {
      headline: input.headline.trim(),
      description: input.description.trim(),
      isOpen: true,
      createdBy: admin.id,
      options: {
        createMany: {
          data: input.options.map((o) => ({
            label: o.label.trim(),
            description: o.description.trim(),
          })),
        },
      },
    },
  })

  try {
    await notifyAllOfRole(['RESIDENT'], {
      type: 'VOTE_OPEN',
      title: `New vote: ${input.headline.trim()}`,
      body: 'Cast your vote in the Community tab.',
      link: '/community?tab=voting',
    })
  } catch {
    // Notification failure must not fail vote creation
  }

  revalidatePath('/community')
}

export async function closeVoteAction(voteId: string) {
  await requireRole(['MASTER_ADMIN', 'ADMIN'])

  await db.vote.update({
    where: { id: voteId },
    data: { isOpen: false, closedAt: new Date() },
  })

  revalidatePath('/community')
}

export async function replyToIssueAction(issueId: string, message: string) {
  const admin = await requireRole(['MASTER_ADMIN', 'ADMIN'])

  if (!message.trim()) throw new Error('Reply message is required')

  const issue = await db.issue.findUnique({
    where: { id: issueId },
    select: { reporterId: true },
  })

  await db.issueReply.create({
    data: {
      issueId,
      authorId: admin.id,
      message: message.trim(),
    },
  })

  if (issue) {
    try {
      await notify({
        userId: issue.reporterId,
        type: 'ISSUE_REPLY',
        title: 'A reply has been posted to your issue',
        body: message.trim().slice(0, 100) + (message.trim().length > 100 ? '…' : ''),
        link: '/community/issues',
        priority: 'yellow',
      })
    } catch {
      // Notification failure must not fail the reply
    }
  }

  revalidatePath('/community')
}

export async function updateIssueStatusAction(issueId: string, status: IssueStatus) {
  await requireRole(['MASTER_ADMIN', 'ADMIN'])

  await db.issue.update({
    where: { id: issueId },
    data: { status },
  })

  revalidatePath('/community')
}

export async function assignIssueAction(issueId: string) {
  const admin = await requireRole(['MASTER_ADMIN', 'ADMIN'])

  await db.issue.update({
    where: { id: issueId },
    data: { assigneeId: admin.id },
  })

  revalidatePath('/community')
}
