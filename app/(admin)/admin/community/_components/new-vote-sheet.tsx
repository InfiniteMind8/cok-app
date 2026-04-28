'use client'

import { useState, useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2, Vote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createVoteAction, closeVoteAction } from '@/app/(admin)/_actions/community'

const schema = z.object({
  headline: z.string().min(1, 'Headline required'),
  description: z.string().min(1, 'Description required'),
  options: z.array(z.object({
    label: z.string().min(1, 'Option label required'),
    description: z.string().min(1, 'Option description required'),
  })).min(2, 'At least 2 options required'),
})
type FormValues = z.infer<typeof schema>

export function NewVoteSheet() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { options: [{ label: '', description: '' }, { label: '', description: '' }] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'options' })

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await createVoteAction(values)
        toast.success('Vote created and opened')
        reset()
        setOpen(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="font-body text-sm gap-2">
        <Vote size={16} /> New vote
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-heading text-karis-green-900">Create vote</SheetTitle>
            <SheetDescription className="font-body text-sm text-karis-stone-500">
              Opens immediately for member participation.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Headline</Label>
              <Input className="font-body text-sm" placeholder="What should members vote on?" {...register('headline')} />
              {errors.headline && <p className="text-xs text-status-red font-body">{errors.headline.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Description</Label>
              <Textarea className="font-body text-sm resize-none" rows={3} placeholder="Provide context for this vote…" {...register('description')} />
              {errors.description && <p className="text-xs text-status-red font-body">{errors.description.message}</p>}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-body text-karis-stone-500">Options</Label>
                <button
                  type="button"
                  onClick={() => append({ label: '', description: '' })}
                  className="text-xs font-body text-karis-green-700 hover:text-karis-green-900 flex items-center gap-1"
                >
                  <Plus size={12} /> Add option
                </button>
              </div>
              {errors.options && typeof errors.options.message === 'string' && (
                <p className="text-xs text-status-red font-body">{errors.options.message}</p>
              )}
              {fields.map((field, index) => (
                <div key={field.id} className="bg-karis-stone-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-body text-karis-stone-500">Option {index + 1}</span>
                    {fields.length > 2 && (
                      <button type="button" onClick={() => remove(index)} className="text-karis-stone-400 hover:text-status-red" aria-label="Remove option">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <Input className="font-body text-sm bg-white" placeholder="Option label" {...register(`options.${index}.label`)} />
                  <Textarea className="font-body text-sm bg-white resize-none" rows={2} placeholder="Describe this option…" {...register(`options.${index}.description`)} />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 font-body text-sm" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
              <Button type="submit" className="flex-1 font-body text-sm" disabled={isPending}>
                {isPending ? 'Creating…' : 'Open vote'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}

export function CloseVoteButton({ voteId, headline }: { voteId: string; headline: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleClose() {
    startTransition(async () => {
      try {
        await closeVoteAction(voteId)
        toast.success('Vote closed')
        setOpen(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="font-body text-xs h-7 px-3">
        Close vote
      </Button>
      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent dismissOnBackdrop={false}>
          <ModalHeader>
            <ModalTitle className="font-heading text-karis-green-900">Close vote?</ModalTitle>
            <ModalDescription className="font-body text-sm text-karis-stone-500">
              &ldquo;{headline}&rdquo; — members will no longer be able to submit responses.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" className="font-body text-sm" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button className="font-body text-sm" onClick={handleClose} disabled={isPending}>
              {isPending ? 'Closing…' : 'Close vote'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
