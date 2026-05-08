'use server'
import 'server-only'
import { z } from 'zod/v4'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { DisplayCurrency } from '@prisma/client'

const SetRateSchema = z.object({
  baseCurrency: z.enum(['KCRD', 'USD', 'GYD']),
  quoteCurrency: z.enum(['KCRD', 'USD', 'GYD']),
  rate: z.string().min(1),
})

export async function setConversionRateAction(input: unknown) {
  const user = await requireRole(['MASTER_ADMIN'])
  const parsed = SetRateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid input.' }

  const { baseCurrency, quoteCurrency, rate } = parsed.data

  if (baseCurrency === quoteCurrency) {
    return { ok: false, error: 'Base and quote currency must differ.' }
  }

  let rateDecimal
  try {
    const { Prisma } = await import('@prisma/client')
    rateDecimal = new Prisma.Decimal(rate)
    if (rateDecimal.lte(0)) return { ok: false, error: 'Rate must be greater than zero.' }
  } catch {
    return { ok: false, error: 'Invalid rate value.' }
  }

  const now = new Date()

  await db.$transaction(async (tx) => {
    // Close the current active row
    await tx.conversionRate.updateMany({
      where: { baseCurrency: baseCurrency as DisplayCurrency, quoteCurrency: quoteCurrency as DisplayCurrency, effectiveTo: null },
      data: { effectiveTo: now },
    })
    // Insert new row
    await tx.conversionRate.create({
      data: {
        baseCurrency: baseCurrency as DisplayCurrency,
        quoteCurrency: quoteCurrency as DisplayCurrency,
        rate: rateDecimal,
        effectiveFrom: now,
        setBy: user.id,
      },
    })
    await tx.auditLog.create({
      data: {
        action: 'currency.rate.updated',
        entity: 'ConversionRate',
        actorId: user.id,
        after: { baseCurrency, quoteCurrency, rate },
      },
    })
  })

  revalidatePath('/admin/settings/currency')
  return { ok: true }
}

export async function getRateHistory(baseCurrency: string, quoteCurrency: string) {
  return db.conversionRate.findMany({
    where: { baseCurrency: baseCurrency as DisplayCurrency, quoteCurrency: quoteCurrency as DisplayCurrency },
    orderBy: { effectiveFrom: 'desc' },
    take: 10,
    select: { rate: true, effectiveFrom: true, effectiveTo: true, setBy: true, id: true },
  })
}

export async function getAllActiveRates() {
  const now = new Date()
  return db.conversionRate.findMany({
    where: {
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
    },
    orderBy: [{ baseCurrency: 'asc' }, { quoteCurrency: 'asc' }],
  })
}
