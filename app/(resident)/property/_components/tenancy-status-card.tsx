import { format } from 'date-fns'
import { Prisma } from '@prisma/client'
import { KAmount } from '@/components/admin/k-amount'
import { Check, Clock } from 'lucide-react'

interface TenancyCyclePayment {
  id: string
  cycleNumber: number
  amount: Prisma.Decimal
  paidAt: Date
}

interface TenancyStatusCardProps {
  cycle: string
  cyclePayment: Prisma.Decimal | string | number
  contractDate: Date
  cyclePayments: TenancyCyclePayment[]
}

export function TenancyStatusCard({
  cycle,
  cyclePayment,
  contractDate,
  cyclePayments,
}: TenancyStatusCardProps) {
  const latestCycle = cyclePayments[0]

  return (
    <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-5">
      <h3 className="font-heading text-base text-karis-green-900 mb-4">Rental status</h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-body text-xs text-karis-stone-500">Payment cycle</span>
          <span className="font-body text-sm text-karis-stone-900 capitalize">{cycle}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-body text-xs text-karis-stone-500">Amount per cycle</span>
          <KAmount amount={cyclePayment} className="font-body text-sm text-karis-stone-900" />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-body text-xs text-karis-stone-500">Start date</span>
          <span className="font-body text-sm text-karis-stone-900">
            {format(new Date(contractDate), 'dd MMM yyyy')}
          </span>
        </div>
      </div>

      {cyclePayments.length > 0 && (
        <div className="mt-5">
          <p className="font-body text-xs text-karis-stone-500 uppercase tracking-widest mb-2">
            Recent payments
          </p>
          <div className="space-y-2">
            {cyclePayments.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 py-2 px-3 bg-status-green/5 rounded-xl"
              >
                <div className="w-5 h-5 rounded-full bg-status-green flex items-center justify-center shrink-0">
                  <Check size={10} className="text-white" strokeWidth={3} />
                </div>
                <span className="font-body text-xs text-karis-stone-700 flex-1">
                  Cycle #{p.cycleNumber} — {format(new Date(p.paidAt), 'dd MMM yyyy')}
                </span>
                <KAmount amount={p.amount} className="font-body text-xs text-karis-stone-900" />
              </div>
            ))}
          </div>
        </div>
      )}

      {cyclePayments.length === 0 && (
        <div className="mt-4 flex items-center gap-2 py-3 px-4 bg-karis-stone-50 rounded-xl">
          <Clock size={15} className="text-karis-stone-400" />
          <p className="font-body text-sm text-karis-stone-500">No payments recorded yet</p>
        </div>
      )}
    </div>
  )
}
