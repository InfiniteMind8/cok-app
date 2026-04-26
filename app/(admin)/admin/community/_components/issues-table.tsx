'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { AlertTriangle } from 'lucide-react'
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
import { IssueDetailSheet } from './issue-detail-sheet'

const levelColors: Record<string, string> = {
  YELLOW: 'bg-status-yellow/20 text-karis-stone-700',
  ORANGE: 'bg-status-orange/20 text-karis-stone-700',
  RED: 'bg-status-red/15 text-status-red',
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-karis-stone-100 text-karis-stone-700',
  IN_PROGRESS: 'bg-karis-gold-300/30 text-karis-gold-700',
  RESOLVED: 'bg-status-green/15 text-status-green',
  CLOSED: 'bg-karis-stone-100 text-karis-stone-500',
}

export interface IssueRow {
  id: string
  category: string
  message: string
  seriousness: string
  urgency: string
  status: string
  assigneeId?: string | null
  createdAt: Date
  reporter: { fullName: string; memberId: string; role: string }
  replies: { id: string; authorId: string; message: string; createdAt: Date }[]
}

interface IssuesTableProps {
  issues: IssueRow[]
}

export function IssuesTable({ issues }: IssuesTableProps) {
  const [selectedIssue, setSelectedIssue] = useState<IssueRow | null>(null)

  if (issues.length === 0) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No issues found"
        body="Issues raised by members will appear here."
      />
    )
  }

  return (
    <>
      <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-karis-stone-50">
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Reporter</TableHead>
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Category</TableHead>
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Seriousness</TableHead>
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Urgency</TableHead>
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Status</TableHead>
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Opened</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <TableRow
                key={issue.id}
                className="cursor-pointer hover:bg-karis-stone-50"
                onClick={() => setSelectedIssue(issue)}
              >
                <TableCell className="px-5">
                  <p className="font-body text-sm text-karis-stone-900">{issue.reporter.fullName}</p>
                  <p className="font-body text-xs text-karis-stone-500">{issue.reporter.role.toLowerCase()}</p>
                </TableCell>
                <TableCell className="px-5 font-body text-sm text-karis-stone-700">{issue.category}</TableCell>
                <TableCell className="px-5">
                  <Badge className={`font-body text-xs ${levelColors[issue.seriousness] ?? ''}`} variant="secondary">
                    {issue.seriousness}
                  </Badge>
                </TableCell>
                <TableCell className="px-5">
                  <Badge className={`font-body text-xs ${levelColors[issue.urgency] ?? ''}`} variant="secondary">
                    {issue.urgency}
                  </Badge>
                </TableCell>
                <TableCell className="px-5">
                  <Badge className={`font-body text-xs ${statusColors[issue.status] ?? ''}`} variant="secondary">
                    {issue.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 font-body text-sm text-karis-stone-500">
                  {format(issue.createdAt, 'dd MMM yyyy')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <IssueDetailSheet
        open={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        issue={selectedIssue}
      />
    </>
  )
}
