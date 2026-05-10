'use client'

import { useState } from 'react'
import { Megaphone, Vote, AlertTriangle, AlertOctagon, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DemoLocked } from '@/app/demo/_components/demo-locked'
import {
  DEMO_ANNOUNCEMENTS,
  DEMO_RESIDENT_PROPOSAL,
  type DemoAnnouncement,
} from '@/lib/demo/fixtures'

const SEVERITY_BADGE: Record<DemoAnnouncement['severity'], { label: string; className: string; Icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  INFO: {
    label: 'Info',
    className: 'bg-karis-stone-100 text-karis-stone-700',
    Icon: Info,
  },
  URGENT: {
    label: 'Urgent',
    className: 'bg-status-orange/10 text-status-orange',
    Icon: AlertTriangle,
  },
  CRITICAL: {
    label: 'Critical',
    className: 'bg-status-red/10 text-status-red',
    Icon: AlertOctagon,
  },
}

function formatTimeAgo(iso: string): string {
  const now = new Date('2026-05-08T22:22:00.000Z')
  const d = new Date(iso)
  const diffMs = now.getTime() - d.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days < 1) {
    const hours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)))
    return `${hours}h ago`
  }
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function DemoCommunityClient() {
  const proposal = DEMO_RESIDENT_PROPOSAL
  const [tempVote, setTempVote] = useState<'YES' | 'NO' | 'ABSTAIN' | null>(null)
  const totalVotes = proposal.yesCount + proposal.noCount + proposal.abstainCount
  const yesPct = Math.round((proposal.yesCount / totalVotes) * 100)
  const noPct = Math.round((proposal.noCount / totalVotes) * 100)
  const abstainPct = 100 - yesPct - noPct

  const closesIn = (() => {
    const now = new Date('2026-05-08T22:22:00.000Z').getTime()
    const close = new Date(proposal.closesAt).getTime()
    const days = Math.ceil((close - now) / (1000 * 60 * 60 * 24))
    return `${days} day${days === 1 ? '' : 's'} left`
  })()

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-6 pb-8">
      {/* Active vote */}
      <section>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Vote size={16} className="text-karis-green-700" aria-hidden="true" />
          <h2 className="font-heading text-base text-karis-green-900">Active vote</h2>
        </div>

        <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-karis-stone-100">
            <p className="font-heading text-base text-karis-green-900 leading-tight">
              {proposal.title}
            </p>
            <p className="font-body text-sm text-karis-stone-500 mt-2 leading-relaxed">
              {proposal.description}
            </p>
            <p className="font-body text-xs text-karis-stone-500 mt-3">
              Closes {new Date(proposal.closesAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {closesIn}
            </p>
          </div>

          <div className="px-5 py-4 space-y-3">
            <p className="font-body text-sm text-karis-stone-900">{proposal.question}</p>

            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between text-xs font-body text-karis-stone-500 mb-1">
                  <span>Yes ({proposal.yesCount})</span>
                  <span className="tabular-nums">{yesPct}%</span>
                </div>
                <div className="h-1.5 w-full bg-karis-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-status-green rounded-full"
                    style={{ width: `${yesPct}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs font-body text-karis-stone-500 mb-1">
                  <span>No ({proposal.noCount})</span>
                  <span className="tabular-nums">{noPct}%</span>
                </div>
                <div className="h-1.5 w-full bg-karis-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-status-red rounded-full"
                    style={{ width: `${noPct}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs font-body text-karis-stone-500 mb-1">
                  <span>Abstain ({proposal.abstainCount})</span>
                  <span className="tabular-nums">{abstainPct}%</span>
                </div>
                <div className="h-1.5 w-full bg-karis-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-karis-stone-300 rounded-full"
                    style={{ width: `${abstainPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3">
              {(['YES', 'NO', 'ABSTAIN'] as const).map((choice) => (
                <DemoLocked key={choice}>
                  <button
                    type="button"
                    onMouseEnter={() => setTempVote(choice)}
                    onMouseLeave={() => setTempVote(null)}
                    className={cn(
                      'font-body text-xs py-2 rounded-md min-h-[36px] border transition-colors',
                      tempVote === choice
                        ? 'border-karis-green-900 bg-karis-green-900 text-white'
                        : 'border-karis-stone-300 text-karis-stone-700 hover:border-karis-green-700',
                    )}
                  >
                    {choice === 'YES' ? 'Yes' : choice === 'NO' ? 'No' : 'Abstain'}
                  </button>
                </DemoLocked>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Announcements */}
      <section>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Megaphone size={16} className="text-karis-green-700" aria-hidden="true" />
          <h2 className="font-heading text-base text-karis-green-900">Announcements</h2>
        </div>
        <div className="space-y-3">
          {DEMO_ANNOUNCEMENTS.map((ann) => {
            const sev = SEVERITY_BADGE[ann.severity]
            return (
              <article
                key={ann.id}
                className="bg-white border border-karis-stone-100 rounded-xl shadow-sm p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-heading text-base text-karis-green-900 leading-tight">
                    {ann.title}
                  </h3>
                  <span
                    className={cn(
                      'shrink-0 inline-flex items-center gap-1 font-body text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full',
                      sev.className,
                    )}
                  >
                    <sev.Icon size={10} aria-hidden="true" />
                    {sev.label}
                  </span>
                </div>
                <p className="font-body text-sm text-karis-stone-700 leading-relaxed">
                  {ann.body}
                </p>
                <div className="mt-3 flex items-center justify-between font-body text-xs text-karis-stone-500">
                  <span>{ann.authorName}</span>
                  <span>{formatTimeAgo(ann.publishedAt)}</span>
                </div>
                <DemoLocked>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 font-body text-xs"
                  >
                    Acknowledge
                  </Button>
                </DemoLocked>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
