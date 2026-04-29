'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, AlertTriangle, Loader2, X } from 'lucide-react'
import Link from 'next/link'

type RowStatus = 'VALID' | 'WARNING' | 'ERROR'
type FilterStatus = 'ALL' | RowStatus

interface PreviewRow {
  id: string
  rowNumber: number
  rowData: Record<string, string>
  status: RowStatus
  messages: string[]
}

interface SessionSummary {
  id: string
  fileName: string
  totalRows: number
  validCount: number
  warningCount: number
  errorCount: number
}

interface PreviewTableProps {
  session: SessionSummary
  rows: PreviewRow[]
  commitAction: (sessionId: string, confirmedRowIds: string[]) => Promise<{ committedCount: number; skippedCount: number }>
  cancelAction: (sessionId: string) => Promise<void>
}

function StatusPill({ status }: { status: RowStatus }) {
  if (status === 'VALID') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle2 className="h-3 w-3" /> Valid
      </span>
    )
  }
  if (status === 'WARNING') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
        <AlertTriangle className="h-3 w-3" /> Warning
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
      <AlertCircle className="h-3 w-3" /> Error
    </span>
  )
}

export function PreviewTable({ session, rows, commitAction, cancelAction }: PreviewTableProps) {
  const [filter, setFilter] = useState<FilterStatus>('ALL')
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<{ committedCount: number; skippedCount: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filteredRows = filter === 'ALL' ? rows : rows.filter((r) => r.status === filter)
  const warningRows = rows.filter((r) => r.status === 'WARNING')
  const committableCount = rows.filter((r) => r.status === 'VALID').length + confirmed.size

  function toggleConfirm(id: string) {
    setConfirmed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleCommit() {
    setError(null)
    startTransition(async () => {
      try {
        const res = await commitAction(session.id, Array.from(confirmed))
        setResult(res)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Commit failed. Please try again.')
      }
    })
  }

  function handleCancel() {
    startTransition(async () => {
      await cancelAction(session.id)
    })
  }

  if (result) {
    return (
      <div className="rounded-xl border bg-card p-8 space-y-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
        <div className="space-y-1">
          <p className="text-lg font-semibold">Import complete</p>
          <p className="text-sm text-muted-foreground">
            <strong>{result.committedCount}</strong> propert{result.committedCount !== 1 ? 'ies' : 'y'} created ·{' '}
            <strong>{result.skippedCount}</strong> skipped
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <Link href="/admin/properties">
            <Button variant="default">View Properties</Button>
          </Link>
          <Link href="/admin/imports/properties">
            <Button variant="outline">New Import</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats + filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {(['ALL', 'VALID', 'WARNING', 'ERROR'] as FilterStatus[]).map((f) => {
          const count =
            f === 'ALL'
              ? session.totalRows
              : f === 'VALID'
                ? session.validCount
                : f === 'WARNING'
                  ? session.warningCount
                  : session.errorCount
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {f === 'ALL' ? 'All' : f[0] + f.slice(1).toLowerCase()} ({count})
            </button>
          )
        })}
      </div>

      {/* Warning confirmation note */}
      {warningRows.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
          <strong>{warningRows.length}</strong> row{warningRows.length !== 1 ? 's have' : ' has'} warnings. Check the
          box on each warning row you want to include in the import.
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
              <th className="px-3 py-2 w-8">#</th>
              <th className="px-3 py-2">Ref</th>
              <th className="px-3 py-2">Address</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Row status</th>
              <th className="px-3 py-2">Messages</th>
              <th className="px-3 py-2 w-12 text-center">✓</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr
                key={row.id}
                className={`border-b last:border-0 ${
                  row.status === 'ERROR'
                    ? 'bg-red-50/50 dark:bg-red-900/5'
                    : row.status === 'WARNING'
                      ? 'bg-yellow-50/50 dark:bg-yellow-900/5'
                      : ''
                }`}
              >
                <td className="px-3 py-2 text-muted-foreground">{row.rowNumber}</td>
                <td className="px-3 py-2 font-mono text-xs">{row.rowData.external_ref || '—'}</td>
                <td className="px-3 py-2 font-medium">
                  {[row.rowData.address_line_1, row.rowData.address_line_2].filter(Boolean).join(', ') || '—'}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{row.rowData.type || '—'}</td>
                <td className="px-3 py-2 text-muted-foreground">{row.rowData.status || 'VACANT'}</td>
                <td className="px-3 py-2">
                  <StatusPill status={row.status} />
                </td>
                <td className="px-3 py-2 text-muted-foreground max-w-xs">
                  {row.messages.length > 0 ? (
                    <ul className="space-y-0.5">
                      {row.messages.map((m, i) => (
                        <li key={i} className="text-xs">
                          {m}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  {row.status === 'WARNING' && (
                    <input
                      type="checkbox"
                      aria-label={`Include warning row ${row.rowNumber}`}
                      checked={confirmed.has(row.id)}
                      onChange={() => toggleConfirm(row.id)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                  )}
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No rows match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={isPending}
          className="text-muted-foreground gap-1"
        >
          <X className="h-4 w-4" />
          Cancel import
        </Button>

        <div className="flex items-center gap-3">
          {session.errorCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {session.errorCount} error row{session.errorCount !== 1 ? 's' : ''} will be skipped.
            </p>
          )}
          <Button onClick={handleCommit} disabled={isPending || committableCount === 0}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Importing…
              </>
            ) : (
              `Commit ${committableCount} row${committableCount !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
