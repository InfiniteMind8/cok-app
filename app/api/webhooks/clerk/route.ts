import { Webhook } from 'svix'
import { clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { generateUniqueMemberId } from '@/lib/member-id'

type ClerkUserCreatedEvent = {
  type: 'user.created'
  data: {
    id: string
    email_addresses: Array<{ email_address: string; id: string }>
    primary_email_address_id: string
    first_name: string | null
    last_name: string | null
    image_url: string | null
  }
}

type ClerkUserUpdatedEvent = {
  type: 'user.updated'
  data: {
    id: string
    email_addresses: Array<{ email_address: string; id: string }>
    primary_email_address_id: string
    first_name: string | null
    last_name: string | null
    image_url: string | null
  }
}

type ClerkUserDeletedEvent = {
  type: 'user.deleted'
  data: {
    id: string
    deleted: boolean
  }
}

type ClerkWebhookEvent =
  | ClerkUserCreatedEvent
  | ClerkUserUpdatedEvent
  | ClerkUserDeletedEvent

function getPrimaryEmail(data: ClerkUserCreatedEvent['data']): string {
  const primary = data.email_addresses.find(
    (e) => e.id === data.primary_email_address_id,
  )
  return primary?.email_address ?? data.email_addresses[0]?.email_address ?? ''
}

function getFullName(data: ClerkUserCreatedEvent['data']): string {
  const parts = [data.first_name, data.last_name].filter(Boolean)
  return parts.join(' ') || 'Karis Member'
}

export async function POST(request: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

  if (!webhookSecret) {
    return new Response('Missing CLERK_WEBHOOK_SECRET', { status: 500 })
  }

  const svixId = request.headers.get('svix-id')
  const svixTimestamp = request.headers.get('svix-timestamp')
  const svixSignature = request.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const payload = await request.text()
  const wh = new Webhook(webhookSecret)

  let event: ClerkWebhookEvent
  try {
    event = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent
  } catch {
    return new Response('Invalid webhook signature', { status: 401 })
  }

  // Idempotency: if we've already processed this event id, return 200 immediately.
  const existing = await db.webhookEvent.findUnique({ where: { id: svixId } })
  if (existing) {
    return new Response('Already processed', { status: 200 })
  }

  try {
    if (event.type === 'user.created') {
      const { data } = event
      const email = getPrimaryEmail(data)
      const fullName = getFullName(data)

      const existingUser = await db.user.findUnique({ where: { email } })
      if (existingUser) {
        await db.user.update({
          where: { email },
          data: {
            clerkId: data.id,
            profilePhotoUrl: data.image_url ?? existingUser.profilePhotoUrl,
          },
        })
      } else {
        const memberId = await generateUniqueMemberId()

        await db.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              clerkId: data.id,
              memberId,
              email,
              fullName,
              role: 'VISITOR',
              status: 'PENDING_KYC',
              profilePhotoUrl: data.image_url,
            },
          })

          await tx.wallet.create({
            data: { userId: user.id },
          })
        })
      }
    } else if (event.type === 'user.updated') {
      const { data } = event
      const email = getPrimaryEmail(data)
      const fullName = getFullName(data)

      await db.user.updateMany({
        where: { clerkId: data.id },
        data: {
          email,
          fullName,
          profilePhotoUrl: data.image_url,
        },
      })
    } else if (event.type === 'user.deleted') {
      // Soft-delete: preserve the row for audit log FK integrity.
      await db.user.updateMany({
        where: { clerkId: event.data.id },
        data: {
          deactivatedAt: new Date(),
          deactivationReason: 'clerk_deleted',
        },
      })

      try {
        const clerk = await clerkClient()
        const sessions = await clerk.sessions
          .getSessionList({ userId: event.data.id })
          .catch(() => ({ data: [] }))
        await Promise.all(
          sessions.data.map((s) => clerk.sessions.revokeSession(s.id).catch(() => {})),
        )
      } catch {
        // Clerk may have already deleted the user and invalidated sessions.
      }
    }
  } catch (err) {
    // Do NOT persist the WebhookEvent on failure so Clerk can retry (same svix-id).
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error(`[webhook] handler error for ${event.type} (${svixId}):`, errorMessage)
    return new Response('Handler error', { status: 500 })
  }

  await db.webhookEvent.create({
    data: {
      id: svixId,
      source: 'clerk',
      type: event.type,
       
      payload: JSON.parse(payload),
      signatureValid: true,
      processedAt: new Date(),
    },
  })

  return new Response('OK', { status: 200 })
}
