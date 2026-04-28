'use client'
import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { updateDisplayCurrencyAction } from '@/app/(resident)/_actions/profile'

const OPTIONS = [
  { value: 'KCRD', label: 'K Credits (KCRD)' },
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'GYD', label: 'Guyanese Dollar (GYD)' },
] as const

interface DisplayCurrencySelectorProps {
  current: 'KCRD' | 'USD' | 'GYD'
}

export function DisplayCurrencySelector({ current }: DisplayCurrencySelectorProps) {
  const [selected, setSelected] = useState(current)
  const [pending, startTransition] = useTransition()

  function handleChange(value: 'KCRD' | 'USD' | 'GYD') {
    setSelected(value)
    startTransition(async () => {
      await updateDisplayCurrencyAction(value)
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-karis-stone-700">Display currency</p>
        {pending && <Loader2 size={12} className="animate-spin text-karis-stone-400" />}
      </div>
      <div className="flex gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleChange(opt.value)}
            className={`flex-1 py-2 px-3 rounded-lg font-body text-xs transition-all duration-150 min-h-[44px] border ${
              selected === opt.value
                ? 'bg-karis-green-900 text-white border-karis-green-900'
                : 'bg-white text-karis-stone-700 border-karis-stone-200 hover:border-karis-green-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
