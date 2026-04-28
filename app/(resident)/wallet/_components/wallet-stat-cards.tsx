import { KAmount } from '@/components/admin/k-amount'
import { Prisma } from '@prisma/client'
import type { DisplayCurrencyCode } from '@/lib/currency/format-amount'
import type { RateMap } from '@/lib/currency/rate-resolver'

interface StatCardProps {
  label: string
  amount: Prisma.Decimal | string | number
  tooltip: string
  displayCurrency?: DisplayCurrencyCode
  rates?: RateMap
}

function StatCard({ label, amount, tooltip, displayCurrency, rates }: StatCardProps) {
  return (
    <div
      className="bg-white border border-karis-stone-100 rounded-xl p-4 shadow-sm"
      title={tooltip}
    >
      <p className="font-body text-[10px] text-karis-stone-500 uppercase tracking-widest mb-1">
        {label}
      </p>
      <KAmount
        amount={amount}
        className="font-heading text-lg text-karis-green-900"
        displayCurrency={displayCurrency}
        rates={rates}
      />
    </div>
  )
}

interface WalletStatCardsProps {
  totalDeposited: Prisma.Decimal | string | number
  totalEarned: Prisma.Decimal | string | number
  totalEligibleForConversion: Prisma.Decimal | string | number
  displayCurrency?: DisplayCurrencyCode
  rates?: RateMap
}

export function WalletStatCards({
  totalDeposited,
  totalEarned,
  totalEligibleForConversion,
  displayCurrency,
  rates,
}: WalletStatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <StatCard
        label="Total deposited"
        amount={totalDeposited}
        tooltip="Total K Credits received from Admin deposits"
        displayCurrency={displayCurrency}
        rates={rates}
      />
      <StatCard
        label="Total earned"
        amount={totalEarned}
        tooltip="K Credits earned from purchases, trades, payroll, and transfers"
        displayCurrency={displayCurrency}
        rates={rates}
      />
      <StatCard
        label="Eligible for conversion"
        amount={totalEligibleForConversion}
        tooltip="K Credits that have been approved for settlement back to fiat"
        displayCurrency={displayCurrency}
        rates={rates}
      />
    </div>
  )
}
