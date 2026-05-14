'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Check } from 'lucide-react'
import { Prisma } from '@/lib/prisma-shim'
import { cn } from '@/lib/utils'
import { KAmount } from '@/components/admin/k-amount'
import { InstallmentNodeSheet } from './installment-node-sheet'

interface InstallmentItem {
  id: string
  number: number
  dueDate: Date
  amount: Prisma.Decimal
  progressNote: string | null
  payments: { amount: Prisma.Decimal; proofUrl: string | null; paidAt: Date }[]
}

interface MilestoneStripProps {
  installments: InstallmentItem[]
  paidPct: Prisma.Decimal | string | number
  paidAmount: Prisma.Decimal | string | number
  totalPrice: Prisma.Decimal | string | number
  outstanding: Prisma.Decimal | string | number
  nextInstallment: {
    number: number
    dueDate: Date
    amount: Prisma.Decimal
  } | null
  propertyCode: string
}

export function MilestoneStrip({
  installments,
  paidPct,
  paidAmount,
  totalPrice,
  outstanding,
  nextInstallment,
  propertyCode,
}: MilestoneStripProps) {
  const [selectedInstallment, setSelectedInstallment] = useState<InstallmentItem | null>(null)

  const pct = parseFloat(paidPct.toString())
  const firstUnpaidIndex = installments.findIndex((inst) => inst.payments.length === 0)

  const getNodeState = (inst: InstallmentItem, index: number) => {
    if (inst.payments.length > 0) return 'paid'
    if (index === firstUnpaidIndex) return 'current'
    return 'upcoming'
  }

  return (
    <>
      <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-5">
        <h3 className="font-heading text-base text-karis-green-900 mb-5">Installment progress</h3>

        {/* Timeline strip */}
        <div
          className="relative overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="flex items-center min-w-max gap-0">
            {installments.map((inst, i) => {
              const state = getNodeState(inst, i)
              const isLast = i === installments.length - 1

              return (
                <div key={inst.id} className="flex items-center">
                  {/* Node column */}
                  <div className="flex flex-col items-center w-14">
                    <button
                      onClick={() => setSelectedInstallment(inst)}
                      className="focus:outline-none"
                      aria-label={`Installment #${inst.number} — ${state}`}
                    >
                      {/* Outer ring for current pulse */}
                      <div className={cn(
                        'relative flex items-center justify-center rounded-full',
                        state === 'current' && 'w-10 h-10 animate-pulse bg-karis-gold-500/20',
                        state !== 'current' && 'w-8 h-8',
                      )}>
                        {/* Inner circle */}
                        <div className={cn(
                          'rounded-full flex items-center justify-center shadow-sm',
                          state === 'paid' && 'w-8 h-8 bg-status-green',
                          state === 'current' && 'w-7 h-7 bg-karis-gold-500',
                          state === 'upcoming' && 'w-8 h-8 bg-karis-stone-200',
                        )}>
                          {state === 'paid' && (
                            <Check size={14} className="text-white" strokeWidth={3} />
                          )}
                          {state === 'current' && (
                            <span className="font-body text-[10px] font-semibold text-white leading-none">
                              {inst.number}
                            </span>
                          )}
                          {state === 'upcoming' && (
                            <span className="font-body text-[10px] text-karis-stone-500 leading-none">
                              {inst.number}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                    <span className={cn(
                      'font-body text-[10px] mt-1.5 tabular-nums leading-none',
                      state === 'paid' ? 'text-status-green' : state === 'current' ? 'text-karis-gold-700' : 'text-karis-stone-400',
                    )}>
                      #{inst.number}
                    </span>
                  </div>

                  {/* Connector line */}
                  {!isLast && (
                    <div className={cn(
                      'h-0.5 w-6 shrink-0 mb-4',
                      i < firstUnpaidIndex ? 'bg-status-green' : 'bg-karis-stone-200',
                    )} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Paid percentage — large and prominent */}
        <div className="text-center mt-5 mb-4">
          <p className="font-heading text-5xl text-karis-green-900 tabular-nums leading-none">
            {pct.toFixed(1)}%
          </p>
          <p className="font-body text-xs text-karis-stone-500 mt-1">paid</p>
          {nextInstallment && (
            <p className="font-body text-sm text-karis-stone-500 mt-2 max-w-xs mx-auto">
              {installments.find((i) => i.number === nextInstallment.number)?.progressNote}
            </p>
          )}
          {pct >= 100 && (
            <p className="font-body text-sm text-status-green mt-2 font-medium">
              Fully paid — congratulations
            </p>
          )}
        </div>

        {/* Financial stats */}
        <div className="border-t border-karis-stone-100 pt-4 space-y-3">
          <StatLine
            label="Total price"
            value={<KAmount amount={totalPrice} className="font-body text-sm text-karis-stone-900 tabular-nums" />}
          />
          <StatLine
            label="Paid to date"
            value={<KAmount amount={paidAmount} className="font-body text-sm text-status-green tabular-nums" />}
          />
          <StatLine
            label="Outstanding"
            value={<KAmount amount={outstanding} className="font-body text-sm text-karis-stone-700 tabular-nums" />}
          />
        </div>

        {/* Next installment */}
        {nextInstallment && (
          <div className="mt-4 bg-karis-stone-50 border border-karis-stone-100 rounded-xl px-4 py-3">
            <p className="font-body text-xs text-karis-stone-500 mb-1">Next installment</p>
            <div className="flex items-center justify-between">
              <p className="font-body text-sm text-karis-stone-900">
                #{nextInstallment.number} — due {format(new Date(nextInstallment.dueDate), 'dd MMM yyyy')}
              </p>
              <KAmount
                amount={nextInstallment.amount}
                className="font-body text-sm text-karis-green-900 tabular-nums"
              />
            </div>
          </div>
        )}
      </div>

      <InstallmentNodeSheet
        installment={selectedInstallment}
        propertyCode={propertyCode}
        open={selectedInstallment !== null}
        onClose={() => setSelectedInstallment(null)}
      />
    </>
  )
}

function StatLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-body text-xs text-karis-stone-500">{label}</span>
      {value}
    </div>
  )
}
