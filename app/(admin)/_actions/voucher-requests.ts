'use server'

import { randomBytes } from 'crypto'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email/service'
import { notify } from '@/lib/notifications/service'
import { revalidatePath } from 'next/cache'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function generateVoucherCode(): string {
  return `KCRD-${randomBytes(4).toString('hex').toUpperCase()}`
}

export async function approveVoucherRequestAction(requestId: string) {
  const admin = await requireRole(['MASTER_ADMIN'])

  const voucherCode = generateVoucherCode()

  const req = await db.$transaction(async (tx) => {
    const updated = await tx.voucherRequest.updateMany({
      where: { id: requestId, status: 'PENDING' },
      data: {
        status: 'APPROVED',
        voucherCode,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    })

    if (updated.count !== 1) {
      const current = await tx.voucherRequest.findUnique({
        where: { id: requestId },
        select: { status: true },
      })
      if (!current) throw new Error('Request not found')
      throw new Error(`Request already processed (status: ${current.status})`)
    }

    await tx.auditLog.create({
      data: {
        action: 'VOUCHER_REQUEST_APPROVED',
        entity: 'VoucherRequest',
        entityId: requestId,
        actorId: admin.id,
        before: { status: 'PENDING' },
        after: { status: 'APPROVED', voucherCode },
      },
    })

    return tx.voucherRequest.findUniqueOrThrow({ where: { id: requestId } })
  })

  const recipient = await db.user.findUnique({
    where: { id: req.recipientId },
    select: { email: true, fullName: true },
  })

  try {
    await notify({
      userId: req.recipientId,
      type: 'VOUCHER_RECEIVED',
      title: 'You received a K Credit voucher',
      body: `A voucher for ${req.amountKcrd} KCRD has been issued to your account.`,
      link: '/wallet',
      priority: 'yellow',
    })
  } catch {
    // Non-fatal
  }

  if (recipient) {
    sendEmail({
      to: recipient.email,
      subject: `Your K Credit voucher — ${req.amountKcrd} KCRD`,
      template: 'voucher-delivery',
      data: {
        recipientName: recipient.fullName,
        voucherCode,
        amountKcrd: req.amountKcrd.toString(),
        description: req.description ?? req.message ?? 'A voucher has been issued to your account.',
        expiresAt: req.expiresAt ? req.expiresAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined,
        redeemUrl: `${APP_URL}/wallet`,
      },
      idempotencyKey: `voucher-approved:${requestId}`,
    }).catch(() => {})
  }

  revalidatePath('/admin/approvals')
}

export async function declineVoucherRequestAction(requestId: string, reason: string) {
  const admin = await requireRole(['MASTER_ADMIN', 'ADMIN'])

  if (!reason.trim()) throw new Error('Decline reason is required')

  const req = await db.$transaction(async (tx) => {
    const updated = await tx.voucherRequest.updateMany({
      where: { id: requestId, status: 'PENDING' },
      data: {
        status: 'DECLINED',
        declinedReason: reason.trim(),
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    })

    if (updated.count !== 1) {
      const current = await tx.voucherRequest.findUnique({
        where: { id: requestId },
        select: { status: true },
      })
      if (!current) throw new Error('Request not found')
      throw new Error(`Request already processed (status: ${current.status})`)
    }

    await tx.auditLog.create({
      data: {
        action: 'VOUCHER_REQUEST_DECLINED',
        entity: 'VoucherRequest',
        entityId: requestId,
        actorId: admin.id,
        before: { status: 'PENDING' },
        after: { status: 'DECLINED', declinedReason: reason.trim() },
      },
    })

    return tx.voucherRequest.findUniqueOrThrow({ where: { id: requestId } })
  })

  try {
    await notify({
      userId: req.requestedBy,
      type: 'VOUCHER_DECLINED',
      title: 'Voucher request declined',
      body: `The voucher request for ${req.amountKcrd} KCRD was not approved.`,
      link: '/admin/approvals',
      priority: 'yellow',
    })
  } catch {
    // Non-fatal
  }

  revalidatePath('/admin/approvals')
}
