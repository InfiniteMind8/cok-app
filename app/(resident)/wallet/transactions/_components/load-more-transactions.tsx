'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { TransactionList } from '../../_components/transaction-list'
import { loadMoreTransactionsAction } from '@/app/(resident)/_actions/wallet'
import type { TransactionEntry } from '@/lib/queries/wallet'

interface LoadMoreTransactionsProps {
  walletId: string
  initialEntries: TransactionEntry[]
  initialNextCursor: string | null
}

export function LoadMoreTransactions({
  walletId,
  initialEntries,
  initialNextCursor,
}: LoadMoreTransactionsProps) {
  const [entries, setEntries] = useState<TransactionEntry[]>(initialEntries)
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor)
  const [isPending, startTransition] = useTransition()

  function loadMore() {
    if (!nextCursor) return
    startTransition(async () => {
      const result = await loadMoreTransactionsAction(walletId, nextCursor)
      setEntries((prev) => [...prev, ...result.entries])
      setNextCursor(result.nextCursor)
    })
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm px-4">
        <TransactionList entries={entries} />
      </div>

      {nextCursor && (
        <div className="text-center">
          <Button
            onClick={loadMore}
            disabled={isPending}
            variant="outline"
            className="font-body text-sm border-karis-stone-300 text-karis-green-900 min-h-[44px] px-8"
          >
            {isPending ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}

      {!nextCursor && entries.length > 0 && (
        <p className="font-body text-xs text-karis-stone-400 text-center pb-2">
          All transactions shown
        </p>
      )}
    </div>
  )
}
