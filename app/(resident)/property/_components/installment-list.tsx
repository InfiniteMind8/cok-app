'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp, Check, Clock, Calendar, ExternalLink } from 'lucide-react'
import { Prisma } from '@/lib/prisma-shim'
import { cn } from '@/lib/utils'
import { KAmount } from '@/components/admin/k-amount'

interface Installment {
  id: string
  number: number
  dueDate: Date
  amount: Prisma.Decimal
  progressNote?: string | null
  payments: { amount: Prisma.Decimal; proofUrl?: string | null }[]
}

interface InstallmentListProps {
  installments: Installment[]
}

export function InstallmentList({ installments }: InstallmentListProps) {
  const [expanded, setExpanded] = useState(false)
  const now = new Date()

  const visible = expanded ? installments : installments.slice(0, 3)

  return (
    <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-5">
      <h3 className="font-heading text-base text-karis-green-900 mb-4">Installment schedule</h3>

      <div className="space-y-2">
        {visible.map((inst) => {
          const isPaid = inst.payments.length > 0
          const isDue = !isPaid && new Date(inst.dueDate) < now
          const proofUrl = inst.payments[0]?.proofUrl

          return (
            <div
              key={inst.id}
              className={cn(
                'flex items-center gap-3 py-2.5 px-3 rounded-xl',
                isPaid ? 'bg-status-green/5' : isDue ? 'bg-status-red/5' : 'bg-karis-stone-50',
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                  isPaid ? 'bg-status-green' : isDue ? 'bg-status-red' : 'bg-karis-stone-200',
                )}
              >
                {isPaid ? (
                  <Check size={12} className="text-white" strokeWidth={3} />
                ) : isDue ? (
                  <Clock size={12} className="text-white" />
                ) : (
                  <Calendar size={12} className="text-karis-stone-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-body text-sm text-karis-stone-900">#{inst.number}</span>
                  <span
                    className={cn(
                      'font-body text-[10px] uppercase tracking-wide',
                      isPaid ? 'text-status-green' : isDue ? 'text-status-red' : 'text-karis-stone-400',
                    )}
                  >
                    {isPaid ? 'Paid' : isDue ? 'Due' : 'Upcoming'}
                  </span>
                </div>
                <p className="font-body text-xs text-karis-stone-500">
                  {format(new Date(inst.dueDate), 'dd MMM yyyy')}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <KAmount amount={inst.amount} className="font-body text-sm text-karis-stone-900" />
                {proofUrl && (
                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-karis-stone-400 hover:text-karis-green-700 transition-colors duration-150"
                  >
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {installments.length > 3 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 mt-3 font-body text-sm text-karis-green-700 hover:text-karis-green-900 transition-colors duration-150 min-h-[44px]"
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {expanded ? 'Show less' : `Show all ${installments.length} installments`}
        </button>
      )}
    </div>
  )
}
