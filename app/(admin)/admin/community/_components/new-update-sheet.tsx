'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
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
import { publishUpdateAction } from '@/app/(admin)/_actions/community'

const schema = z.object({
  headline: z.string().min(1, 'Headline required'),
  category: z.string().min(1, 'Category required'),
  message: z.string().min(1, 'Message required'),
  photoUrl: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function NewUpdateSheet() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await publishUpdateAction(values)
        toast.success('Update published')
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
        <Plus size={16} /> New update
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-heading text-karis-green-900">New community update</SheetTitle>
            <SheetDescription className="font-body text-sm text-karis-stone-500">
              Published immediately to all members.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Headline</Label>
              <Input className="font-body text-sm" placeholder="What's happening?" {...register('headline')} />
              {errors.headline && <p className="text-xs text-status-red font-body">{errors.headline.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Category</Label>
              <Input className="font-body text-sm" placeholder="e.g. Infrastructure, Health, Events" {...register('category')} />
              {errors.category && <p className="text-xs text-status-red font-body">{errors.category.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Message</Label>
              <Textarea className="font-body text-sm resize-none" rows={6} placeholder="Full update message…" {...register('message')} />
              {errors.message && <p className="text-xs text-status-red font-body">{errors.message.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Photo URL (optional)</Label>
              <Input type="url" className="font-body text-sm" placeholder="https://…" {...register('photoUrl')} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 font-body text-sm" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
              <Button type="submit" className="flex-1 font-body text-sm" disabled={isPending}>
                {isPending ? 'Publishing…' : 'Publish update'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
