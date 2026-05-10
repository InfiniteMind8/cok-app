'use client'

import { useState, useTransition } from 'react'
import { Vote } from 'lucide-react'
import { toast } from 'sonner'
import { residentCommunityApi, getBrowserApi } from '@/lib/api'
import { cn } from '@/lib/utils'

interface VoteOption {
  id: string
  label: string
  description: string
  _count: { submissions: number }
}

interface VoteCardProps {
  voteId: string
  headline: string
  description: string
  isOpen: boolean
  options: VoteOption[]
  totalVotes: number
  userVotedOptionId: string | null
}

export function VoteCard({
  voteId,
  headline,
  description,
  isOpen,
  options,
  totalVotes,
  userVotedOptionId: initialVotedOptionId,
}: VoteCardProps) {
  const [votedOptionId, setVotedOptionId] = useState<string | null>(initialVotedOptionId)
  const [localTotalVotes, setLocalTotalVotes] = useState(totalVotes)
  const [isPending, startTransition] = useTransition()

  const hasVoted = votedOptionId !== null
  const showResults = hasVoted || !isOpen

  function handleVote(optionId: string) {
    if (hasVoted || isPending || !isOpen) return
    startTransition(async () => {
      try {
        await residentCommunityApi.castVote(getBrowserApi(), voteId, optionId)
        setVotedOptionId(optionId)
        setLocalTotalVotes((v) => v + 1)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to submit vote')
      }
    })
  }

  return (
    <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-5">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-heading text-base text-karis-green-900 leading-snug">
          {headline}
        </h3>
        {!isOpen && (
          <span className="shrink-0 font-body text-[10px] bg-karis-stone-100 text-karis-stone-500 px-2 py-0.5 rounded-full uppercase tracking-wide">
            Closed
          </span>
        )}
      </div>
      <p className="font-body text-sm text-karis-stone-500 mb-4 leading-relaxed">{description}</p>

      <div className="space-y-2">
        {options.map((option) => {
          const count = option._count.submissions + (votedOptionId === option.id && !initialVotedOptionId ? 1 : 0)
          const pct = localTotalVotes > 0 ? Math.round((count / localTotalVotes) * 100) : 0
          const isMyVote = votedOptionId === option.id

          if (!showResults) {
            return (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={isPending}
                className="w-full text-left px-4 py-3 rounded-xl border border-karis-stone-200 hover:border-karis-green-900 hover:bg-karis-green-900/5 transition-colors duration-150 min-h-[44px]"
              >
                <p className="font-body text-sm text-karis-stone-900">{option.label}</p>
                {option.description && (
                  <p className="font-body text-xs text-karis-stone-500 mt-0.5">{option.description}</p>
                )}
              </button>
            )
          }

          return (
            <div key={option.id} className={cn('rounded-xl p-3', isMyVote ? 'bg-karis-green-900/[0.08] border border-karis-green-900/20' : 'bg-karis-stone-50')}>
              <div className="flex items-center justify-between mb-1.5">
                <p className={cn('font-body text-sm', isMyVote ? 'text-karis-green-900 font-medium' : 'text-karis-stone-700')}>
                  {option.label}
                  {isMyVote && <span className="ml-2 text-[10px] text-karis-gold-700 uppercase tracking-wide">Your vote</span>}
                </p>
                <span className="font-body text-xs text-karis-stone-500 tabular-nums">{pct}%</span>
              </div>
              <div className="h-1.5 bg-karis-stone-200 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500 ease-out', isMyVote ? 'bg-karis-green-900' : 'bg-karis-stone-400')}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {showResults && (
        <p className="font-body text-xs text-karis-stone-400 mt-3 text-center">
          {localTotalVotes} {localTotalVotes === 1 ? 'vote' : 'votes'} cast
        </p>
      )}
    </div>
  )
}

export function VotingList({
  votes,
  pastVotes = [],
}: {
  votes: VoteCardProps[]
  pastVotes?: VoteCardProps[]
}) {
  if (votes.length === 0 && pastVotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Vote size={40} strokeWidth={1.25} className="text-karis-stone-300 mb-4" />
        <h3 className="font-heading text-lg text-karis-green-900 mb-1">No active votes</h3>
        <p className="font-body text-sm text-karis-stone-500 max-w-xs">
          No active votes. You will be notified when one opens.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {votes.length > 0 && (
        <div className="space-y-4">
          {votes.map((v) => (
            <VoteCard key={v.voteId} {...v} />
          ))}
        </div>
      )}

      {votes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Vote size={32} strokeWidth={1.25} className="text-karis-stone-300 mb-3" />
          <p className="font-body text-sm text-karis-stone-500">
            No active votes. You will be notified when one opens.
          </p>
        </div>
      )}

      {pastVotes.length > 0 && (
        <div className="space-y-3">
          <p className="font-body text-xs text-karis-stone-400 uppercase tracking-wider">
            Past votes
          </p>
          <div className="space-y-4">
            {pastVotes.map((v) => (
              <VoteCard key={v.voteId} {...v} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
