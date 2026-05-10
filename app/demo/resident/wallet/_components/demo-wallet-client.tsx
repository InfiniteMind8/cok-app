'use client'

import { useState } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, ShoppingBag, Repeat2, Briefcase, Wallet, ReceiptText, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatAmount, type DisplayCurrencyCode } from '@/lib/currency/format-amount'
import { DemoLocked } from '@/app/demo/_components/demo-locked'
import {
  DEMO_RATES,
  DEMO_RESIDENT_TRANSACTIONS,
  DEMO_RESIDENT_WALLET,
  DEMO_USERS,
  type DemoTransaction,
} from '@/lib/demo/fixtures'

const TYPE_ICON: Record<DemoTransaction['type'], React.ComponentType<{ size?: number; className?: string }>> = {
  DEPOSIT: ArrowDownToLine,
  RESIDENT_SETTLEMENT: ArrowUpFromLine,
  PURCHASE: ShoppingBag,
  BARTER: Repeat2,
  PAYROLL: Briefcase,
  TRANSFER: Wallet,
  FEE_SPLIT: ReceiptText,
  CONVERSION_BONUS: Sparkles,
}

const CURRENCIES: DisplayCurrencyCode[] = ['KCRD', 'USD', 'GYD']

function formatTimeAgo(iso: string, now: Date): string {
  const d = new Date(iso)
  const diffMs = now.getTime() - d.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days < 1) {
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    if (hours < 1) return 'just now'
    return `${hours}h ago`
  }
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function DemoWalletClient() {
  const [currency, setCurrency] = useState<DisplayCurrencyCode>('KCRD')
  const user = DEMO_USERS.resident
  const wallet = DEMO_RESIDENT_WALLET
  const now = new Date('2026-05-08T22:22:00.000Z')

  const balanceFormatted = formatAmount(wallet.balance, currency, DEMO_RATES)
  const depositedFormatted = formatAmount(wallet.totalDeposited, currency, DEMO_RATES)
  const earnedFormatted = formatAmount(wallet.totalEarned, currency, DEMO_RATES)
  const eligibleFormatted = formatAmount(wallet.totalEligibleForConversion, currency, DEMO_RATES)

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5 pb-8">
      {/* Hero card */}
      <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-6">
        <p className="font-body text-xs text-karis-stone-500 mb-1 uppercase tracking-widest">
          {currency === 'KCRD' ? 'K Credits Balance' : `Balance · ${currency}`}
        </p>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-display text-karis-gold-700 text-3xl leading-none">
            {balanceFormatted.symbol}
          </span>
          <span className="font-heading text-karis-green-900 text-5xl tabular-nums leading-none tracking-tight">
            {balanceFormatted.value.replace(/\B(?=(\d{3})+(?!\d))/g, ',').split('.')[0]}
          </span>
          {balanceFormatted.value.includes('.') && (
            <span className="font-heading text-karis-stone-500 text-2xl tabular-nums">
              .{balanceFormatted.value.split('.')[1]}
            </span>
          )}
        </div>

        <div className="h-0.5 w-20 bg-gradient-to-r from-karis-gold-300 via-karis-gold-500 to-karis-gold-300 rounded-full mb-4" />

        <p className="font-body text-sm text-karis-green-900 font-medium">{user.fullName}</p>
        <p className="font-body text-xs text-karis-stone-500 tabular-nums">{user.memberId}</p>

        {!balanceFormatted.isSameAsKcrd && (
          <p className="font-body text-xs text-karis-stone-500 mt-2">
            ≈ K {balanceFormatted.kcrdEquivalent} · {balanceFormatted.tooltipText.split('@')[1]?.trim()}
          </p>
        )}

        <div className="flex gap-3 mt-5">
          <DemoLocked>
            <button
              type="button"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-karis-green-900 text-white font-body text-sm rounded-md min-h-[44px] hover:bg-karis-green-700 transition-colors duration-150 ease-out"
            >
              <ArrowDownToLine size={16} />
              Deposit
            </button>
          </DemoLocked>
          <DemoLocked>
            <button
              type="button"
              className="flex-1 inline-flex items-center justify-center gap-2 border border-karis-gold-500 text-karis-green-900 font-body text-sm rounded-md min-h-[44px] hover:bg-karis-gold-300/20 transition-colors duration-150 ease-out"
            >
              <ArrowUpFromLine size={16} />
              Request settlement
            </button>
          </DemoLocked>
        </div>
      </div>

      {/* Currency toggle — local state, no DB */}
      <div
        className="bg-white border border-karis-stone-100 rounded-xl p-3 shadow-sm"
        data-testid="demo-currency-toggle"
      >
        <p className="font-body text-[10px] uppercase tracking-widest text-karis-stone-500 mb-2 px-1">
          Display currency
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              data-testid={`demo-currency-${c}`}
              aria-pressed={currency === c}
              className={cn(
                'font-body text-xs py-2 rounded-md transition-colors min-h-[36px]',
                currency === c
                  ? 'bg-karis-green-900 text-white'
                  : 'text-karis-stone-700 hover:bg-karis-stone-50',
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total deposited', amount: depositedFormatted },
          { label: 'Total earned', amount: earnedFormatted },
          { label: 'Eligible for conversion', amount: eligibleFormatted },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-karis-stone-100 rounded-xl p-4 shadow-sm"
          >
            <p className="font-body text-[10px] text-karis-stone-500 uppercase tracking-widest mb-1">
              {stat.label}
            </p>
            <p className="font-heading text-lg text-karis-green-900 tabular-nums">
              <span className="text-karis-gold-700">{stat.amount.symbol} </span>
              {stat.amount.value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </p>
          </div>
        ))}
      </div>

      {/* Recent transactions */}
      <section>
        <h2 className="font-heading text-base text-karis-green-900 mb-3">Recent transactions</h2>
        <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm px-4">
          <div className="divide-y divide-karis-stone-100">
            {DEMO_RESIDENT_TRANSACTIONS.map((tx) => {
              const Icon = TYPE_ICON[tx.type] ?? Wallet
              const amountNum = parseFloat(tx.amount)
              const isIncoming = amountNum > 0
              const absStr = Math.abs(amountNum).toFixed(2)
              const [int, dec] = absStr.split('.')
              const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

              const displayAmount = formatAmount(absStr, currency, DEMO_RATES)
              const showConverted = currency !== 'KCRD'

              return (
                <DemoLocked key={tx.id}>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 py-3.5 px-0 hover:bg-karis-stone-50 transition-colors duration-150 ease-out text-left min-h-[44px]"
                  >
                    <div className="shrink-0 w-9 h-9 rounded-full bg-karis-green-900/8 flex items-center justify-center">
                      <Icon size={16} className="text-karis-green-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-karis-stone-900 truncate leading-tight">
                        {tx.description}
                      </p>
                      <p className="font-body text-xs text-karis-stone-500 mt-0.5">
                        {formatTimeAgo(tx.createdAt, now)}
                      </p>
                    </div>
                    <div
                      className={cn(
                        'font-body text-sm tabular-nums shrink-0 text-right',
                        isIncoming ? 'text-status-green' : 'text-status-red',
                      )}
                    >
                      <div>
                        {isIncoming ? '+' : '-'}
                        <span className="text-karis-gold-700">
                          {showConverted ? displayAmount.symbol : 'K'}{' '}
                        </span>
                        {showConverted
                          ? displayAmount.value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                          : `${withCommas}.${dec}`}
                      </div>
                      {showConverted && (
                        <div className="text-[10px] text-karis-stone-500 font-normal mt-0.5">
                          K {withCommas}.{dec}
                        </div>
                      )}
                    </div>
                  </button>
                </DemoLocked>
              )
            })}
          </div>
        </div>
      </section>

      <p className="font-body text-xs text-karis-stone-500 text-center pb-2">
        Your K Credits are backed 1:1 by Treasury reserves.
      </p>
    </div>
  )
}
