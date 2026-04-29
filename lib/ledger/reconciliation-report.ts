import 'server-only'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import type { ReconciliationReportDetails } from './types'

export interface SavedReconciliationReport {
  id: string
  status: 'OK' | 'WARNING' | 'MISMATCH'
  details: ReconciliationReportDetails
}

export async function runAndSaveReconciliation(): Promise<SavedReconciliationReport> {
  const [creditAgg, debitAgg, walletCount] = await Promise.all([
    db.ledgerEntry.aggregate({
      where: { amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    db.ledgerEntry.aggregate({
      where: { amount: { lt: 0 } },
      _sum: { amount: true },
    }),
    db.wallet.count(),
  ])

  const totalCredits = new Prisma.Decimal(creditAgg._sum.amount ?? 0)
  const totalDebits = new Prisma.Decimal(debitAgg._sum.amount ?? 0)
  const netSum = totalCredits.add(totalDebits)
  const discrepancy = netSum.abs()

  const status = discrepancy.eq(0) ? 'OK' : 'MISMATCH'

  const details: ReconciliationReportDetails = {
    netSum: netSum.toFixed(8),
    totalCredits: totalCredits.toFixed(8),
    totalDebits: totalDebits.toFixed(8),
    walletCount,
    discrepancy: discrepancy.toFixed(8),
  }

  const report = await db.reconciliationReport.create({
    data: { status, details: details as object },
  })

  if (status === 'MISMATCH') {
    await notifyMasterAdmins(report.id, details)
  }

  return { id: report.id, status, details }
}

async function notifyMasterAdmins(
  reportId: string,
  details: ReconciliationReportDetails,
): Promise<void> {
  const admins = await db.user.findMany({
    where: { role: 'MASTER_ADMIN', status: 'ACTIVE' },
    select: { email: true, fullName: true },
  })

  const { sendEmail } = await import('@/lib/email/service')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  await Promise.allSettled(
    admins.map((admin) =>
      sendEmail({
        template: 'treasury-alert',
        to: admin.email,
        subject: 'Treasury reconciliation discrepancy detected',
        data: {
          recipientName: admin.fullName,
          discrepancy: details.discrepancy,
          netSum: details.netSum,
          reportUrl: `${appUrl}/admin/treasury/reconciliation/${reportId}`,
          runAt: new Date().toUTCString(),
        },
        idempotencyKey: `treasury-alert:${reportId}:${admin.email}`,
      }),
    ),
  )
}

export async function getActiveAlert() {
  return db.reconciliationReport.findFirst({
    where: { status: 'MISMATCH', acknowledgedAt: null },
    orderBy: { runAt: 'desc' },
  })
}
