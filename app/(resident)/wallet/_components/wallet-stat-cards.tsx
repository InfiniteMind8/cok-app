import { KAmount } from '@/components/admin/k-amount'
import { Prisma } from '@prisma/client'

interface StatCardProps {
  label: string
  amount: Prisma.Decimal | string | number
  tooltip: string
}

function StatCard({ label, amount, tooltip }: StatCardProps) {
  return (
    <div
      className="bg-white border border-karis-stone-100 rounded-xl p-4 shadow-sm"
      title={tooltip}
    >
      <p className="font-body text-[10px] text-karis-stone-500 uppercase tracking-widest mb-1">
        {label}
      </p>
      <KAmount amount={amount} className="font-heading text-lg text-karis-green-900" />
    </div>
  )
}

interface WalletStatCardsProps {
  totalDeposited: Prisma.Decimal | string | number
  totalEarned: Prisma.Decimal | string | number
  totalEligibleForConversion: Prisma.Decimal | string | number
}

export function WalletStatCards({
  totalDeposited,
  totalEarned,
  totalEligibleForConversion,
}: WalletStatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <StatCard
        label="Total deposited"
        amount={totalDeposited}
        tooltip="Total K Credits received from Admin deposits"
      />
      <StatCard
        label="Total earned"
        amount={totalEarned}
        tooltip="K Credits earned from purchases, trades, payroll, and transfers"
      />
      <StatCard
        label="Eligible for conversion"
        amount={totalEligibleForConversion}
        tooltip="K Credits that have been approved for settlement back to fiat"
      />
    </div>
  )
}
