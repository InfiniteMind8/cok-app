import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { meApi, residentWalletApi } from '@/lib/api'
import { getServerApi } from '@/lib/api/server'
import { WalletHeroCard } from './_components/wallet-hero-card'
import { WalletStatCards } from './_components/wallet-stat-cards'
import { TransactionList } from './_components/transaction-list'
import { WalletSkeleton } from '@/components/resident/wallet-skeleton'
import type { DisplayCurrencyCode } from '@/lib/currency/format-amount'

export default async function WalletPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  return (
    <Suspense fallback={<WalletSkeleton />}>
      <WalletContent fullName={user.fullName} memberId={user.memberId} />
    </Suspense>
  )
}

async function WalletContent({
  fullName,
  memberId,
}: {
  fullName: string
  memberId: string
}) {
  const api = getServerApi()
  const [walletMe, me, rates] = await Promise.all([
    residentWalletApi.getMe(api),
    meApi.get(api),
    meApi.getActiveRates(api),
  ])

  if (!walletMe) {
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

  const [summary, recent] = await Promise.all([
    residentWalletApi.getSummary(api),
    residentWalletApi.getRecentTransactions(api, 10),
  ])

  const displayCurrency = (me.displayCurrency ?? 'KCRD') as DisplayCurrencyCode

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5 pb-8">
      <WalletHeroCard
        balance={summary.balance}
        fullName={fullName}
        memberId={memberId}
      />

      <WalletStatCards
        totalDeposited={summary.totalDeposited}
        totalEarned={summary.totalEarned}
        totalEligibleForConversion={summary.totalEligibleForConversion}
        displayCurrency={displayCurrency !== 'KCRD' ? displayCurrency : undefined}
        rates={displayCurrency !== 'KCRD' ? rates : undefined}
      />

      <section>
        <h2 className="font-heading text-base text-karis-green-900 mb-3">Recent transactions</h2>
        <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm px-4">
          <TransactionList entries={recent.entries} showViewAll />
        </div>
      </section>

      <p className="font-body text-xs text-karis-stone-500 text-center pb-2">
        Your K Credits are backed 1:1 by Treasury reserves.
      </p>
    </div>
  )
}
