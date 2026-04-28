'use server'

import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { AttachmentEntityType } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createVoucherSchema = z.object({
  recipientId: z.string().min(1, 'Recipient is required'),
  amountKcrd: z.string().min(1, 'Amount is required'),
  message: z.string().optional(),
  expiresAt: z.string().optional(),
  attachmentKey: z.string().optional(),
  attachmentName: z.string().optional(),
  attachmentSize: z.number().optional(),
  attachmentMime: z.string().optional(),
})

export type CreateVoucherInput = z.infer<typeof createVoucherSchema>

export async function createVoucherAction(input: CreateVoucherInput) {
  const actor = await requireRole(['MASTER_ADMIN'])

  const parsed = createVoucherSchema.parse(input)

  if (isNaN(parseFloat(parsed.amountKcrd)) || parseFloat(parsed.amountKcrd) <= 0) {
    throw new Error('Amount must be a positive number')
  }

  const result = await db.$transaction(async (tx) => {
    const voucher = await tx.voucherRequest.create({
      data: {
        recipientId: parsed.recipientId,
        requestedBy: actor.id,
        amountKcrd: parsed.amountKcrd,
        message: parsed.message?.trim() ?? null,
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
        status: 'PENDING',
      },
    })

    if (parsed.attachmentKey && parsed.attachmentName) {
      await tx.attachment.create({
        data: {
          storageKey: parsed.attachmentKey,
          mimeType: parsed.attachmentMime ?? 'application/pdf',
          sizeBytes: BigInt(parsed.attachmentSize ?? 0),
          name: parsed.attachmentName,
          entityType: AttachmentEntityType.VOUCHER_REQUEST,
          entityId: voucher.id,
          fieldName: 'voucherAttachment',
          uploadedBy: actor.id,
        },
      })
    }

    await tx.auditLog.create({
      data: {
        action: 'CREATE_VOUCHER_REQUEST',
        entity: 'VoucherRequest',
        entityId: voucher.id,
        actorId: actor.id,
        after: {
          recipientId: parsed.recipientId,
          amountKcrd: parsed.amountKcrd,
        },
      },
    })

    return voucher
  })

  revalidatePath('/admin/approvals')
  return { voucherRequestId: result.id }
}
