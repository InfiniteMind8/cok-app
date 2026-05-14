import 'server-only'
import { DollarSign } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { adminRatesApi } from '@/lib/api'
import { getServerApi } from '@/lib/api/server'
import { RateEditor } from './_components/rate-editor'

export const dynamic = 'force-dynamic'

export default async function CurrencySettingsPage() {
  const rows = await adminRatesApi.all(getServerApi())
  const allRates = rows.map((r) => ({
    ...r,
    effectiveFrom: new Date(r.effectiveFrom),
    effectiveTo: r.effectiveTo ? new Date(r.effectiveTo) : null,
  }))

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

      <RateEditor rates={allRates} />
    </div>
  )
}
