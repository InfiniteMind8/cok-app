'use server'

import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email/service'
import { notify } from '@/lib/notifications/service'
import { revalidatePath } from 'next/cache'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function approveTransferAction(requestId: string) {
  const admin = await requireRole(['MASTER_ADMIN'])

  const req = await db.$transaction(async (tx) => {
    const updated = await tx.propertyTransferRequest.updateMany({
      where: { id: requestId, status: 'PENDING' },
      data: { status: 'APPROVED', reviewedBy: admin.id, reviewedAt: new Date() },
    })

    if (updated.count !== 1) {
      const current = await tx.propertyTransferRequest.findUnique({
        where: { id: requestId },
        select: { status: true },
      })
      if (!current) throw new Error('Request not found')
      throw new Error(`Request already processed (status: ${current.status})`)
    }

    const approvedRequest = await tx.propertyTransferRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: { property: { select: { code: true, address: true } } },
    })

    // Transfer ownership: reassign the fromUser's ownership row to toUser
    const ownershipUpdated = await tx.propertyOwnership.updateMany({
      where: { propertyId: approvedRequest.propertyId, userId: approvedRequest.fromUserId },
      data: { userId: approvedRequest.toUserId },
    })
    if (ownershipUpdated.count !== 1) {
      throw new Error('Property ownership could not be transferred')
    }

    await tx.auditLog.create({
      data: {
        action: 'PROPERTY_TRANSFER_APPROVED',
        entity: 'PropertyTransferRequest',
        entityId: requestId,
        actorId: admin.id,
        before: { status: 'PENDING' },
        after: { status: 'APPROVED' },
      },
    })

    return approvedRequest
  })

  // Fetch recipient names for notifications
  const [fromUser, toUser] = await Promise.all([
    db.user.findUnique({ where: { id: req.fromUserId }, select: { email: true, fullName: true } }),
    db.user.findUnique({ where: { id: req.toUserId }, select: { email: true, fullName: true } }),
  ])

  try {
    await Promise.all([
      fromUser &&
        notify({
          userId: req.fromUserId,
          type: 'TRANSFER_APPROVED',
          title: 'Property transfer approved',
          body: `Ownership of ${req.property.code} has been transferred.`,
          link: '/properties',
          priority: 'yellow',
        }),
      toUser &&
        notify({
          userId: req.toUserId,
          type: 'TRANSFER_APPROVED',
          title: 'Property ownership received',
          body: `You are now the owner of ${req.property.code}.`,
          link: '/properties',
          priority: 'yellow',
        }),
    ])
  } catch {
    // Notification failure must not fail the business action
  }

  const emailBase = {
    propertyCode: req.property.code,
    propertyAddress: req.property.address ?? undefined,
    decision: 'approved' as const,
    requestId,
    dashboardUrl: `${APP_URL}/properties`,
  }

  if (fromUser) {
    sendEmail({
      to: fromUser.email,
      subject: `Property transfer approved — ${req.property.code}`,
      template: 'property-transfer-decision',
      data: { ...emailBase, recipientName: fromUser.fullName },
      idempotencyKey: `transfer-approved-from:${requestId}`,
    }).catch(() => {})
  }

  if (toUser) {
    sendEmail({
      to: toUser.email,
      subject: `Property transfer approved — ${req.property.code}`,
      template: 'property-transfer-decision',
      data: { ...emailBase, recipientName: toUser.fullName },
      idempotencyKey: `transfer-approved-to:${requestId}`,
    }).catch(() => {})
  }

  revalidatePath('/admin/approvals')
  revalidatePath('/admin/properties')
}

export async function declineTransferAction(requestId: string, reason: string) {
  const admin = await requireRole(['MASTER_ADMIN', 'ADMIN'])

  if (!reason.trim()) throw new Error('Decline reason is required')

  const req = await db.$transaction(async (tx) => {
    const updated = await tx.propertyTransferRequest.updateMany({
      where: { id: requestId, status: 'PENDING' },
      data: {
        status: 'DECLINED',
        declinedReason: reason.trim(),
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    })

    if (updated.count !== 1) {
      const current = await tx.propertyTransferRequest.findUnique({
        where: { id: requestId },
        select: { status: true },
      })
      if (!current) throw new Error('Request not found')
      throw new Error(`Request already processed (status: ${current.status})`)
    }

    await tx.auditLog.create({
      data: {
        action: 'PROPERTY_TRANSFER_DECLINED',
        entity: 'PropertyTransferRequest',
        entityId: requestId,
        actorId: admin.id,
        before: { status: 'PENDING' },
        after: { status: 'DECLINED', declinedReason: reason.trim() },
      },
    })

    return tx.propertyTransferRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: { property: { select: { code: true, address: true } } },
    })
  })

  const requester = await db.user.findUnique({
    where: { id: req.requestedBy },
    select: { email: true, fullName: true, id: true },
  })

  try {
    if (requester) {
      await notify({
        userId: requester.id,
        type: 'TRANSFER_DECLINED',
        title: 'Property transfer declined',
        body: `Transfer of ${req.property.code} was not approved.`,
        link: '/admin/approvals',
        priority: 'yellow',
      })
    }
  } catch {
    // Non-fatal
  }

  if (requester) {
    sendEmail({
      to: requester.email,
      subject: `Property transfer declined — ${req.property.code}`,
      template: 'property-transfer-decision',
      data: {
        recipientName: requester.fullName,
        propertyCode: req.property.code,
        propertyAddress: req.property.address ?? undefined,
        decision: 'declined',
        declineReason: reason.trim(),
        requestId,
        dashboardUrl: `${APP_URL}/admin/approvals`,
      },
      idempotencyKey: `transfer-declined:${requestId}`,
    }).catch(() => {})
  }

  revalidatePath('/admin/approvals')
}
