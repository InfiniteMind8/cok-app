'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { withAdminAction, type AuthUser } from '@/lib/action'
import type { FeeScheduleRules } from '@/lib/ledger/types'

const FeeRuleSchema = z.object({
  totalPct: z.number().min(0).max(100),
  communityFundPct: z.number().min(0).max(100),
  operationsFundPct: z.number().min(0).max(100),
  developerSharePct: z.number().min(0).max(100),
})

const ApplyFeeScheduleSchema = z.object({
  rules: z.record(z.string(), FeeRuleSchema),
  effectiveFrom: z.coerce.date(),
})

export type ApplyFeeScheduleResult =
  | { success: true; scheduleId: string }
  | { success: false; error: string }

async function _applyFeeScheduleAction(
  user: AuthUser,
  input: unknown,
): Promise<ApplyFeeScheduleResult> {
  const parsed = ApplyFeeScheduleSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const { rules, effectiveFrom } = parsed.data

  if (effectiveFrom.getTime() < Date.now() - 60_000) {
    return { success: false, error: 'Effective date cannot be in the past.' }
  }

  for (const [type, rule] of Object.entries(rules)) {
    const parts = rule.communityFundPct + rule.operationsFundPct + rule.developerSharePct
    if (Math.abs(parts - rule.totalPct) > 0.01) {
      return {
        success: false,
        error: `Rule ${type}: communityFundPct + operationsFundPct + developerSharePct must equal totalPct.`,
      }
    }
  }

  const newRules = rules as FeeScheduleRules

  const scheduleId = await db.$transaction(async (tx) => {
    const active = await tx.feeSchedule.findFirst({
      where: { effectiveTo: null },
      orderBy: { effectiveAt: 'desc' },
    })

    const oldRules: FeeScheduleRules = (active?.rules ?? {}) as FeeScheduleRules

    if (active) {
      await tx.feeSchedule.update({
        where: { id: active.id },
        data: { effectiveTo: new Date() },
      })
    }

    const newSchedule = await tx.feeSchedule.create({
      data: {
        effectiveAt: effectiveFrom,
        effectiveTo: null,
        rules: newRules as object,
        createdBy: user.id,
      },
    })

    const allKeys = Array.from(
      new Set([...Object.keys(oldRules), ...Object.keys(newRules)])
    )

    const changedEntries = allKeys
      .filter((key) => {
        const oldEntry = oldRules[key as keyof FeeScheduleRules]
        const newEntry = newRules[key as keyof FeeScheduleRules]
        return JSON.stringify(oldEntry) !== JSON.stringify(newEntry)
      })
      .map((key) => ({
        action: 'FEE_RULE_CHANGED',
        entity: 'FeeSchedule',
        entityId: newSchedule.id,
        actorId: user.id,
        before: oldRules[key as keyof FeeScheduleRules] as object ?? null,
        after: newRules[key as keyof FeeScheduleRules] as object ?? null,
      }))

    if (changedEntries.length > 0) {
      await tx.auditLog.createMany({ data: changedEntries })
    }

    await tx.auditLog.create({
      data: {
        action: 'FEE_SCHEDULE_APPLIED',
        entity: 'FeeSchedule',
        entityId: newSchedule.id,
        actorId: user.id,
        after: newRules as object,
      },
    })

    return newSchedule.id
  })

  revalidatePath('/admin/settings')
  return { success: true, scheduleId }
}

export const applyFeeScheduleAction = withAdminAction(_applyFeeScheduleAction, {
  roles: ['MASTER_ADMIN'],
})

export async function getFeeScheduleHistory() {
  const schedules = await db.feeSchedule.findMany({
    orderBy: { effectiveAt: 'desc' },
    take: 20,
  })

  const actorIds = [...new Set(schedules.map((s) => s.createdBy))]
  const users = await db.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, fullName: true },
  })
  const nameMap = new Map(users.map((u) => [u.id, u.fullName]))

  return schedules.map((s) => ({
    id: s.id,
    effectiveAt: s.effectiveAt,
    effectiveTo: s.effectiveTo,
    rules: s.rules as FeeScheduleRules,
    createdBy: nameMap.get(s.createdBy) ?? s.createdBy,
    createdAt: s.createdAt,
    isActive: s.effectiveTo === null,
  }))
}

export type FeeScheduleHistoryRow = Awaited<ReturnType<typeof getFeeScheduleHistory>>[number]
