'use client'

import { useState } from 'react'
import { Prisma } from '@prisma/client'
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DepositInfoSheet } from './deposit-info-sheet'
import { SettlementRequestSheet } from './settlement-request-sheet'

interface WalletHeroCardProps {
  balance: string
  fullName: string
  memberId: string
}

export function WalletHeroCard({ balance, fullName, memberId }: WalletHeroCardProps) {
  const [depositOpen, setDepositOpen] = useState(false)
  const [settlementOpen, setSettlementOpen] = useState(false)

  const d = new Prisma.Decimal(balance)
  const formatted = d.toFixed(2)
  const [integer, decimal] = formatted.split('.')
  const withCommas = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return (
    <>
      <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-6">
        <p className="font-body text-xs text-karis-stone-500 mb-1 uppercase tracking-widest">
          K Credits Balance
        </p>

        <div className="flex items-baseline gap-1 mb-1">
          <span className="font-display text-karis-gold-700 text-3xl leading-none">K</span>
          <span className="font-heading text-karis-green-900 text-5xl tabular-nums leading-none tracking-tight">
            {withCommas}
          </span>
          <span className="font-heading text-karis-stone-500 text-2xl tabular-nums">.{decimal}</span>
        </div>

        {/* The only gradient in the app */}
        <div className="h-0.5 w-20 bg-gradient-to-r from-karis-gold-300 via-karis-gold-500 to-karis-gold-300 rounded-full mb-4" />

        <p className="font-body text-sm text-karis-green-900 font-medium">{fullName}</p>
        <p className="font-body text-xs text-karis-stone-500 tabular-nums">{memberId}</p>

        <div className="flex gap-3 mt-5">
          <Button
            onClick={() => setDepositOpen(true)}
            className="flex-1 bg-karis-green-900 text-white font-body text-sm gap-2 min-h-[44px] hover:bg-karis-green-700 transition-colors duration-150 ease-out"
          >
            <ArrowDownToLine size={16} />
            Deposit
          </Button>
          <Button
            onClick={() => setSettlementOpen(true)}
            variant="outline"
            className="flex-1 border-karis-gold-500 text-karis-green-900 font-body text-sm gap-2 min-h-[44px] hover:bg-karis-gold-300/20 transition-colors duration-150 ease-out"
          >
            <ArrowUpFromLine size={16} />
            Request settlement
          </Button>
        </div>
      </div>

      <DepositInfoSheet open={depositOpen} onOpenChange={setDepositOpen} />
      <SettlementRequestSheet
        open={settlementOpen}
        onOpenChange={setSettlementOpen}
        balance={balance}
      />
    </>
  )
}
