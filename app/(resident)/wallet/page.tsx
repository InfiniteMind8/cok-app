import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { getWalletSummary } from '@/lib/ledger/balance'
import { getRecentTransactions } from '@/lib/queries/wallet'
import { WalletHeroCard } from './_components/wallet-hero-card'
import { WalletStatCards } from './_components/wallet-stat-cards'
import { TransactionList } from './_components/transaction-list'
import { WalletSkeleton } from '@/components/resident/wallet-skeleton'

export default async function WalletPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  return (
    <Suspense fallback={<WalletSkeleton />}>
      <WalletContent userId={user.id} fullName={user.fullName} memberId={user.memberId} />
    </Suspense>
  )
}

async function WalletContent({
  userId,
  fullName,
  memberId,
}: {
  userId: string
  fullName: string
  memberId: string
}) {
  const wallet = await db.wallet.findUnique({ where: { userId } })

  if (!wallet) {
    return (
      <div className="px-4 py-8 max-w-lg mx-auto">
        <div className="bg-white border border-karis-stone-100 rounded-2xl p-8 text-center shadow-sm">
          <p className="font-heading text-xl text-karis-green-900 mb-2">Your wallet is being set up</p>
          <p className="font-body text-sm text-karis-stone-500">
            Reach out to your Admin and it will appear here shortly.
          </p>
        </div>
      </div>
    )
  }

  const [summary, recentEntries] = await Promise.all([
    getWalletSummary(wallet.id),
    getRecentTransactions(wallet.id, 10),
  ])

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5 pb-8">
      <WalletHeroCard
        balance={summary.balance.toString()}
        fullName={fullName}
        memberId={memberId}
      />

      <WalletStatCards
        totalDeposited={summary.totalDeposited}
        totalEarned={summary.totalEarned}
        totalEligibleForConversion={summary.totalEligibleForConversion}
      />

      <section>
        <h2 className="font-heading text-base text-karis-green-900 mb-3">Recent transactions</h2>
        <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm px-4">
          <TransactionList entries={recentEntries} showViewAll />
        </div>
      </section>

      <p className="font-body text-xs text-karis-stone-500 text-center pb-2">
        Your K Credits are backed 1:1 by Treasury reserves.
      </p>
    </div>
  )
}
