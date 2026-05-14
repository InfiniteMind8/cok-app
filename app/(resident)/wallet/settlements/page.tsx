import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ReceiptText } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { residentWalletApi } from '@/lib/api'
import { getServerApi } from '@/lib/api/server'
import { SettlementRow } from './_components/settlement-timeline'

export const dynamic = 'force-dynamic'

export default async function SettlementsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const requests = await residentWalletApi.listSettlements(getServerApi())

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-4 pb-8">
      <div className="flex items-center gap-2">
        <Link
          href="/wallet"
          className="text-karis-stone-500 hover:text-karis-green-900 transition-colors duration-150 min-h-[44px] flex items-center"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="font-heading text-xl text-karis-green-900">Settlement requests</h1>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ReceiptText size={40} strokeWidth={1.25} className="text-karis-stone-300 mb-4" />
          <h3 className="font-heading text-lg text-karis-green-900 mb-1">No settlement requests yet</h3>
          <p className="font-body text-sm text-karis-stone-500 max-w-xs">
            Your settlement requests will appear here once you submit them from your wallet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <SettlementRow key={req.id} request={req} />
          ))}
        </div>
      )}
    </div>
  )
}
