'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Sent', value: 'SENT' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Queued', value: 'QUEUED' },
]

export function StatusFilter({ currentStatus }: { currentStatus?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function navigate(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    if (value) {
      params.set('status', value)
    } else {
      params.delete('status')
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 mb-4" role="group" aria-label="Filter by email status">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => navigate(f.value)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-body transition-colors',
            (currentStatus ?? '') === f.value
              ? 'bg-karis-green-900 text-karis-stone-50'
              : 'bg-karis-stone-100 text-karis-stone-700 hover:bg-karis-stone-200',
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
