'use client'

import { useState } from 'react'
import { CalendarClock, FileText, Construction } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DEMO_RESIDENT_TENANCY } from '@/lib/demo/fixtures'
import { DemoExtensionModal } from './demo-extension-modal'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function DemoPropertyClient() {
  const [extensionOpen, setExtensionOpen] = useState(false)
  const t = DEMO_RESIDENT_TENANCY
  const paidPct = Math.round((t.paidCycles / t.totalCycles) * 100)

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5 pb-8">
      {/* Photo placeholder strip */}
      <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-karis-green-700 to-karis-green-900 flex items-center justify-center relative">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(circle at 30% 40%, var(--color-karis-gold-300), transparent 60%)',
          }}
          aria-hidden="true"
        />
        <p className="relative font-display text-karis-gold-100 text-3xl">Lot 1</p>
      </div>

      {/* Address + type badge */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="font-heading text-lg text-karis-green-900 leading-snug">
            {t.propertyAddress}
          </p>
          <p className="font-body text-xs text-karis-stone-500 tabular-nums mt-0.5">
            Code: {t.propertyCode}
          </p>
        </div>
        <span className="shrink-0 font-body text-xs bg-karis-green-900 text-white px-3 py-1 rounded-full">
          Tenancy
        </span>
      </div>

      {/* Specs */}
      <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm p-5">
        <h3 className="font-heading text-base text-karis-green-900 mb-3">Specifications</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {t.specifications.map((spec) => (
            <div key={spec.label}>
              <p className="font-body text-[10px] uppercase tracking-widest text-karis-stone-500">
                {spec.label}
              </p>
              <p className="font-body text-sm text-karis-stone-900">{spec.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tenancy status card */}
      <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-karis-stone-100">
          <p className="font-body text-[10px] uppercase tracking-widest text-karis-stone-500 mb-1">
            Lease cycle
          </p>
          <p className="font-heading text-lg text-karis-green-900">{t.cycleLabel}</p>
          <p className="font-body text-xs text-karis-stone-500 mt-0.5">
            <span className="text-karis-gold-700">K </span>
            {t.cyclePayment} per cycle
          </p>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-karis-stone-500">Cycles paid</span>
            <span className="font-body text-sm text-karis-green-900 tabular-nums">
              {t.paidCycles} / {t.totalCycles} · {paidPct}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-karis-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-karis-gold-300 to-karis-gold-700 rounded-full transition-all"
              style={{ width: `${paidPct}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <p className="font-body text-[10px] uppercase tracking-widest text-karis-stone-500">
                Next payment due
              </p>
              <p className="font-body text-sm text-karis-stone-900">
                {formatDate(t.nextPaymentDue)}
              </p>
            </div>
            <div>
              <p className="font-body text-[10px] uppercase tracking-widest text-karis-stone-500">
                End date
              </p>
              <p className="font-body text-sm text-karis-stone-900">{formatDate(t.endDate)}</p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setExtensionOpen(true)}
            className="w-full mt-3 border-karis-gold-500 text-karis-green-900 font-body text-sm gap-2 min-h-[44px] hover:bg-karis-gold-300/20"
          >
            <CalendarClock size={16} />
            Request extension
          </Button>
        </div>
      </div>

      {/* Contract card */}
      <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-5 flex items-start gap-4">
        <div className="shrink-0 w-9 h-9 rounded-full bg-karis-stone-100 flex items-center justify-center">
          <FileText size={16} className="text-karis-stone-700" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="font-heading text-base text-karis-green-900">Tenancy agreement</p>
          <p className="font-body text-xs text-karis-stone-500 mt-0.5">
            Signed {formatDate(t.contractDate)}
          </p>
        </div>
      </div>

      {/* Construction updates placeholder */}
      <div className="bg-karis-stone-50 border border-karis-stone-100 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Construction size={18} className="text-karis-stone-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-body text-sm text-karis-stone-700 font-medium">
              Construction updates
            </p>
            <p className="font-body text-xs text-karis-stone-500 mt-1 leading-relaxed">
              Construction updates from your assigned Admin will appear here, with photos and
              percentage completion across foundations, structure, and finishing. Coming in Phase 2.
            </p>
          </div>
        </div>
      </div>

      <DemoExtensionModal open={extensionOpen} onClose={() => setExtensionOpen(false)} />
    </div>
  )
}
