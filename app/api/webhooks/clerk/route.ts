import { headers } from 'next/headers'
import { Webhook } from 'svix'
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

type ClerkWebhookEvent = ClerkUserCreatedEvent | ClerkUserUpdatedEvent

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

  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

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
    return new Response('Invalid webhook signature', { status: 400 })
  }

  if (event.type === 'user.created') {
    const { data } = event
    const email = getPrimaryEmail(data)
    const fullName = getFullName(data)

    // If admin pre-created the user record, just link the Clerk ID
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      await db.user.update({
        where: { email },
        data: { clerkId: data.id, profilePhotoUrl: data.image_url ?? existing.profilePhotoUrl },
      })
      return new Response('OK', { status: 200 })
    }

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

  if (event.type === 'user.updated') {
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
  }

  return new Response('OK', { status: 200 })
}
