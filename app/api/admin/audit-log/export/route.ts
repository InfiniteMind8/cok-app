import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { getAuditLogsForExport } from '@/lib/queries/audit-log'

export async function GET(request: Request) {
  const actor = await requireRole(['MASTER_ADMIN', 'ADMIN'])

  const { searchParams } = new URL(request.url)
  const filters = {
    actorId: searchParams.get('actorId') ?? undefined,
    action: searchParams.get('action') ?? undefined,
    entity: searchParams.get('entity') ?? undefined,
    entityId: searchParams.get('entityId') ?? undefined,
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
  }

  const logs = await getAuditLogsForExport(filters)

  // Write audit entry for the export itself
  await db.auditLog.create({
    data: {
      action: 'AUDIT_LOG_EXPORT',
      entity: 'AuditLog',
      actorId: actor.id,
      after: { filters, rowCount: logs.length },
    },
  })

  const header = ['id', 'createdAt', 'actorId', 'action', 'entity', 'entityId', 'before', 'after']
  const rows = logs.map((log) => [
    log.id,
    log.createdAt.toISOString(),
    log.actorId,
    log.action,
    log.entity,
    log.entityId ?? '',
    log.before !== null && log.before !== undefined ? JSON.stringify(log.before) : '',
    log.after !== null && log.after !== undefined ? JSON.stringify(log.after) : '',
  ])

  const csvLines = [header, ...rows].map((row) =>
    row
      .map((cell) => {
        const s = String(cell)
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`
        }
        return s
      })
      .join(','),
  )

  const csv = csvLines.join('\r\n')
  const filename = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
