import { Prisma } from '@/lib/prisma-shim'
import { formatAmount, type DisplayCurrencyCode } from '@/lib/currency/format-amount'
import type { RateMap } from '@/lib/currency/rate-resolver'

interface KAmountProps {
  amount: Prisma.Decimal | string | number
  className?: string
  displayCurrency?: DisplayCurrencyCode
  rates?: RateMap
}

export function KAmount({ amount, className, displayCurrency, rates }: KAmountProps) {
  if (displayCurrency && displayCurrency !== 'KCRD' && rates) {
    const formatted = formatAmount(String(amount), displayCurrency, rates)
    return (
      <span className={className} title={formatted.tooltipText}>
        <span className="text-karis-gold-700 font-body">{formatted.symbol} </span>
        <span className="tabular-nums font-body">{formatted.value}</span>
      </span>
    )
  }

  const d = new Prisma.Decimal(amount)
  const formatted = d.toFixed(2)
  const [integer, decimal] = formatted.split('.')
  const withCommas = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return (
    <span className={className}>
      <span className="text-karis-gold-700 font-body">K </span>
      <span className="tabular-nums font-body">
        {withCommas}.{decimal}
      </span>
    </span>
  )
}
