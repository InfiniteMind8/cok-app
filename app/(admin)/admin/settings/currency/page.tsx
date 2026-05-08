import 'server-only'
import { DollarSign } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { getAllActiveRates } from './_actions/rates'
import { db } from '@/lib/db'
import { RateEditor } from './_components/rate-editor'

export const dynamic = 'force-dynamic'

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
