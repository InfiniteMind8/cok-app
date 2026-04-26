'use client'

import { useState } from 'react'
import { format, formatDistance } from 'date-fns'
import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

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

interface Reply {
  id: string
  authorId: string
  message: string
  createdAt: Date
}

interface Issue {
  id: string
  category: string
  message: string
  seriousness: string
  urgency: string
  status: string
  createdAt: Date
  replies: Reply[]
}

function IssueThreadSheet({ issue, onClose }: { issue: Issue | null; onClose: () => void }) {
  const now = new Date()

  if (!issue) return null

  return (
    <Sheet open={true} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto flex flex-col">
        <SheetHeader className="mb-4">
          <SheetTitle className="font-heading text-karis-green-900">Issue thread</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {/* Meta */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge className={`font-body text-xs ${levelColors[issue.seriousness] ?? ''}`} variant="secondary">
                {issue.seriousness.charAt(0) + issue.seriousness.slice(1).toLowerCase()} seriousness
              </Badge>
              <Badge className={`font-body text-xs ${statusColors[issue.status] ?? ''}`} variant="secondary">
                {issue.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="font-body text-xs text-karis-stone-500">
              {issue.category} · Raised {format(new Date(issue.createdAt), 'dd MMM yyyy')}
            </p>
          </div>

          {/* Original message */}
          <div className="bg-karis-stone-50 rounded-xl p-4">
            <p className="font-body text-[10px] text-karis-stone-400 mb-1.5 uppercase tracking-wider">
              Your message
            </p>
            <p className="font-body text-sm text-karis-stone-900 whitespace-pre-wrap leading-relaxed">
              {issue.message}
            </p>
          </div>

          {/* Replies */}
          {issue.replies.length === 0 ? (
            <div className="text-center py-8">
              <p className="font-body text-sm text-karis-stone-400">
                No replies yet. The Admin team will respond shortly.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="font-body text-xs text-karis-stone-400 uppercase tracking-wider">
                Admin replies
              </p>
              {issue.replies.map((r) => {
                const replyDate = new Date(r.createdAt)
                const daysAgo = (now.getTime() - replyDate.getTime()) / (1000 * 60 * 60 * 24)
                const dateLabel =
                  daysAgo < 7
                    ? formatDistance(replyDate, now, { addSuffix: true })
                    : format(replyDate, 'dd MMM yyyy')
                return (
                  <div key={r.id} className="bg-white border border-karis-stone-100 rounded-xl p-4">
                    <p className="font-body text-sm text-karis-stone-900 whitespace-pre-wrap leading-relaxed">
                      {r.message}
                    </p>
                    <p className="font-body text-[10px] text-karis-stone-400 mt-2">{dateLabel}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function MyIssuesList({ issues }: { issues: Issue[] }) {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const now = new Date()

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle size={40} strokeWidth={1.25} className="text-karis-stone-300 mb-4" />
        <h3 className="font-heading text-lg text-karis-green-900 mb-1">No issues yet</h3>
        <p className="font-body text-sm text-karis-stone-500 max-w-xs">
          Issues you raise will appear here. Use the button in the Community tab to report a concern.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm divide-y divide-karis-stone-100">
        {issues.map((issue) => {
          const date = new Date(issue.createdAt)
          const daysAgo = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
          const dateLabel =
            daysAgo < 7
              ? formatDistance(date, now, { addSuffix: true })
              : format(date, 'dd MMM yyyy')

          return (
            <button
              key={issue.id}
              onClick={() => setSelectedIssue(issue)}
              className="w-full text-left p-4 min-h-[64px] hover:bg-karis-stone-50 transition-colors duration-150 first:rounded-t-2xl last:rounded-b-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        issue.status === 'OPEN'
                          ? 'bg-karis-stone-400'
                          : issue.status === 'IN_PROGRESS'
                            ? 'bg-karis-gold-500'
                            : issue.status === 'RESOLVED'
                              ? 'bg-status-green'
                              : 'bg-karis-stone-300'
                      }`}
                    />
                    <p className="font-body text-sm text-karis-stone-900 font-medium truncate">
                      {issue.category}
                    </p>
                    {issue.replies.length > 0 && (
                      <span className="font-body text-[10px] bg-karis-green-900/10 text-karis-green-900 px-1.5 py-0.5 rounded-full shrink-0">
                        {issue.replies.length} {issue.replies.length === 1 ? 'reply' : 'replies'}
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-karis-stone-500 line-clamp-1">{issue.message}</p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge
                    className={`font-body text-[10px] ${statusColors[issue.status] ?? ''}`}
                    variant="secondary"
                  >
                    {issue.status.replace('_', ' ')}
                  </Badge>
                  <p className="font-body text-[10px] text-karis-stone-400 mt-1">{dateLabel}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {selectedIssue && (
        <IssueThreadSheet issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
      )}
    </>
  )
}
