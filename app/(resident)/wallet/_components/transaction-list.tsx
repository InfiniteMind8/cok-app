'use client'

import { useState } from 'react'
import { formatDistance } from 'date-fns'
import { Prisma, TransactionType } from '@prisma/client'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ShoppingBag,
  Repeat2,
  Briefcase,
  Wallet,
  ReceiptText,
  Settings2,
  Undo2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TransactionDetailSheet } from './transaction-detail-sheet'
import type { TransactionEntry } from '@/lib/queries/wallet'

const TYPE_ICON: Record<TransactionType, React.ComponentType<{ size?: number; className?: string }>> = {
  DEPOSIT: ArrowDownToLine,
  RESIDENT_SETTLEMENT: ArrowUpFromLine,
  VENDOR_SETTLEMENT: ArrowUpFromLine,
  VISITOR_SETTLEMENT: ArrowUpFromLine,
  PURCHASE: ShoppingBag,
  BARTER: Repeat2,
  PAYROLL: Briefcase,
  TRANSFER: Wallet,
  FEE_SPLIT: ReceiptText,
  TREASURY_ADJUSTMENT: Settings2,
  REVERSAL: Undo2,
}

interface TransactionListProps {
  entries: TransactionEntry[]
  showViewAll?: boolean
}

export function TransactionList({ entries, showViewAll = false }: TransactionListProps) {
  const [selected, setSelected] = useState<TransactionEntry | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  function handleRowClick(entry: TransactionEntry) {
    setSelected(entry)
    setDetailOpen(true)
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-10">
        <Wallet size={32} strokeWidth={1.25} className="text-karis-stone-300 mx-auto mb-3" />
        <p className="font-body text-sm text-karis-stone-500">
          No transactions yet. Your activity will appear here.
        </p>
      </div>
    )
  }

  const now = new Date()

  return (
    <>
      <div className="divide-y divide-karis-stone-100">
        {entries.map((entry) => {
          const amount = new Prisma.Decimal(entry.amount)
          const isIncoming = amount.gt(0)
          const abs = amount.abs()
          const formatted = abs.toFixed(2)
          const [int, dec] = formatted.split('.')
          const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

          const txDate = new Date(entry.transaction.createdAt)
          const daysAgo = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24)
          const dateLabel =
            daysAgo < 7
              ? formatDistance(txDate, now, { addSuffix: true })
              : txDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

          const Icon = TYPE_ICON[entry.transaction.type] ?? Wallet

          return (
            <button
              key={entry.id}
              onClick={() => handleRowClick(entry)}
              className="w-full flex items-center gap-3 py-3.5 px-0 hover:bg-karis-stone-50 transition-colors duration-150 ease-out text-left min-h-[44px]"
            >
              <div className="shrink-0 w-9 h-9 rounded-full bg-karis-green-900/8 flex items-center justify-center">
                <Icon size={16} className="text-karis-green-900" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-karis-stone-900 truncate leading-tight">
                  {entry.transaction.description}
                </p>
                <p className="font-body text-xs text-karis-stone-500 mt-0.5">{dateLabel}</p>
              </div>

              <div className={cn('font-body text-sm tabular-nums shrink-0', isIncoming ? 'text-status-green' : 'text-status-red')}>
                {isIncoming ? '+' : '-'}
                <span className="text-karis-gold-700">K </span>
                {withCommas}.{dec}
              </div>
            </button>
          )
        })}
      </div>

      {showViewAll && entries.length >= 10 && (
        <div className="pt-3 text-center">
          <a
            href="/wallet/transactions"
            className="font-body text-sm text-karis-green-700 hover:text-karis-green-900 underline underline-offset-2 transition-colors duration-150"
          >
            View all transactions
          </a>
        </div>
      )}

      <TransactionDetailSheet
        entry={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  )
}
