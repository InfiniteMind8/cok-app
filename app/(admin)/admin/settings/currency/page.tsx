import 'server-only'
import { DollarSign } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { db } from '@/lib/db'
import { RateEditor } from './_components/rate-editor'

export const dynamic = 'force-dynamic'

// D.3 inline — was getAllActiveRates() from app/(admin)/_actions/rates,
// deleted in the D.3 cleanup. Server component reads via lib/db until D.4
// moves page fetches to API.
async function getAllActiveRates() {
  const now = new Date()
  return db.conversionRate.findMany({
    where: {
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
    },
    orderBy: [{ baseCurrency: 'asc' }, { quoteCurrency: 'asc' }],
  })
}

export default async function CurrencySettingsPage() {
  const [, allRates] = await Promise.all([
    getAllActiveRates(),
    db.conversionRate.findMany({ orderBy: [{ baseCurrency: 'asc' }, { effectiveFrom: 'desc' }] }),
  ])

  return (
    <div className="p-8 max-w-4xl space-y-8">
      <PageHeader
        title="Currency Settings"
        subtitle="Set the conversion rates between K Credits, USD, and GYD. Changes take effect immediately."
        action={
          <div className="flex items-center gap-2 text-karis-stone-500">
            <DollarSign size={15} />
            <span className="font-body text-xs">Rates are append-only — history is preserved.</span>
          </div>
        }
      />

      <RateEditor rates={allRates.map((r) => ({
        ...r,
        rate: r.rate,
        effectiveFrom: r.effectiveFrom,
        effectiveTo: r.effectiveTo ?? null,
      }))} />
    </div>
  )
}
