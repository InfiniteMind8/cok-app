'use server'

import { requireRole } from '@/lib/auth'
import { createAuditEntry } from '@/lib/audit'
import { db } from '@/lib/db'
import { runAndSaveReconciliation } from '@/lib/ledger/reconciliation-report'
import { revalidatePath } from 'next/cache'

export async function runNowAction(): Promise<{ ok: boolean; reportId?: string; error?: string }> {
  const actor = await requireRole('MASTER_ADMIN')

  try {
    const report = await runAndSaveReconciliation()

    await createAuditEntry({
      action: 'reconciliation.run_now',
      entity: 'ReconciliationReport',
      entityId: report.id,
      actorId: actor.id,
      after: { status: report.status, discrepancy: report.details.discrepancy },
    })

    revalidatePath('/admin/treasury/reconciliation')

    return { ok: true, reportId: report.id }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return { ok: false, error }
  }
}

export async function acknowledgeAlertAction(
  reportId: string,
): Promise<{ ok: boolean; error?: string }> {
  const actor = await requireRole('MASTER_ADMIN')

  const report = await db.reconciliationReport.findUnique({ where: { id: reportId } })
  if (!report) return { ok: false, error: 'Report not found.' }
  if (report.acknowledgedAt) return { ok: false, error: 'Already acknowledged.' }

  await db.reconciliationReport.update({
    where: { id: reportId },
    data: { acknowledgedById: actor.id, acknowledgedAt: new Date() },
  })

  await createAuditEntry({
    action: 'reconciliation.acknowledged',
    entity: 'ReconciliationReport',
    entityId: reportId,
    actorId: actor.id,
    before: { acknowledgedAt: null },
    after: { acknowledgedAt: new Date().toISOString(), acknowledgedById: actor.id },
  })

  revalidatePath('/admin/treasury/reconciliation')
  revalidatePath('/admin')

  return { ok: true }
}
