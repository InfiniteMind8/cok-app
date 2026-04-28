'use server'
import 'server-only'
import { z } from 'zod/v4'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { PromotionDirection, PromotionEligibility } from '@prisma/client'

const CreatePromotionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  bonusPercent: z.string().min(1),
  direction: z.enum(['FIAT_TO_KCRD', 'KCRD_TO_FIAT']),
  eligibility: z.enum(['ALL', 'FOUNDING_MEMBERS', 'RESIDENTS_ONLY', 'SPECIFIC_USERS']),
  eligibleUserIds: z.string().optional(),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
})

export async function createPromotionAction(input: unknown) {
  const user = await requireRole(['MASTER_ADMIN'])
  const parsed = CreatePromotionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid input.' }

  const { name, description, bonusPercent, direction, eligibility, eligibleUserIds, startsAt, endsAt } = parsed.data

  let bonusDec
  try {
    const { Prisma } = await import('@prisma/client')
    bonusDec = new Prisma.Decimal(bonusPercent)
    if (bonusDec.lte(0) || bonusDec.gt(100)) return { ok: false, error: 'Bonus percent must be between 0 and 100.' }
  } catch {
    return { ok: false, error: 'Invalid bonus percent.' }
  }

  const startsAtDate = new Date(startsAt)
  const endsAtDate = new Date(endsAt)
  if (endsAtDate <= startsAtDate) return { ok: false, error: 'End date must be after start date.' }

  const userIds = eligibleUserIds
    ? eligibleUserIds.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  await db.conversionPromotion.create({
    data: {
      name,
      description,
      bonusPercent: bonusDec,
      direction: direction as PromotionDirection,
      eligibility: eligibility as PromotionEligibility,
      eligibleUserIds: userIds,
      startsAt: startsAtDate,
      endsAt: endsAtDate,
      active: true,
      createdBy: user.id,
    },
  })

  await db.auditLog.create({
    data: {
      action: 'promotion.created',
      entity: 'ConversionPromotion',
      actorId: user.id,
      after: { name, direction, eligibility, bonusPercent },
    },
  })

  revalidatePath('/admin/settings/promotions')
  return { ok: true }
}

export async function archivePromotionAction(id: string) {
  const user = await requireRole(['MASTER_ADMIN'])

  await db.$transaction(async (tx) => {
    await tx.conversionPromotion.update({
      where: { id },
      data: { active: false, endsAt: new Date() },
    })
    await tx.auditLog.create({
      data: {
        action: 'promotion.archived',
        entity: 'ConversionPromotion',
        entityId: id,
        actorId: user.id,
      },
    })
  })

  revalidatePath('/admin/settings/promotions')
  return { ok: true }
}
