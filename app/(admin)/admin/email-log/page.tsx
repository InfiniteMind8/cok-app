import { PageHeader } from '@/components/admin/page-header'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/admin/empty-state'
import { adminEmailsApi, type EmailStatus } from '@/lib/api'
import { getServerApi } from '@/lib/api/server'
import { format, parseISO } from 'date-fns'
import { Mail } from 'lucide-react'
import { ResendButton } from './_components/resend-button'
import { StatusFilter } from './_components/status-filter'

const PAGE_SIZE = 50

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  SENT: { label: 'Sent', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  FAILED: { label: 'Failed', className: 'bg-red-50 text-red-700 border-red-200' },
  QUEUED: { label: 'Queued', className: 'bg-amber-50 text-amber-700 border-amber-200' },
}

export default async function EmailLogPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const { status, page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))

  const statusFilter =
    status && (['SENT', 'FAILED', 'QUEUED'] as const).includes(status as EmailStatus)
      ? (status as EmailStatus)
      : undefined

  const { logs, total, counts: countMap } = await adminEmailsApi.list(getServerApi(), {
    page,
    status: statusFilter,
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-8 max-w-7xl">
      <PageHeader
        title="Email Log"
        subtitle="All transactional email attempts, with delivery status and resend capability."
      />

      {/* Summary chips */}
      <div className="flex items-center gap-3 mb-6">
        {(['SENT', 'FAILED', 'QUEUED'] as const).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={STATUS_STYLES[s].className}
            >
              {STATUS_STYLES[s].label}
            </Badge>
            <span className="text-sm text-karis-stone-500 font-body tabular-nums">
              {countMap[s] ?? 0}
            </span>
          </div>
        ))}
        <span className="text-xs text-karis-stone-300 ml-auto font-body">
          {total} total
        </span>
      </div>

      {/* Filter bar */}
      <StatusFilter currentStatus={status} />

      {logs.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No email records"
          body={status ? `No emails with status "${status}" found.` : 'No transactional emails have been sent yet.'}
        />
      ) : (
        <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden mb-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-karis-stone-50">
                {['Recipient', 'Subject', 'Template', 'Status', 'Sent / Created', 'Error', ''].map((h) => (
                  <TableHead key={h} className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const style = STATUS_STYLES[log.status] ?? STATUS_STYLES.QUEUED
                const stamp = log.sentAt ?? log.createdAt
                return (
                  <TableRow key={log.id}>
                    <TableCell className="px-5 font-body text-sm text-karis-stone-900 max-w-[180px] truncate">
                      {log.recipient}
                    </TableCell>
                    <TableCell className="px-5 font-body text-sm text-karis-stone-700 max-w-[200px] truncate">
                      {log.subject}
                    </TableCell>
                    <TableCell className="px-5 font-body text-xs text-karis-stone-500">
                      {log.template}
                    </TableCell>
                    <TableCell className="px-5">
                      <Badge variant="outline" className={`text-xs ${style.className}`}>
                        {style.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 font-body text-xs text-karis-stone-500 tabular-nums">
                      {format(parseISO(stamp), 'dd MMM yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="px-5 font-body text-xs text-red-600 max-w-[220px] truncate">
                      {log.providerError ?? '—'}
                    </TableCell>
                    <TableCell className="px-5">
                      {log.status === 'FAILED' && (
                        <ResendButton logId={log.id} />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-karis-stone-500 font-body">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`?${new URLSearchParams({ ...(status ? { status } : {}), page: String(page - 1) }).toString()}`}
                className="text-sm text-karis-green-700 hover:text-karis-green-900 font-body"
              >
                ← Previous
              </a>
            )}
            {page < totalPages && (
              <a
                href={`?${new URLSearchParams({ ...(status ? { status } : {}), page: String(page + 1) }).toString()}`}
                className="text-sm text-karis-green-700 hover:text-karis-green-900 font-body"
              >
                Next →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
