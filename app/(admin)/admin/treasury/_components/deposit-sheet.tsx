'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { adminDepositsApi, getBrowserApi } from '@/lib/api'

const schema = z.object({
  userId: z.string().min(1, 'Select a member'),
  fiatAmount: z.string().min(1, 'Amount is required'),
  currency: z.string().min(1),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface User {
  id: string
  fullName: string
  email: string
  memberId: string
}

interface DepositSheetProps {
  users: User[]
}

export function DepositSheet({ users }: DepositSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [proofUrl, setProofUrl] = useState<string>('')
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currency: 'USD', userId: '', paymentMethod: '', fiatAmount: '' },
  })

  const watchAmount = useWatch({ control, name: 'fiatAmount', defaultValue: '' })
  const kPreview = (() => {
    const n = parseFloat(watchAmount)
    if (isNaN(n) || n <= 0) return null
    return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  })()

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        const result = await adminDepositsApi.record(getBrowserApi(), {
          ...values,
          proofUrl: proofUrl || undefined,
        })
        const kDisplay = parseFloat(result.kcrdAmount).toFixed(2)
        toast.success(`Deposit recorded — K ${kDisplay} issued`, {
          description: `Transaction ${result.transactionId.slice(0, 8)}`,
        })
        reset()
        setProofUrl('')
        setOpen(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to record deposit')
      }
    })
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="font-body text-sm gap-2">
        <PlusCircle size={16} />
        Record deposit
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-heading text-karis-green-900">Record deposit</SheetTitle>
            <SheetDescription className="font-body text-sm text-karis-stone-500">
              Record a fiat payment and issue the equivalent K Credits to the member.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Member select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Member</Label>
              <Select onValueChange={(v: string | null) => { if (v !== null) setValue('userId', v) }}>
                <SelectTrigger className="font-body text-sm">
                  <SelectValue placeholder="Select member…" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="font-body text-sm">
                      {u.fullName} ({u.memberId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.userId && (
                <p className="text-xs text-status-red font-body">{errors.userId.message}</p>
              )}
            </div>

            {/* Amount + currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">Fiat amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="font-body text-sm tabular-nums"
                  {...register('fiatAmount')}
                />
                {errors.fiatAmount && (
                  <p className="text-xs text-status-red font-body">{errors.fiatAmount.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">Currency</Label>
                <Select defaultValue="USD" onValueChange={(v: string | null) => { if (v !== null) setValue('currency', v) }}>
                  <SelectTrigger className="font-body text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD" className="font-body text-sm">USD</SelectItem>
                    <SelectItem value="GYD" className="font-body text-sm">GYD</SelectItem>
                    <SelectItem value="CAD" className="font-body text-sm">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* K Credits preview */}
            {kPreview && (
              <div className="bg-karis-green-900/5 border border-karis-green-900/10 rounded-lg px-4 py-3">
                <p className="text-xs font-body text-karis-stone-500">K Credits to be issued</p>
                <p className="text-xl font-heading text-karis-green-900 tabular-nums">
                  <span className="text-karis-gold-700">K </span>{kPreview}
                </p>
              </div>
            )}

            {/* Payment method */}
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Payment method</Label>
              <Input
                placeholder="e.g. Bank transfer, Cash, Wise"
                className="font-body text-sm"
                {...register('paymentMethod')}
              />
              {errors.paymentMethod && (
                <p className="text-xs text-status-red font-body">{errors.paymentMethod.message}</p>
              )}
            </div>

            {/* Proof URL */}
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">
                Proof of payment URL (optional)
              </Label>
              <Input
                type="url"
                placeholder="https://…"
                className="font-body text-sm"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Notes (optional)</Label>
              <Input
                placeholder="Any additional notes…"
                className="font-body text-sm"
                {...register('notes')}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 font-body text-sm"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 font-body text-sm" disabled={isPending}>
                {isPending ? 'Recording…' : 'Record deposit'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
