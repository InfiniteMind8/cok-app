import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { getTransactionPage } from '@/lib/queries/wallet'
import { LoadMoreTransactions } from './_components/load-more-transactions'

export const dynamic = 'force-dynamic'

export default async function TransactionsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const wallet = await db.wallet.findUnique({ where: { userId: user.id } })

  if (!wallet) {
    return (
      <div className="px-4 py-8 max-w-lg mx-auto">
        <p className="font-body text-sm text-karis-stone-500 text-center">No wallet found.</p>
      </div>
    )
  }

  const { entries, nextCursor } = await getTransactionPage(wallet.id, undefined, 20)

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-4 pb-8">
      <div className="flex items-center gap-2">
        <Link
          href="/wallet"
          className="text-karis-stone-500 hover:text-karis-green-900 transition-colors duration-150 min-h-[44px] flex items-center"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="font-heading text-xl text-karis-green-900">All transactions</h1>
      </div>

      <LoadMoreTransactions
        walletId={wallet.id}
        initialEntries={entries}
        initialNextCursor={nextCursor}
      />
    </div>
  )
}
