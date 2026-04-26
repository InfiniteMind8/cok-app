'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { format, formatDistance } from 'date-fns'
import { Check, Newspaper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { acknowledgeUpdateAction } from '@/app/(resident)/_actions/community'

interface Update {
  id: string
  category: string
  headline: string
  message: string
  photoUrl: string | null
  publishedAt: Date
  acknowledgements: { id: string }[]
}

interface UpdatesFeedProps {
  updates: Update[]
}

export function UpdatesFeed({ updates }: UpdatesFeedProps) {
  if (updates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Newspaper size={40} strokeWidth={1.25} className="text-karis-stone-300 mb-4" />
        <h3 className="font-heading text-lg text-karis-green-900 mb-1">No updates yet</h3>
        <p className="font-body text-sm text-karis-stone-500 max-w-xs">
          No community updates yet. Check back soon.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {updates.map((update) => (
        <UpdateCard key={update.id} update={update} />
      ))}
    </div>
  )
}

function UpdateCard({ update }: { update: Update }) {
  const [expanded, setExpanded] = useState(false)
  const [acknowledged, setAcknowledged] = useState(update.acknowledgements.length > 0)
  const [isPending, startTransition] = useTransition()

  const now = new Date()
  const pubDate = new Date(update.publishedAt)
  const daysAgo = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24)
  const dateLabel =
    daysAgo < 7
      ? formatDistance(pubDate, now, { addSuffix: true })
      : format(pubDate, 'dd MMM yyyy')

  const isLong = update.message.length > 200

  function handleAcknowledge() {
    if (acknowledged) return
    startTransition(async () => {
      try {
        await acknowledgeUpdateAction(update.id)
        setAcknowledged(true)
      } catch {
        toast.error('Failed to acknowledge update')
      }
    })
  }

  return (
    <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm overflow-hidden">
      {update.photoUrl && (
        <div className="relative w-full aspect-video">
          <Image
            src={update.photoUrl}
            alt={update.headline}
            fill
            className="object-cover"
            sizes="(max-width: 512px) 100vw, 512px"
          />
        </div>
      )}

      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-body text-[10px] bg-karis-gold-300/40 text-karis-gold-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
            {update.category}
          </span>
          <span className="font-body text-xs text-karis-stone-400">{dateLabel}</span>
        </div>

        <h3 className="font-heading text-base text-karis-green-900 leading-snug">
          {update.headline}
        </h3>

        <p className="font-body text-sm text-karis-stone-700 leading-relaxed">
          {isLong && !expanded ? `${update.message.slice(0, 200)}…` : update.message}
        </p>

        {isLong && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="font-body text-sm text-karis-green-700 hover:text-karis-green-900 transition-colors duration-150"
          >
            {expanded ? 'Read less' : 'Read more'}
          </button>
        )}

        <Button
          onClick={handleAcknowledge}
          disabled={acknowledged || isPending}
          variant={acknowledged ? 'outline' : 'default'}
          className={`w-full font-body text-sm min-h-[44px] mt-2 gap-2 transition-colors duration-150 ${acknowledged ? 'border-status-green text-status-green' : 'bg-karis-green-900 text-white'}`}
        >
          {acknowledged && <Check size={15} />}
          {acknowledged ? 'Acknowledged' : isPending ? 'Acknowledging…' : 'Acknowledge'}
        </Button>
      </div>
    </div>
  )
}
