'use client'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { createPromotionAction } from '../_actions/promotions'

interface PromotionFormProps {
  onSuccess?: () => void
}

export function PromotionForm({ onSuccess }: PromotionFormProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [eligibility, setEligibility] = useState<string>('ALL')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const input = {
      name: fd.get('name'),
      description: fd.get('description'),
      bonusPercent: fd.get('bonusPercent'),
      direction: fd.get('direction'),
      eligibility: fd.get('eligibility'),
      eligibleUserIds: fd.get('eligibleUserIds') ?? '',
      startsAt: fd.get('startsAt'),
      endsAt: fd.get('endsAt'),
    }
    startTransition(async () => {
      const result = await createPromotionAction(input)
      if (result.ok) {
        onSuccess?.()
      } else {
        setError(result.error ?? 'Failed to create promotion.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="promo-name" className="font-body text-xs text-karis-stone-700">Name <span className="text-status-red">*</span></Label>
          <Input id="promo-name" name="name" required placeholder="Founding Member Bonus" className="font-body text-sm" />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="promo-desc" className="font-body text-xs text-karis-stone-700">Description <span className="text-status-red">*</span></Label>
          <Input id="promo-desc" name="description" required placeholder="Bonus K Credits on USD top-ups for founding members" className="font-body text-sm" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="promo-bonus" className="font-body text-xs text-karis-stone-700">Bonus % <span className="text-status-red">*</span></Label>
          <Input id="promo-bonus" name="bonusPercent" type="number" step="0.01" min="0.01" max="100" required placeholder="20.00" className="font-body text-sm tabular-nums" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="promo-dir" className="font-body text-xs text-karis-stone-700">Direction <span className="text-status-red">*</span></Label>
          <select id="promo-dir" name="direction" required className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 font-body text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-karis-green-700">
            <option value="FIAT_TO_KCRD">Fiat → KCRD (on-ramp)</option>
            <option value="KCRD_TO_FIAT">KCRD → Fiat (off-ramp)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="promo-elig" className="font-body text-xs text-karis-stone-700">Eligibility <span className="text-status-red">*</span></Label>
          <select id="promo-elig" name="eligibility" required value={eligibility} onChange={(e) => setEligibility(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 font-body text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-karis-green-700">
            <option value="ALL">All users</option>
            <option value="FOUNDING_MEMBERS">Founding members only</option>
            <option value="RESIDENTS_ONLY">Residents only</option>
            <option value="SPECIFIC_USERS">Specific users</option>
          </select>
        </div>

        {eligibility === 'SPECIFIC_USERS' && (
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="promo-users" className="font-body text-xs text-karis-stone-700">User IDs (comma-separated)</Label>
            <Input id="promo-users" name="eligibleUserIds" placeholder="user-id-1, user-id-2" className="font-body text-sm" />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="promo-start" className="font-body text-xs text-karis-stone-700">Starts at <span className="text-status-red">*</span></Label>
          <Input id="promo-start" name="startsAt" type="datetime-local" required className="font-body text-sm" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="promo-end" className="font-body text-xs text-karis-stone-700">Ends at <span className="text-status-red">*</span></Label>
          <Input id="promo-end" name="endsAt" type="datetime-local" required className="font-body text-sm" />
        </div>
      </div>

      {error && <p className="font-body text-xs text-status-red">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="font-body text-sm min-h-[44px]">
          {pending ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
          Create promotion
        </Button>
      </div>
    </form>
  )
}
