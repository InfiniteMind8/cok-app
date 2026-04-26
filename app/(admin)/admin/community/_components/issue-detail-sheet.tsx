'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { replyToIssueAction, updateIssueStatusAction, assignIssueAction } from '@/app/(admin)/_actions/community'
import { format } from 'date-fns'
import { IssueStatus } from '@prisma/client'

interface Reply {
  id: string
  authorId: string
  message: string
  createdAt: Date
}

interface IssueDetailSheetProps {
  open: boolean
  onClose: () => void
  issue: {
    id: string
    category: string
    message: string
    seriousness: string
    urgency: string
    status: string
    assigneeId?: string | null
    createdAt: Date
    reporter: { fullName: string; memberId: string; role: string }
    replies: Reply[]
  } | null
}

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

export function IssueDetailSheet({ open, onClose, issue }: IssueDetailSheetProps) {
  const [reply, setReply] = useState('')
  const [isAssigned, setIsAssigned] = useState(!!issue?.assigneeId)
  const [replyPending, startReplyTransition] = useTransition()
  const [statusPending, startStatusTransition] = useTransition()
  const [assignPending, startAssignTransition] = useTransition()

  // Keep local assigned state in sync when issue changes
  const currentlyAssigned = isAssigned || !!issue?.assigneeId

  if (!issue) return null

  function handleReply() {
    if (!reply.trim() || !issue) return
    startReplyTransition(async () => {
      try {
        await replyToIssueAction(issue.id, reply)
        toast.success('Reply posted')
        setReply('')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  function handleStatusChange(newStatus: string) {
    if (!issue) return
    startStatusTransition(async () => {
      try {
        await updateIssueStatusAction(issue.id, newStatus as IssueStatus)
        toast.success(`Issue marked ${newStatus.replace('_', ' ')}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  function handleAssign() {
    if (!issue || currentlyAssigned) return
    startAssignTransition(async () => {
      try {
        await assignIssueAction(issue.id)
        setIsAssigned(true)
        toast.success('Issue assigned to you')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) { onClose(); setIsAssigned(false) } }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col">
        <SheetHeader className="mb-4">
          <SheetTitle className="font-heading text-karis-green-900">Issue details</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto pr-1">
          {/* Meta */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge className={`font-body text-xs ${levelColors[issue.seriousness] ?? ''}`} variant="secondary">
                Seriousness: {issue.seriousness}
              </Badge>
              <Badge className={`font-body text-xs ${levelColors[issue.urgency] ?? ''}`} variant="secondary">
                Urgency: {issue.urgency}
              </Badge>
              <Badge className={`font-body text-xs ${statusColors[issue.status] ?? ''}`} variant="secondary">
                {issue.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-xs font-body text-karis-stone-500">
              {issue.category} · Reported by {issue.reporter.fullName} ({issue.reporter.memberId} · {issue.reporter.role.toLowerCase()}) · {format(issue.createdAt, 'dd MMM yyyy')}
            </p>
          </div>

          {/* Issue message */}
          <div className="bg-karis-stone-50 rounded-lg p-4">
            <p className="font-body text-sm text-karis-stone-900 whitespace-pre-wrap">{issue.message}</p>
          </div>

          {/* Replies */}
          {issue.replies.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-body text-karis-stone-500 uppercase tracking-wider">
                Replies ({issue.replies.length})
              </p>
              {issue.replies.map((r) => (
                <div key={r.id} className="bg-white border border-karis-stone-100 rounded-lg p-3">
                  <p className="font-body text-sm text-karis-stone-900 whitespace-pre-wrap">{r.message}</p>
                  <p className="text-xs font-body text-karis-stone-400 mt-1.5">
                    {format(r.createdAt, 'dd MMM yyyy · HH:mm')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reply + status + assign */}
        <div className="border-t border-karis-stone-100 pt-4 space-y-3 mt-4">
          <div className="space-y-1.5">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply…"
              className="font-body text-sm resize-none"
              rows={3}
            />
            <Button
              size="sm"
              className="w-full font-body text-sm"
              onClick={handleReply}
              disabled={replyPending || !reply.trim()}
            >
              {replyPending ? 'Posting…' : 'Post reply'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-body text-karis-stone-500 shrink-0">Update status:</span>
            <Select onValueChange={(v: string | null) => { if (v !== null) handleStatusChange(v) }} disabled={statusPending}>
              <SelectTrigger className="font-body text-sm flex-1 h-8">
                <SelectValue placeholder={issue.status.replace('_', ' ')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN" className="font-body text-sm">Open</SelectItem>
                <SelectItem value="IN_PROGRESS" className="font-body text-sm">In progress</SelectItem>
                <SelectItem value="RESOLVED" className="font-body text-sm">Resolved</SelectItem>
                <SelectItem value="CLOSED" className="font-body text-sm">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full font-body text-sm border-karis-stone-200 text-karis-stone-700 disabled:opacity-50"
            onClick={handleAssign}
            disabled={currentlyAssigned || assignPending}
          >
            {currentlyAssigned ? 'Assigned' : assignPending ? 'Assigning…' : 'Assign to me'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
