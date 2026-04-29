import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { computeNextPaymentDue, computeLeaseStatus } from '@/lib/lease/cycle'
import type { LeaseStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const tenancies = await db.propertyTenancy.findMany({
    where: { leaseStatus: { in: ['ACTIVE', 'ENDING_SOON'] } },
    include: {
      user: { select: { id: true, email: true, fullName: true } },
      property: { select: { code: true } },
    },
  })

  let updated = 0
  let endingSoonEmailed = 0

  for (const tenancy of tenancies) {
    const prevStatus = tenancy.leaseStatus as LeaseStatus

    let newNextPaymentDue = tenancy.nextPaymentDue
    if (tenancy.startDate) {
      const currentDue = tenancy.nextPaymentDue ?? tenancy.startDate
      if (currentDue <= today) {
        newNextPaymentDue = computeNextPaymentDue(currentDue, tenancy.cycleUnit, today)
      }
    }

    const newStatus = computeLeaseStatus(tenancy.endDate, today)

    const changed =
      newStatus !== prevStatus ||
      (newNextPaymentDue && tenancy.nextPaymentDue?.getTime() !== newNextPaymentDue.getTime())

    if (!changed) continue

    await db.propertyTenancy.update({
      where: { id: tenancy.id },
      data: {
        leaseStatus: newStatus,
        ...(newNextPaymentDue ? { nextPaymentDue: newNextPaymentDue } : {}),
      },
    })

    updated++

    // Email resident when lease enters ENDING_SOON
    if (prevStatus === 'ACTIVE' && newStatus === 'ENDING_SOON') {
      const endDateFormatted = tenancy.endDate
        ? tenancy.endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'soon'

      // Dynamic import avoids module-level evaluation of lib/env during build
      const { sendEmail } = await import('@/lib/email/service')
      await sendEmail({
        template: 'rental-extension-decision',
        to: tenancy.user.email,
        subject: `Your lease for ${tenancy.property.code} is ending soon`,
        data: {
          residentName: tenancy.user.fullName,
          propertyCode: tenancy.property.code,
          decision: 'approved',
          newEndDate: endDateFormatted,
          decisionNote: `Your lease is ending on ${endDateFormatted}. Log in to request an extension if needed.`,
          leaseUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/property`,
        },
        idempotencyKey: `cron-ending-soon:${tenancy.id}:${today.toISOString().slice(0, 10)}`,
      }).catch(() => {})

      endingSoonEmailed++
    }
  }

  return NextResponse.json({
    ok: true,
    processed: tenancies.length,
    updated,
    endingSoonEmailed,
  })
}
