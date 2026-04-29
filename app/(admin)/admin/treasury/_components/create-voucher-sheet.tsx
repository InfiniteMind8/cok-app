'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Ticket } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileUpload, type UploadedFile } from '@/components/ui/file-upload'
import { createVoucherAction } from '@/app/(admin)/_actions/vouchers'

const schema = z.object({
  recipientId: z.string().min(1, 'Recipient is required *'),
  amountKcrd: z.string().min(1, 'Amount is required *'),
  message: z.string().optional(),
  expiresAt: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface UserOption {
  id: string
  fullName: string
  memberId: string
}

interface CreateVoucherSheetProps {
  users: UserOption[]
}

export function CreateVoucherSheet({ users }: CreateVoucherSheetProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [attachmentFiles, setAttachmentFiles] = useState<UploadedFile[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  function handleClose() {
    if (isDirty) {
      if (!confirm('Discard unsaved changes?')) return
    }
    reset()
    setAttachmentFiles([])
    setOpen(false)
  }

  function onSubmit(values: FormValues) {
    const file = attachmentFiles[0]
    startTransition(async () => {
      try {
        await createVoucherAction({
          ...values,
          attachmentKey: file?.url,
          attachmentName: file?.name,
          attachmentSize: file?.size,
          attachmentMime: file?.type,
        })
        toast.success('Voucher request created', {
          description: 'Pending approval in the Approvals Center.',
        })
        reset()
        setAttachmentFiles([])
        setOpen(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to create voucher')
      }
    })
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="font-body text-sm gap-2">
        <Ticket size={16} />
        Issue voucher
      </Button>

      <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-heading text-karis-green-900">Issue voucher</SheetTitle>
            <SheetDescription className="font-body text-sm text-karis-stone-500">
              Create a KCRD voucher for a community member. Requires approval before delivery.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">
                Recipient <span className="text-status-red">*</span>
              </Label>
              <Select onValueChange={(v: string | null) => { if (v !== null) setValue('recipientId', v) }}>
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
              {errors.recipientId && (
                <p className="text-xs text-status-red font-body">{errors.recipientId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">
                  Amount (KCRD) <span className="text-status-red">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="font-body text-sm tabular-nums"
                  {...register('amountKcrd')}
                />
                {errors.amountKcrd && (
                  <p className="text-xs text-status-red font-body">{errors.amountKcrd.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">Expiry date</Label>
                <Input type="date" className="font-body text-sm" {...register('expiresAt')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Message to recipient</Label>
              <Textarea
                className="font-body text-sm resize-none"
                rows={3}
                placeholder="A note to include with the voucher…"
                {...register('message')}
              />
            </div>

            <FileUpload
              endpoint={{ entityType: 'VOUCHER_REQUEST', fieldName: 'attachment', category: 'voucher' }}
              label="Attachment (PDF, optional — max 5 MB)"
              value={attachmentFiles}
              onComplete={(files) => setAttachmentFiles(files.slice(0, 1))}
              onRemove={() => setAttachmentFiles([])}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 font-body text-sm"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 font-body text-sm" disabled={isPending}>
                {isPending ? 'Creating…' : 'Create voucher'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
