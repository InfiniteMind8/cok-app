import Link from 'next/link'
import { PageHeader } from '@/components/admin/page-header'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getAuditLogs } from '@/lib/queries/audit-log'
import { Download } from 'lucide-react'
import { AuditTable } from './_components/audit-table'

const PAGE_SIZE = 50

const ENTITY_OPTIONS = [
  'User', 'Property', 'Attachment', 'Transaction', 'FeeSchedule',
  'ConversionRate', 'ConversionPromotion', 'ImportSession', 'AuditLog',
  'SettlementRequest', 'CommunityUpdate', 'VisitorGroup',
]

interface SearchParams {
  actorId?: string
  action?: string
  entity?: string
  entityId?: string
  dateFrom?: string
  dateTo?: string
  page?: string
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)

  const filters = {
    actorId: sp.actorId || undefined,
    action: sp.action || undefined,
    entity: sp.entity || undefined,
    entityId: sp.entityId || undefined,
    dateFrom: sp.dateFrom || undefined,
    dateTo: sp.dateTo || undefined,
  }

  const { logs, total } = await getAuditLogs({ ...filters, page, pageSize: PAGE_SIZE })
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const exportParams = new URLSearchParams(
    Object.fromEntries(Object.entries({ ...filters }).filter(([, v]) => v !== undefined)) as Record<string, string>
  ).toString()

  return (
    <div className="p-8 max-w-7xl">
      <PageHeader
        title="Audit Log"
        subtitle="All system events — filterable by actor, action, entity, and date range."
        action={
          <a
            href={`/api/admin/audit-log/export${exportParams ? `?${exportParams}` : ''}`}
            className="inline-flex items-center gap-2 text-xs font-body font-medium text-karis-stone-600 hover:text-karis-green-900 border border-karis-stone-200 hover:border-karis-green-200 bg-white hover:bg-karis-green-50 px-3 py-2 rounded-lg transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </a>
        }
      />

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6">
        <Input
          name="action"
          placeholder="Action contains…"
          defaultValue={sp.action ?? ''}
          className="w-48 font-body text-sm"
        />
        <Select name="entity" defaultValue={sp.entity ?? ''}>
          <SelectTrigger className="w-44 font-body text-sm">
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All entities</SelectItem>
            {ENTITY_OPTIONS.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          name="actorId"
          placeholder="Actor ID…"
          defaultValue={sp.actorId ?? ''}
          className="w-48 font-mono text-sm"
        />
        <Input
          name="entityId"
          placeholder="Entity ID…"
          defaultValue={sp.entityId ?? ''}
          className="w-48 font-mono text-sm"
        />
        <Input
          type="date"
          name="dateFrom"
          defaultValue={sp.dateFrom ?? ''}
          className="w-40 font-body text-sm"
          title="From date"
        />
        <Input
          type="date"
          name="dateTo"
          defaultValue={sp.dateTo ?? ''}
          className="w-40 font-body text-sm"
          title="To date"
        />
        <button
          type="submit"
          className="text-xs font-body font-medium text-white bg-karis-green-800 hover:bg-karis-green-700 px-4 py-2 rounded-lg transition-colors"
        >
          Filter
        </button>
        {Object.values(filters).some(Boolean) && (
          <Link
            href="/admin/audit-log"
            className="text-xs font-body text-karis-stone-500 hover:text-karis-stone-900 px-3 py-2 border border-karis-stone-100 rounded-lg transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Count */}
      <div className="text-xs font-body text-karis-stone-500 tabular-nums mb-4">
        {total} entr{total !== 1 ? 'ies' : 'y'}
        {Object.values(filters).some(Boolean) ? ' matching filters' : ' total'}
      </div>

      <AuditTable logs={logs} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-xs font-body text-karis-stone-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/audit-log?${new URLSearchParams({ ...sp, page: String(page - 1) })}`}
                className="text-xs font-body text-karis-stone-500 hover:text-karis-stone-900 px-3 py-1.5 border border-karis-stone-100 rounded-lg transition-colors"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/audit-log?${new URLSearchParams({ ...sp, page: String(page + 1) })}`}
                className="text-xs font-body text-karis-stone-500 hover:text-karis-stone-900 px-3 py-1.5 border border-karis-stone-100 rounded-lg transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
