'use server'

import { requireRole } from '@/lib/auth'
import { getCurrentUser } from '@/lib/auth'
import { createAuditEntry } from '@/lib/audit'
import { checkRateLimit, RateLimitError } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/email/service'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import type { AnnouncementSeverity } from '@prisma/client'

const CHUNK_SIZE = 50

function subjectPrefix(severity: AnnouncementSeverity): string {
  if (severity === 'CRITICAL') return '[CRITICAL] '
  if (severity === 'URGENT') return '[URGENT] '
  return '[INFO] '
}

export async function sendBroadcastAction(data: {
  title: string
  body: string
  severity: AnnouncementSeverity
}): Promise<{ ok: boolean; broadcastId?: string; sent?: number; failed?: number; error?: string }> {
  const actor = await requireRole('MASTER_ADMIN')

  try {
    await checkRateLimit({ identifier: actor.id, scope: 'email-send' })
  } catch (e) {
    if (e instanceof RateLimitError) {
      await createAuditEntry({ action: 'rate_limit_exceeded', entity: 'SYSTEM', actorId: actor.id, after: { scope: 'email-send', actionName: 'sendBroadcastAction' } })
      return { ok: false, error: e.message }
    }
    throw e
  }

  if (!data.title?.trim() || data.title.length > 80) {
    return { ok: false, error: 'Title is required and must be 80 characters or fewer.' }
  }
  if (!data.body?.trim() || data.body.length > 2000) {
    return { ok: false, error: 'Body is required and must be 2000 characters or fewer.' }
  }

  const broadcast = await db.communityUpdate.create({
    data: {
      category: 'emergency',
      headline: data.title.trim(),
      message: data.body.trim(),
      publishedBy: actor.id,
      targetType: 'COMMUNITY_WIDE',
      severity: data.severity,
      isEmergency: true,
    },
  })

  const recipients = await db.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, email: true, fullName: true },
  })

  let sent = 0
  let failed = 0
  const sentAt = new Date().toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC'

  for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
    const chunk = recipients.slice(i, i + CHUNK_SIZE)
    await Promise.all(
      chunk.map(async (user) => {
        const result = await sendEmail({
          to: user.email,
          subject: `${subjectPrefix(data.severity)}${data.title.trim()}`,
          template: 'emergency-broadcast',
          data: {
            recipientName: user.fullName,
            headline: data.title.trim(),
            message: data.body.trim(),
            sentAt,
            severity: data.severity,
          },
          idempotencyKey: `broadcast-${broadcast.id}-${user.id}`,
        })
        if (result.ok) {
          sent++
        } else {
          failed++
        }
      }),
    )
    // yield to event loop between chunks
    if (i + CHUNK_SIZE < recipients.length) {
      await new Promise((r) => setTimeout(r, 20))
    }
  }

  await createAuditEntry({
    action: 'broadcast.send',
    entity: 'CommunityUpdate',
    entityId: broadcast.id,
    actorId: actor.id,
    after: { severity: data.severity, totalRecipients: recipients.length, sent, failed },
  })

  revalidatePath('/admin/broadcast')

  return { ok: true, broadcastId: broadcast.id, sent, failed }
}

export async function acknowledgeEmergencyBroadcastAction(
  broadcastId: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const broadcast = await db.communityUpdate.findUnique({ where: { id: broadcastId } })
  if (!broadcast || !broadcast.isEmergency) return { ok: false, error: 'Broadcast not found.' }

  await db.updateAcknowledgement.upsert({
    where: { updateId_userId: { updateId: broadcastId, userId: user.id } },
    create: { updateId: broadcastId, userId: user.id },
    update: {},
  })

  revalidatePath('/', 'layout')

  return { ok: true }
}
