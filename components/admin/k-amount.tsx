import { Prisma } from '@prisma/client'

interface KAmountProps {
  amount: Prisma.Decimal | string | number
  className?: string
}

export function KAmount({ amount, className }: KAmountProps) {
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
