'use client'

import { useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Prisma } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { requestSettlementAction } from '@/app/(resident)/_actions/wallet'

interface SettlementRequestSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  balance: string
}

const schema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  purpose: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function SettlementRequestSheet({ open, onOpenChange, balance }: SettlementRequestSheetProps) {
  const [isPending, startTransition] = useTransition()
  const balanceDecimal = new Prisma.Decimal(balance)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '', purpose: '' },
  })

  const watchAmount = useWatch({ control, name: 'amount', defaultValue: '' })

  const estimatedFee = (() => {
    const n = parseFloat(watchAmount)
    if (isNaN(n) || n <= 0) return null
    const fee = n * 0.01
    return fee.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  })()

  const amountExceedsBalance = (() => {
    const n = parseFloat(watchAmount)
    if (isNaN(n) || n <= 0) return false
    return new Prisma.Decimal(n).gt(balanceDecimal)
  })()

  function onSubmit(values: FormValues) {
    if (amountExceedsBalance) return

    startTransition(async () => {
      try {
        await requestSettlementAction(values.amount, values.purpose ?? '')
        toast.success('Settlement request submitted', {
          description: 'Your request is pending Admin approval.',
        })
        reset()
        onOpenChange(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to submit request')
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-heading text-karis-green-900">Request settlement</SheetTitle>
          <SheetDescription className="font-body text-sm text-karis-stone-500">
            Convert K Credits back to fiat. Subject to Admin approval.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-body text-karis-stone-500">Amount (K Credits)</Label>
              <span className="text-xs font-body text-karis-stone-400 tabular-nums">
                Max: K {balanceDecimal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </span>
            </div>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className="font-body text-sm tabular-nums"
              {...register('amount')}
            />
            {errors.amount && (
              <p className="text-xs text-status-red font-body">{errors.amount.message}</p>
            )}
            {amountExceedsBalance && (
              <p className="text-xs text-status-red font-body">Amount exceeds your balance</p>
            )}
          </div>

          {estimatedFee && !amountExceedsBalance && (
            <div className="bg-karis-stone-50 border border-karis-stone-100 rounded-lg px-4 py-3">
              <p className="text-xs font-body text-karis-stone-500">Estimated fee (1%)</p>
              <p className="font-body text-sm text-karis-green-900 tabular-nums">
                <span className="text-karis-gold-700">K </span>{estimatedFee}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-body text-karis-stone-500">Purpose (optional)</Label>
            <Textarea
              placeholder="e.g. School fees, medical, travel…"
              className="font-body text-sm resize-none"
              rows={3}
              {...register('purpose')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 font-body text-sm min-h-[44px]"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-karis-green-900 text-white font-body text-sm min-h-[44px]"
              disabled={isPending || amountExceedsBalance}
            >
              {isPending ? 'Submitting…' : 'Submit request'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
