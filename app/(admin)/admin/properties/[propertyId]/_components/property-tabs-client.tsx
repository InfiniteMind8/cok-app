'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  addInstallmentAction,
  assignOwnerAction,
  assignTenantAction,
} from '@/app/(admin)/_actions/properties'

// ─── Add Installment ────────────────────────────────────────────────────────

const installSchema = z.object({
  number: z.string().min(1),
  dueDate: z.string().min(1, 'Due date required'),
  amount: z.string().min(1, 'Amount required'),
  progressNote: z.string().optional(),
})

type InstallFormValues = z.infer<typeof installSchema>

export function AddInstallmentDialog({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<InstallFormValues>({
    resolver: zodResolver(installSchema),
  })

  function onSubmit(values: InstallFormValues) {
    startTransition(async () => {
      try {
        await addInstallmentAction({ ...values, propertyId, number: parseInt(values.number, 10) })
        toast.success('Installment added')
        reset()
        setOpen(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="font-body text-sm gap-1.5">
        <Plus size={14} /> Add installment
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-karis-green-900">Add installment</DialogTitle>
          </DialogHeader>
          <form className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">Installment #</Label>
                <Input type="number" min={1} className="font-body text-sm" {...register('number')} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">Due date</Label>
                <Input type="date" className="font-body text-sm" {...register('dueDate')} />
                {errors.dueDate && <p className="text-xs text-status-red font-body">{errors.dueDate.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Amount</Label>
              <Input type="number" step="0.01" placeholder="0.00" className="font-body text-sm tabular-nums" {...register('amount')} />
              {errors.amount && <p className="text-xs text-status-red font-body">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Progress note (optional)</Label>
              <Input placeholder="e.g. Foundation poured" className="font-body text-sm" {...register('progressNote')} />
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={isPending}>
              {isPending ? 'Saving…' : 'Add installment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Assign Owner ────────────────────────────────────────────────────────────

const ownerSchema = z.object({
  userId: z.string().min(1, 'Select a member'),
  ownershipPct: z.string().min(1),
  contractDate: z.string().min(1, 'Contract date required'),
  contractUrl: z.string().optional(),
})
type OwnerFormValues = z.infer<typeof ownerSchema>

interface UserOption { id: string; fullName: string; memberId: string }

export function AssignOwnerDialog({ propertyId, users }: { propertyId: string; users: UserOption[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<OwnerFormValues>({
    resolver: zodResolver(ownerSchema),
    defaultValues: { ownershipPct: '100' },
  })

  function onSubmit(values: OwnerFormValues) {
    startTransition(async () => {
      try {
        await assignOwnerAction({
          ...values,
          propertyId,
          ownershipPct: parseFloat(values.ownershipPct),
        })
        toast.success('Owner assigned')
        reset()
        setOpen(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="font-body text-sm gap-1.5">
        <Plus size={14} /> Assign owner
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-karis-green-900">Assign owner</DialogTitle>
          </DialogHeader>
          <form className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Member</Label>
              <Select onValueChange={(v: string | null) => { if (v !== null) setValue('userId', v) }}>
                <SelectTrigger className="font-body text-sm"><SelectValue placeholder="Select member…" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="font-body text-sm">
                      {u.fullName} ({u.memberId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.userId && <p className="text-xs text-status-red font-body">{errors.userId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">Ownership %</Label>
                <Input type="number" min={1} max={100} className="font-body text-sm" {...register('ownershipPct')} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">Contract date</Label>
                <Input type="date" className="font-body text-sm" {...register('contractDate')} />
                {errors.contractDate && <p className="text-xs text-status-red font-body">{errors.contractDate.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Contract URL (optional)</Label>
              <Input type="url" placeholder="https://…" className="font-body text-sm" {...register('contractUrl')} />
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={isPending}>
              {isPending ? 'Saving…' : 'Assign owner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Assign Tenant ───────────────────────────────────────────────────────────

const tenantSchema = z.object({
  userId: z.string().min(1, 'Select a member'),
  cycle: z.string().min(1, 'Cycle required'),
  cyclePayment: z.string().min(1, 'Cycle payment required'),
  contractDate: z.string().min(1, 'Contract date required'),
  contractUrl: z.string().optional(),
})
type TenantFormValues = z.infer<typeof tenantSchema>

export function AssignTenantDialog({ propertyId, users }: { propertyId: string; users: UserOption[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
  })

  function onSubmit(values: TenantFormValues) {
    startTransition(async () => {
      try {
        await assignTenantAction({ ...values, propertyId })
        toast.success('Tenant assigned')
        reset()
        setOpen(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="font-body text-sm gap-1.5">
        <Plus size={14} /> Assign tenant
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-karis-green-900">Assign tenant</DialogTitle>
          </DialogHeader>
          <form className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Member</Label>
              <Select onValueChange={(v: string | null) => { if (v !== null) setValue('userId', v) }}>
                <SelectTrigger className="font-body text-sm"><SelectValue placeholder="Select member…" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="font-body text-sm">
                      {u.fullName} ({u.memberId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.userId && <p className="text-xs text-status-red font-body">{errors.userId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">Rental cycle</Label>
                <Select onValueChange={(v: string | null) => { if (v !== null) setValue('cycle', v) }}>
                  <SelectTrigger className="font-body text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly" className="font-body text-sm">Monthly</SelectItem>
                    <SelectItem value="weekly" className="font-body text-sm">Weekly</SelectItem>
                    <SelectItem value="annual" className="font-body text-sm">Annual</SelectItem>
                    <SelectItem value="daily" className="font-body text-sm">Daily</SelectItem>
                  </SelectContent>
                </Select>
                {errors.cycle && <p className="text-xs text-status-red font-body">{errors.cycle.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">Cycle payment</Label>
                <Input type="number" step="0.01" placeholder="0.00" className="font-body text-sm tabular-nums" {...register('cyclePayment')} />
                {errors.cyclePayment && <p className="text-xs text-status-red font-body">{errors.cyclePayment.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Contract date</Label>
              <Input type="date" className="font-body text-sm" {...register('contractDate')} />
              {errors.contractDate && <p className="text-xs text-status-red font-body">{errors.contractDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Contract URL (optional)</Label>
              <Input type="url" placeholder="https://…" className="font-body text-sm" {...register('contractUrl')} />
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={isPending}>
              {isPending ? 'Saving…' : 'Assign tenant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
