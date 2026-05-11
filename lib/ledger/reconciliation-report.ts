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

  // D.3 — email-send moved to backend (`cok-api`). The reconciliation cron in
  // the backend's `src/cron/reconciliation.ts` sends treasury alerts directly
  // via the backend's Resend client. This function still runs as part of the
  // reconciliation calculation on the frontend (until D.4 moves the whole
  // server-component flow to the API client); the email step is a no-op here.
  // Variables intentionally referenced to keep the data shape stable for
  // future re-wiring to a backend POST.
  void admins
  void details
  void reportId
}

export async function getActiveAlert() {
  return db.reconciliationReport.findFirst({
    where: { status: 'MISMATCH', acknowledgedAt: null },
    orderBy: { runAt: 'desc' },
  })
}
