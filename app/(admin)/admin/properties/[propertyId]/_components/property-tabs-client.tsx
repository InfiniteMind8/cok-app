'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { adminPropertiesApi, getBrowserApi } from '@/lib/api'
import { FileUpload, type UploadedFile } from '@/components/ui/file-upload'

// ─── Add Installment ────────────────────────────────────────────────────────

const installSchema = z.object({
  number: z.string().min(1),
  dueDate: z.string().min(1, 'Due date required'),
  amount: z.string().min(1, 'Amount required'),
  progressNote: z.string().optional(),
})

type InstallFormValues = z.infer<typeof installSchema>

export function AddInstallmentDialog({ propertyId }: { propertyId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<InstallFormValues>({
    resolver: zodResolver(installSchema),
  })

  function onSubmit(values: InstallFormValues) {
    startTransition(async () => {
      try {
        await adminPropertiesApi.addInstallment(getBrowserApi(), propertyId, {
          number: parseInt(values.number, 10),
          dueDate: values.dueDate,
          amount: values.amount,
          progressNote: values.progressNote,
        })
        toast.success('Installment added')
        reset()
        setOpen(false)
        router.refresh()
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
      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle className="font-heading text-karis-green-900">Add installment</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <form className="space-y-4">
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
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={isPending}>
              {isPending ? 'Saving…' : 'Add installment'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<OwnerFormValues>({
    resolver: zodResolver(ownerSchema),
    defaultValues: { ownershipPct: '100' },
  })

  function onSubmit(values: OwnerFormValues) {
    startTransition(async () => {
      try {
        await adminPropertiesApi.assignOwner(getBrowserApi(), propertyId, {
          userId: values.userId,
          ownershipPct: parseFloat(values.ownershipPct),
          contractDate: values.contractDate,
          contractUrl: values.contractUrl,
        })
        toast.success('Owner assigned')
        reset()
        setOpen(false)
        router.refresh()
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
      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle className="font-heading text-karis-green-900">Assign owner</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <form className="space-y-4">
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
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={isPending}>
              {isPending ? 'Saving…' : 'Assign owner'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

// ─── Assign Tenant ───────────────────────────────────────────────────────────

const tenantSchema = z.object({
  userId: z.string().min(1, 'Select a member'),
  cycle: z.string().min(1, 'Cycle unit required'),
  cyclePayment: z.string().min(1, 'Cycle payment (KCRD) required'),
  contractDate: z.string().min(1, 'Contract date required'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  depositAmount: z.string().optional(),
})
type TenantFormValues = z.infer<typeof tenantSchema>

export function AssignTenantDialog({ propertyId, users }: { propertyId: string; users: UserOption[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [leaseFiles, setLeaseFiles] = useState<UploadedFile[]>([])
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
  })

  function handleClose() {
    reset()
    setLeaseFiles([])
    setOpen(false)
  }

  function onSubmit(values: TenantFormValues) {
    const leaseFile = leaseFiles[0]
    startTransition(async () => {
      try {
        await adminPropertiesApi.assignTenant(getBrowserApi(), propertyId, {
          userId: values.userId,
          cycle: values.cycle,
          cyclePayment: values.cyclePayment,
          contractDate: values.contractDate,
          startDate: values.startDate,
          endDate: values.endDate,
          depositAmount: values.depositAmount,
          leaseAgreementKey: leaseFile?.url,
          leaseAgreementName: leaseFile?.name,
          leaseAgreementSize: leaseFile?.size,
          leaseAgreementMime: leaseFile?.type,
        })
        toast.success('Tenant assigned')
        handleClose()
        router.refresh()
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
      <Modal open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
        <ModalContent size="lg">
          <ModalHeader>
            <ModalTitle className="font-heading text-karis-green-900">Assign tenant</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <form className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">Resident <span className="text-status-red">*</span></Label>
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-body text-karis-stone-500">Start date</Label>
                  <Input type="date" className="font-body text-sm" {...register('startDate')} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-body text-karis-stone-500">End date</Label>
                  <Input type="date" className="font-body text-sm" {...register('endDate')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-body text-karis-stone-500">Cycle unit <span className="text-status-red">*</span></Label>
                  <Select onValueChange={(v: string | null) => { if (v !== null) setValue('cycle', v) }}>
                    <SelectTrigger className="font-body text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY" className="font-body text-sm">Daily</SelectItem>
                      <SelectItem value="WEEKLY" className="font-body text-sm">Weekly</SelectItem>
                      <SelectItem value="MONTHLY" className="font-body text-sm">Monthly</SelectItem>
                      <SelectItem value="ANNUAL" className="font-body text-sm">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.cycle && <p className="text-xs text-status-red font-body">{errors.cycle.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-body text-karis-stone-500">Cycle amount (KCRD) <span className="text-status-red">*</span></Label>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" className="font-body text-sm tabular-nums" {...register('cyclePayment')} />
                  {errors.cyclePayment && <p className="text-xs text-status-red font-body">{errors.cyclePayment.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-body text-karis-stone-500">Deposit amount (KCRD)</Label>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" className="font-body text-sm tabular-nums" {...register('depositAmount')} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-body text-karis-stone-500">Contract date <span className="text-status-red">*</span></Label>
                  <Input type="date" className="font-body text-sm" {...register('contractDate')} />
                  {errors.contractDate && <p className="text-xs text-status-red font-body">{errors.contractDate.message}</p>}
                </div>
              </div>

              <FileUpload
                endpoint={{ entityType: 'LEASE', entityId: propertyId, fieldName: 'leaseAgreement', category: 'lease_agreement' }}
                label="Lease agreement PDF"
                value={leaseFiles}
                onComplete={(files) => setLeaseFiles(files.slice(0, 1))}
                onRemove={() => setLeaseFiles([])}
              />
            </form>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" size="sm" onClick={handleClose} disabled={isPending}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={isPending}>
              {isPending ? 'Saving…' : 'Assign tenant'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
