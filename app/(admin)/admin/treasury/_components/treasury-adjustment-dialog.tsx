'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { adminTreasuryApi, getBrowserApi } from '@/lib/api'

const schema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().min(1),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
})

type FormValues = z.infer<typeof schema>

export function TreasuryAdjustmentDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currency: 'USD', amount: '', reason: '' },
  })

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await adminTreasuryApi.recordAdjustment(getBrowserApi(), values)
        toast.success('Treasury backing updated')
        reset()
        setOpen(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update backing')
      }
    })
  }

  return (
    <>
      <Button variant="outline" size="sm" className="font-body text-sm" onClick={() => setOpen(true)}>
        Update backing
      </Button>

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle className="font-heading text-karis-green-900">
              Update treasury backing
            </ModalTitle>
            <ModalDescription className="font-body text-sm text-karis-stone-500">
              Record a change to the fiat reserves backing K Credits.
            </ModalDescription>
          </ModalHeader>

          <ModalBody>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs font-body text-karis-stone-500">Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="font-body text-sm tabular-nums"
                    {...register('amount')}
                  />
                  {errors.amount && (
                    <p className="text-xs text-status-red font-body">{errors.amount.message}</p>
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

              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">Reason</Label>
                <Textarea
                  placeholder="Describe this treasury adjustment…"
                  className="font-body text-sm resize-none"
                  rows={3}
                  {...register('reason')}
                />
                {errors.reason && (
                  <p className="text-xs text-status-red font-body">{errors.reason.message}</p>
                )}
              </div>
            </form>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { reset(); setOpen(false) }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={isPending}>
              {isPending ? 'Saving…' : 'Save adjustment'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
