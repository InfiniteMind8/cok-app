'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/modal'
import { adminVisitorGroupsApi, getBrowserApi } from '@/lib/api'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  theme: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
})
type FormValues = z.infer<typeof schema>

export function EditGroupDialog({
  id,
  defaultValues,
}: {
  id: string
  defaultValues: { name: string; theme?: string | null; description: string }
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues.name,
      theme: defaultValues.theme ?? '',
      description: defaultValues.description,
    },
  })

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await adminVisitorGroupsApi.edit(getBrowserApi(), id, values)
        toast.success('Group updated')
        setOpen(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update group')
      }
    })
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="font-body text-xs gap-1.5 h-8"
        onClick={() => setOpen(true)}
      >
        <Pencil size={12} /> Edit
      </Button>

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Edit visitor group</ModalTitle>
          </ModalHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-body text-karis-stone-500">Group name</Label>
            <Input className="font-body text-sm" {...register('name')} />
            {errors.name && (
              <p className="text-xs text-status-red font-body">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-body text-karis-stone-500">Theme (optional)</Label>
            <Input className="font-body text-sm" {...register('theme')} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-body text-karis-stone-500">Description</Label>
            <Textarea className="font-body text-sm resize-none" rows={3} {...register('description')} />
            {errors.description && (
              <p className="text-xs text-status-red font-body">{errors.description.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" className="font-body text-sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="font-body text-sm">
              {isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
        </ModalContent>
      </Modal>
    </>
  )
}
