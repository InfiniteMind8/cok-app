'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { Prisma } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { TransactionEntry } from '@/lib/queries/wallet'

interface TransactionDetailSheetProps {
  entry: TransactionEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransactionDetailSheet({ entry, open, onOpenChange }: TransactionDetailSheetProps) {
  const [copied, setCopied] = useState(false)

  if (!entry) return null

  const amount = new Prisma.Decimal(entry.amount)
  const isIncoming = amount.gt(0)
  const absAmount = amount.abs()
  const formatted = absAmount.toFixed(2)
  const [integer, decimal] = formatted.split('.')
  const withCommas = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  async function copyRef() {
    const ref = entry!.transaction.reference ?? entry!.transaction.id
    await navigator.clipboard.writeText(ref)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const txDate = new Date(entry.transaction.createdAt)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-heading text-karis-green-900">Transaction detail</SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* Amount */}
          <div className="text-center py-4">
            <p className="font-body text-xs text-karis-stone-500 mb-1">
              {isIncoming ? 'Received' : 'Sent'}
            </p>
            <p className={`font-heading text-4xl tabular-nums ${isIncoming ? 'text-status-green' : 'text-status-red'}`}>
              {isIncoming ? '+' : '-'}
              <span className="text-karis-gold-700 font-display text-2xl">K </span>
              {withCommas}.{decimal}
            </p>
          </div>

          <Separator className="bg-karis-stone-100" />

          {/* Details */}
          <dl className="space-y-3">
            <div className="flex justify-between items-start">
              <dt className="font-body text-xs text-karis-stone-500">Description</dt>
              <dd className="font-body text-sm text-karis-stone-900 text-right max-w-[60%]">
                {entry.transaction.description}
              </dd>
            </div>

            <div className="flex justify-between items-start">
              <dt className="font-body text-xs text-karis-stone-500">Type</dt>
              <dd className="font-body text-sm text-karis-stone-900">
                {entry.transaction.type.replace(/_/g, ' ').toLowerCase()}
              </dd>
            </div>

            <div className="flex justify-between items-start">
              <dt className="font-body text-xs text-karis-stone-500">Date</dt>
              <dd className="font-body text-sm text-karis-stone-900">
                {format(txDate, 'dd MMM yyyy, HH:mm')}
              </dd>
            </div>

            {entry.description && (
              <div className="flex justify-between items-start">
                <dt className="font-body text-xs text-karis-stone-500">Note</dt>
                <dd className="font-body text-sm text-karis-stone-900 text-right max-w-[60%]">
                  {entry.description}
                </dd>
              </div>
            )}

            <div className="flex justify-between items-center">
              <dt className="font-body text-xs text-karis-stone-500">Reference ID</dt>
              <dd className="flex items-center gap-1.5">
                <span className="font-body text-xs text-karis-stone-700 tabular-nums">
                  {(entry.transaction.reference ?? entry.transaction.id).slice(0, 12)}…
                </span>
                <button
                  onClick={copyRef}
                  className="text-karis-stone-400 hover:text-karis-green-700 transition-colors duration-150"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </dd>
            </div>
          </dl>

          <Separator className="bg-karis-stone-100" />

          <a
            href={`/wallet/receipt/${entry.transaction.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              className="w-full font-body text-sm gap-2 min-h-[44px] border-karis-stone-300 text-karis-green-900"
            >
              <ExternalLink size={15} />
              View receipt
            </Button>
          </a>
        </div>
      </SheetContent>
    </Sheet>
  )
}
