'use client'
import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { setConversionRateAction } from '../_actions/rates'

type Rate = {
  id: string
  baseCurrency: string
  quoteCurrency: string
  rate: { toString(): string }
  effectiveFrom: Date
  effectiveTo: Date | null
  setBy: string
}

interface RateEditorProps {
  rates: Rate[]
}

const PAIRS = [
  { base: 'KCRD', quote: 'USD', label: 'KCRD → USD' },
  { base: 'USD', quote: 'KCRD', label: 'USD → KCRD' },
  { base: 'KCRD', quote: 'GYD', label: 'KCRD → GYD' },
  { base: 'GYD', quote: 'KCRD', label: 'GYD → KCRD' },
  { base: 'USD', quote: 'GYD', label: 'USD → GYD' },
  { base: 'GYD', quote: 'USD', label: 'GYD → USD' },
]

export function RateEditor({ rates }: RateEditorProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState<Record<string, boolean>>({})
  const [pending, startTransition] = useTransition()

  const activeRateFor = (base: string, quote: string) =>
    rates.find((r) => r.baseCurrency === base && r.quoteCurrency === quote && !r.effectiveTo)

  const key = (base: string, quote: string) => `${base}_${quote}`

  function handleChange(base: string, quote: string, val: string) {
    setDrafts((d) => ({ ...d, [key(base, quote)]: val }))
    setErrors((e) => ({ ...e, [key(base, quote)]: '' }))
    setSuccess((s) => ({ ...s, [key(base, quote)]: false }))
  }

  function handleApply(base: string, quote: string) {
    const val = drafts[key(base, quote)]
    if (!val) {
      setErrors((e) => ({ ...e, [key(base, quote)]: 'Enter a rate value.' }))
      return
    }
    startTransition(async () => {
      const result = await setConversionRateAction({ baseCurrency: base, quoteCurrency: quote, rate: val })
      if (result.ok) {
        setSuccess((s) => ({ ...s, [key(base, quote)]: true }))
        setDrafts((d) => ({ ...d, [key(base, quote)]: '' }))
      } else {
        setErrors((e) => ({ ...e, [key(base, quote)]: result.error ?? 'Unknown error.' }))
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-karis-stone-50">
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Pair</TableHead>
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Current Rate</TableHead>
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Since</TableHead>
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">New Rate</TableHead>
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PAIRS.map(({ base, quote, label }) => {
              const current = activeRateFor(base, quote)
              const k = key(base, quote)
              return (
                <TableRow key={k}>
                  <TableCell className="px-5 font-body text-sm font-medium text-karis-stone-900">{label}</TableCell>
                  <TableCell className="px-5 tabular-nums font-body text-sm text-karis-stone-700">
                    {current ? current.rate.toString() : <span className="text-karis-stone-400">—</span>}
                  </TableCell>
                  <TableCell className="px-5 font-body text-xs text-karis-stone-500">
                    {current ? format(current.effectiveFrom, 'dd MMM yyyy HH:mm') : '—'}
                  </TableCell>
                  <TableCell className="px-5 py-2">
                    <div className="space-y-1">
                      <Input
                        type="number"
                        step="0.00000001"
                        min="0"
                        value={drafts[k] ?? ''}
                        onChange={(e) => handleChange(base, quote, e.target.value)}
                        placeholder={current?.rate.toString() ?? '0.00000000'}
                        className="w-40 font-body text-sm tabular-nums h-8"
                        aria-label={`New rate for ${label}`}
                      />
                      {errors[k] && <p className="font-body text-xs text-status-red">{errors[k]}</p>}
                      {success[k] && <p className="font-body text-xs text-status-green">Rate updated.</p>}
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApply(base, quote)}
                      disabled={pending || !drafts[k]}
                      className="h-8 font-body text-xs"
                    >
                      {pending ? <Loader2 size={12} className="animate-spin" /> : 'Apply'}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {rates.filter((r) => r.effectiveTo !== null).length > 0 && (
        <div>
          <h3 className="font-heading text-sm text-karis-green-900 mb-3">Rate history</h3>
          <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-karis-stone-50">
                  <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Pair</TableHead>
                  <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Rate</TableHead>
                  <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Valid From</TableHead>
                  <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Expired At</TableHead>
                  <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates
                  .filter((r) => r.effectiveTo !== null)
                  .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime())
                  .slice(0, 20)
                  .map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="px-5 font-body text-sm text-karis-stone-700">{r.baseCurrency} → {r.quoteCurrency}</TableCell>
                      <TableCell className="px-5 tabular-nums font-body text-sm">{r.rate.toString()}</TableCell>
                      <TableCell className="px-5 font-body text-xs text-karis-stone-500">{format(r.effectiveFrom, 'dd MMM yyyy HH:mm')}</TableCell>
                      <TableCell className="px-5 font-body text-xs text-karis-stone-500">{r.effectiveTo ? format(r.effectiveTo, 'dd MMM yyyy HH:mm') : '—'}</TableCell>
                      <TableCell className="px-5">
                        <Badge variant="secondary" className="font-body text-xs bg-karis-stone-100 text-karis-stone-500">Expired</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
