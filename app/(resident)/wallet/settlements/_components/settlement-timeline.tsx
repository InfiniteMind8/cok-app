'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Check, Clock, X, Ban, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { Prisma } from '@prisma/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { residentWalletApi, getBrowserApi, type SettlementStatus } from '@/lib/api'
import type { SettlementRequestRow } from '@/lib/api/resident'

const STATUS_CONFIG: Record<
  SettlementStatus,
  { label: string; dotClass: string; icon: React.ComponentType<{ size?: number }> }
> = {
  PENDING_APPROVAL: { label: 'Pending approval', dotClass: 'bg-status-yellow', icon: Clock },
  APPROVED: { label: 'Approved', dotClass: 'bg-status-green', icon: Check },
  DECLINED: { label: 'Declined', dotClass: 'bg-status-red', icon: X },
  SETTLED: { label: 'Settled', dotClass: 'bg-status-green', icon: Check },
  CANCELLED: { label: 'Cancelled', dotClass: 'bg-karis-stone-300', icon: Ban },
}

interface SettlementRowProps {
  request: SettlementRequestRow
}

export function SettlementRow({ request }: SettlementRowProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()

  const config = STATUS_CONFIG[request.status]

  const amount = new Prisma.Decimal(request.amount)
  const formatted = amount.toFixed(2)
  const [int, dec] = formatted.split('.')
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  function handleCancel() {
    startTransition(async () => {
      try {
        await residentWalletApi.cancelSettlement(getBrowserApi(), request.id)
        toast.success('Settlement request cancelled')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to cancel request')
      }
    })
  }

  return (
    <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left min-h-[44px] hover:bg-karis-stone-50 transition-colors duration-150"
      >
        <div className={cn('w-2 h-2 rounded-full shrink-0 mt-0.5', config.dotClass)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-body text-sm text-karis-stone-900 tabular-nums">
              <span className="text-karis-gold-700">K </span>
              {withCommas}.{dec}
            </span>
            <span className="font-body text-xs text-karis-stone-500">— {config.label}</span>
          </div>
          {request.purpose && (
            <p className="font-body text-xs text-karis-stone-500 truncate mt-0.5">
              {request.purpose}
            </p>
          )}
        </div>
        <div className="shrink-0 text-karis-stone-400">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-karis-stone-100 px-4 py-4 space-y-4">
          {/* Timeline */}
          <div className="space-y-2">
            <TimelineStep
              label="Submitted"
              date={request.createdAt}
              done
            />
            <TimelineStep
              label="Approved by Admin"
              date={request.approvedAt}
              done={!!request.approvedAt}
              skipped={request.status === 'DECLINED' || request.status === 'CANCELLED'}
            />
            {request.declinedReason && (
              <div className="ml-6 text-xs font-body text-status-red">
                Reason: {request.declinedReason}
              </div>
            )}
            <TimelineStep
              label="Settled by Treasury"
              date={request.settledAt}
              done={!!request.settledAt}
              skipped={['DECLINED', 'CANCELLED', 'PENDING_APPROVAL', 'APPROVED'].includes(request.status) && !request.settledAt}
            />
          </div>

          {request.proofUrl && (
            <a
              href={request.proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-body text-xs text-karis-green-700 hover:underline"
            >
              <ExternalLink size={13} />
              View proof of payment
            </a>
          )}

          {request.status === 'PENDING_APPROVAL' && (
            <Button
              onClick={handleCancel}
              disabled={isPending}
              variant="outline"
              className="w-full font-body text-sm border-status-red text-status-red hover:bg-status-red/5 min-h-[44px]"
            >
              {isPending ? 'Cancelling…' : 'Cancel request'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function TimelineStep({
  label,
  date,
  done,
  skipped = false,
}: {
  label: string
  date: Date | string | null | undefined
  done: boolean
  skipped?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center',
          done && !skipped ? 'border-status-green bg-status-green' : 'border-karis-stone-300 bg-white',
          skipped && 'border-karis-stone-200',
        )}
      >
        {done && !skipped && <Check size={9} className="text-white" strokeWidth={3} />}
      </div>
      <div className="flex-1">
        <span className={cn('font-body text-xs', done && !skipped ? 'text-karis-stone-900' : 'text-karis-stone-400')}>
          {label}
        </span>
        {date && (
          <span className="font-body text-xs text-karis-stone-400 ml-2">
            {format(new Date(date), 'dd MMM yyyy, HH:mm')}
          </span>
        )}
      </div>
    </div>
  )
}
