'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { JsonDiffView } from './json-diff-view'

interface AuditLogRow {
  id: string
  action: string
  entity: string
  entityId: string | null
  actorId: string
  before: unknown
  after: unknown
  createdAt: Date
}

interface AuditTableProps {
  logs: AuditLogRow[]
}

const ENTITY_COLORS: Record<string, string> = {
  User: 'bg-karis-green-100 text-karis-green-900',
  Property: 'bg-karis-gold-300/30 text-karis-gold-700',
  Attachment: 'bg-karis-stone-100 text-karis-stone-700',
  Transaction: 'bg-blue-50 text-blue-700',
  AuditLog: 'bg-purple-50 text-purple-700',
}

export function AuditTable({ logs }: AuditTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-karis-stone-200 bg-white p-12 text-center">
        <p className="font-body text-sm text-karis-stone-400">No audit log entries match your filters.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-karis-stone-200 bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-karis-stone-50">
            <TableHead className="w-6" />
            <TableHead className="font-body text-xs text-karis-stone-500 font-semibold uppercase tracking-wider">
              Time
            </TableHead>
            <TableHead className="font-body text-xs text-karis-stone-500 font-semibold uppercase tracking-wider">
              Actor ID
            </TableHead>
            <TableHead className="font-body text-xs text-karis-stone-500 font-semibold uppercase tracking-wider">
              Action
            </TableHead>
            <TableHead className="font-body text-xs text-karis-stone-500 font-semibold uppercase tracking-wider">
              Entity
            </TableHead>
            <TableHead className="font-body text-xs text-karis-stone-500 font-semibold uppercase tracking-wider">
              Entity ID
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const isOpen = expanded.has(log.id)
            const entityColor = ENTITY_COLORS[log.entity] ?? 'bg-karis-stone-100 text-karis-stone-700'

            return (
              <>
                <TableRow
                  key={log.id}
                  className="cursor-pointer hover:bg-karis-stone-50/60 transition-colors"
                  onClick={() => toggle(log.id)}
                >
                  <TableCell className="py-2 pl-4 pr-0">
                    {isOpen
                      ? <ChevronDown className="h-3.5 w-3.5 text-karis-stone-400" />
                      : <ChevronRight className="h-3.5 w-3.5 text-karis-stone-400" />}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-karis-stone-600 tabular-nums py-2.5">
                    {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-karis-stone-500 py-2.5 max-w-[140px] truncate">
                    {log.actorId}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <span className="font-mono text-xs font-semibold text-karis-green-800">
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${entityColor}`}>
                      {log.entity}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-karis-stone-400 py-2.5 max-w-[140px] truncate">
                    {log.entityId ?? '—'}
                  </TableCell>
                </TableRow>

                {isOpen && (
                  <TableRow key={`${log.id}-detail`} className="bg-karis-stone-50/50">
                    <TableCell colSpan={6} className="px-6 pb-4 pt-0">
                      <JsonDiffView before={log.before} after={log.after} />
                    </TableCell>
                  </TableRow>
                )}
              </>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
