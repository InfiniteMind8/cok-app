'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { sendEmail } from '@/lib/email/service'
import { notifyAllOfRole } from '@/lib/notifications/service'
import { computeNextPaymentDue } from '@/lib/lease/cycle'

// ─── Request extension (resident) ────────────────────────────────────────────

const requestSchema = z.object({
  tenancyId: z.string().min(1),
  requestedNewEndDate: z.string().min(1),
  reason: z.string().optional(),
})

export async function requestExtensionAction(input: unknown) {
  const user = await requireRole('RESIDENT')
  const { tenancyId, requestedNewEndDate, reason } = requestSchema.parse(input)

  const newEnd = new Date(requestedNewEndDate)
  if (isNaN(newEnd.getTime())) throw new Error('Invalid date')

  const tenancy = await db.propertyTenancy.findUniqueOrThrow({
    where: { id: tenancyId },
    include: { property: { select: { code: true } } },
  })

  if (tenancy.userId !== user.id) throw new Error('Forbidden')

  if (tenancy.endDate && newEnd <= tenancy.endDate) {
    throw new Error('Requested end date must be after the current end date')
  }

  const request = await db.$transaction(async (tx) => {
    const req = await tx.rentalExtensionRequest.create({
      data: {
        tenancyId,
        requestedById: user.id,
        requestedNewEndDate: newEnd,
        reason: reason ?? null,
        status: 'PENDING',
      },
    })

    await tx.auditLog.create({
      data: {
        action: 'EXTENSION_REQUEST',
        entity: 'RentalExtensionRequest',
        entityId: req.id,
        actorId: user.id,
        after: {
          tenancyId,
          requestedNewEndDate: newEnd.toISOString(),
          reason: reason ?? null,
        },
      },
    })

    return req
  })

  await notifyAllOfRole(['MASTER_ADMIN'], {
    type: 'RENTAL_EXTENSION_REQUEST',
    title: 'New rental extension request',
    body: `${user.fullName} has requested a lease extension for property ${tenancy.property.code}.`,
    link: '/admin/approvals?tab=rental-extensions',
    priority: 'yellow',
  })

  revalidatePath('/property')
  return { ok: true, requestId: request.id }
}

// ─── Approve extension (Master Admin) ────────────────────────────────────────

const approveSchema = z.object({
  requestId: z.string().min(1),
  note: z.string().optional(),
})

export async function approveExtensionAction(input: unknown) {
  const admin = await requireRole(['MASTER_ADMIN'])
  const { requestId, note } = approveSchema.parse(input)

  const extensionRequest = await db.rentalExtensionRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: {
      tenancy: { include: { property: { select: { code: true } } } },
      requestedBy: { select: { id: true, email: true, fullName: true } },
    },
  })

  if (extensionRequest.status !== 'PENDING') {
    throw new Error('Request is not pending')
  }

  const tenancy = extensionRequest.tenancy
  const newEndDate = extensionRequest.requestedNewEndDate
  const today = new Date()

  const newNextPaymentDue = tenancy.startDate
    ? computeNextPaymentDue(tenancy.startDate, tenancy.cycleUnit, today)
    : null

  const newLeaseStatus =
    tenancy.leaseStatus === 'ENDING_SOON' ? 'ACTIVE' : tenancy.leaseStatus

  await db.$transaction(async (tx) => {
    await tx.rentalExtensionRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        reviewedById: admin.id,
        reviewedAt: today,
        decisionNote: note ?? null,
      },
    })

    await tx.propertyTenancy.update({
      where: { id: tenancy.id },
      data: {
        endDate: newEndDate,
        ...(newNextPaymentDue ? { nextPaymentDue: newNextPaymentDue } : {}),
        leaseStatus: newLeaseStatus,
      },
    })

    await tx.auditLog.create({
      data: {
        action: 'EXTENSION_APPROVED',
        entity: 'RentalExtensionRequest',
        entityId: requestId,
        actorId: admin.id,
        before: {
          endDate: tenancy.endDate?.toISOString() ?? null,
          leaseStatus: tenancy.leaseStatus,
        },
        after: {
          endDate: newEndDate.toISOString(),
          leaseStatus: newLeaseStatus,
          nextPaymentDue: newNextPaymentDue?.toISOString() ?? null,
        },
      },
    })
  })

  await sendEmail({
    template: 'rental-extension-decision',
    to: extensionRequest.requestedBy.email,
    subject: `Rental extension approved — ${tenancy.property.code}`,
    data: {
      residentName: extensionRequest.requestedBy.fullName,
      propertyCode: tenancy.property.code,
      decision: 'approved',
      newEndDate: newEndDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      decisionNote: note ?? undefined,
      leaseUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/property`,
    },
    idempotencyKey: `extension-approved:${requestId}`,
  })

  revalidatePath('/admin/approvals')
  return { ok: true }
}

// ─── Decline extension (Master Admin) ────────────────────────────────────────

const declineSchema = z.object({
  requestId: z.string().min(1),
  note: z.string().min(1, 'A reason is required when declining'),
})

export async function declineExtensionAction(input: unknown) {
  const admin = await requireRole(['MASTER_ADMIN'])
  const { requestId, note } = declineSchema.parse(input)

  const extensionRequest = await db.rentalExtensionRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: {
      tenancy: { include: { property: { select: { code: true } } } },
      requestedBy: { select: { id: true, email: true, fullName: true } },
    },
  })

  if (extensionRequest.status !== 'PENDING') {
    throw new Error('Request is not pending')
  }

  const today = new Date()

  await db.$transaction(async (tx) => {
    await tx.rentalExtensionRequest.update({
      where: { id: requestId },
      data: {
        status: 'DECLINED',
        reviewedById: admin.id,
        reviewedAt: today,
        decisionNote: note,
      },
    })

    await tx.auditLog.create({
      data: {
        action: 'EXTENSION_DECLINED',
        entity: 'RentalExtensionRequest',
        entityId: requestId,
        actorId: admin.id,
        after: { decisionNote: note },
      },
    })
  })

  await sendEmail({
    template: 'rental-extension-decision',
    to: extensionRequest.requestedBy.email,
    subject: `Rental extension request — ${extensionRequest.tenancy.property.code}`,
    data: {
      residentName: extensionRequest.requestedBy.fullName,
      propertyCode: extensionRequest.tenancy.property.code,
      decision: 'declined',
      decisionNote: note,
      leaseUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/property`,
    },
    idempotencyKey: `extension-declined:${requestId}`,
  })

  revalidatePath('/admin/approvals')
  return { ok: true }
}
