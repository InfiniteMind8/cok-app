'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/modal'
import { createGroupAction } from '@/app/(admin)/_actions/visitor-groups'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  theme: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
})
type FormValues = z.infer<typeof schema>

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await createGroupAction(values)
        toast.success('Visitor group created')
        reset()
        setOpen(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to create group')
      }
    })
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="font-body text-sm gap-2">
        <Plus size={16} /> New group
      </Button>

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Create visitor group</ModalTitle>
          </ModalHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-body text-karis-stone-500">Group name</Label>
            <Input
              className="font-body text-sm"
              placeholder="e.g. Corporate Training 1"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-status-red font-body">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-body text-karis-stone-500">Theme (optional)</Label>
            <Input
              className="font-body text-sm"
              placeholder="e.g. Corporate Training, Spiritual Retreat"
              {...register('theme')}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-body text-karis-stone-500">Description</Label>
            <Textarea
              className="font-body text-sm resize-none"
              rows={3}
              placeholder="Purpose and context for this group…"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-status-red font-body">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="font-body text-sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="font-body text-sm">
              {isPending ? 'Creating…' : 'Create group'}
            </Button>
          </div>
        </form>
        </ModalContent>
      </Modal>
    </>
  )
}
