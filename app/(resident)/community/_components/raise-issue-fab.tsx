'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { IssueLevel } from '@prisma/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { raiseIssueAction } from '@/app/(resident)/_actions/community'

const schema = z.object({
  seriousness: z.enum(['YELLOW', 'ORANGE', 'RED']),
  urgency: z.enum(['YELLOW', 'ORANGE', 'RED']),
  category: z.string().min(1, 'Select a category'),
  message: z.string().min(10, 'Please describe the issue (min 10 characters)'),
})

type FormValues = z.infer<typeof schema>

const LEVELS: { value: IssueLevel; label: string; color: string }[] = [
  { value: 'YELLOW', label: 'Low', color: 'bg-status-yellow text-karis-stone-900 border-status-yellow' },
  { value: 'ORANGE', label: 'Medium', color: 'bg-status-orange text-white border-status-orange' },
  { value: 'RED', label: 'High', color: 'bg-status-red text-white border-status-red' },
]

function LevelPicker({
  value,
  onChange,
}: {
  value: IssueLevel | undefined
  onChange: (v: IssueLevel) => void
}) {
  return (
    <div className="flex gap-2">
      {LEVELS.map((l) => (
        <button
          key={l.value}
          type="button"
          onClick={() => onChange(l.value)}
          className={cn(
            'flex-1 py-2 rounded-lg border-2 font-body text-xs font-medium transition-all duration-150 min-h-[44px]',
            value === l.value ? l.color : 'border-karis-stone-200 text-karis-stone-500 bg-white',
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

export function RaiseIssueFab() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: '', message: '' },
  })

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await raiseIssueAction(values)
        toast.success('Issue raised', {
          description: 'Your issue has been submitted to the Admin team.',
        })
        reset()
        setOpen(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to raise issue')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-karis-green-900 text-white rounded-full shadow-md flex items-center justify-center border-2 border-karis-gold-500 hover:bg-karis-green-700 transition-colors duration-150 ease-out"
        aria-label="Raise an issue"
      >
        <Plus size={24} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm w-full mx-4">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-heading text-karis-green-900">Raise an issue</DialogTitle>
            <DialogDescription className="font-body text-sm text-karis-stone-500">
              Report a concern to the Admin team. They will follow up directly.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Seriousness</Label>
              <Controller
                control={control}
                name="seriousness"
                render={({ field }) => (
                  <LevelPicker value={field.value} onChange={field.onChange} />
                )}
              />
              {errors.seriousness && (
                <p className="text-xs text-status-red font-body">{errors.seriousness.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Urgency</Label>
              <Controller
                control={control}
                name="urgency"
                render={({ field }) => (
                  <LevelPicker value={field.value} onChange={field.onChange} />
                )}
              />
              {errors.urgency && (
                <p className="text-xs text-status-red font-body">{errors.urgency.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Category</Label>
              <Select onValueChange={(v: string | null) => { if (v !== null) setValue('category', v) }}>
                <SelectTrigger className="font-body text-sm">
                  <SelectValue placeholder="Select category…" />
                </SelectTrigger>
                <SelectContent>
                  {['Maintenance', 'Security', 'Treasury', 'Property', 'Other'].map((c) => (
                    <SelectItem key={c} value={c} className="font-body text-sm">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-status-red font-body">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Description</Label>
              <Textarea
                placeholder="Describe the issue in detail…"
                className="font-body text-sm resize-none"
                rows={4}
                {...register('message')}
              />
              {errors.message && (
                <p className="text-xs text-status-red font-body">{errors.message.message}</p>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1 font-body text-sm min-h-[44px]"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-karis-green-900 text-white font-body text-sm min-h-[44px]"
                disabled={isPending}
              >
                {isPending ? 'Submitting…' : 'Raise issue'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
