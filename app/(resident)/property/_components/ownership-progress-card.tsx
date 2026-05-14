import { Prisma } from '@/lib/prisma-shim'
import { format } from 'date-fns'
import { KAmount } from '@/components/admin/k-amount'

interface OwnershipProgressCardProps {
  paidPct: Prisma.Decimal | string | number
  paidAmount: Prisma.Decimal | string | number
  totalPrice: Prisma.Decimal | string | number
  outstanding: Prisma.Decimal | string | number
  nextInstallment: {
    number: number
    dueDate: Date
    amount: Prisma.Decimal
  } | null
}

export function OwnershipProgressCard({
  paidPct,
  paidAmount,
  totalPrice,
  outstanding,
  nextInstallment,
}: OwnershipProgressCardProps) {
  const pct = parseFloat(paidPct.toString())
  const clamped = Math.min(Math.max(pct, 0), 100)

  const radius = 44
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (clamped / 100) * circumference

  return (
    <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-5">
      <h3 className="font-heading text-base text-karis-green-900 mb-5">Ownership progress</h3>

      <div className="flex items-center gap-6 mb-5">
        {/* Circular progress */}
        <div className="relative shrink-0">
          <svg width="108" height="108" viewBox="0 0 108 108">
            <circle
              cx="54"
              cy="54"
              r={radius}
              fill="none"
              stroke="#EDE8E3"
              strokeWidth="8"
            />
            <circle
              cx="54"
              cy="54"
              r={radius}
              fill="none"
              stroke="#1E2E23"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 54 54)"
              style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-heading text-xl text-karis-green-900 tabular-nums leading-none">
              {clamped.toFixed(1)}%
            </span>
            <span className="font-body text-[10px] text-karis-stone-500 mt-0.5">paid</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-3">
          <StatLine label="Total price" value={<KAmount amount={totalPrice} className="font-body text-sm text-karis-stone-900" />} />
          <StatLine label="Paid to date" value={<KAmount amount={paidAmount} className="font-body text-sm text-status-green" />} />
          <StatLine label="Outstanding" value={<KAmount amount={outstanding} className="font-body text-sm text-karis-stone-700" />} />
        </div>
      </div>

      {nextInstallment && (
        <div className="bg-karis-stone-50 border border-karis-stone-100 rounded-xl px-4 py-3">
          <p className="font-body text-xs text-karis-stone-500 mb-1">Next installment</p>
          <div className="flex items-center justify-between">
            <p className="font-body text-sm text-karis-stone-900">
              #{nextInstallment.number} — due {format(new Date(nextInstallment.dueDate), 'dd MMM yyyy')}
            </p>
            <KAmount amount={nextInstallment.amount} className="font-body text-sm text-karis-green-900" />
          </div>
        </div>
      )}

      {!nextInstallment && pct >= 100 && (
        <div className="bg-status-green/10 border border-status-green/20 rounded-xl px-4 py-3">
          <p className="font-body text-sm text-status-green text-center font-medium">
            Fully paid — congratulations
          </p>
        </div>
      )}
    </div>
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
