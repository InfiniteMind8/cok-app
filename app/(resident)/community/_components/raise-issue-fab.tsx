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
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal'
import { FileUpload, type UploadedFile } from '@/components/ui/file-upload'
import { raiseIssueAction } from '@/app/(resident)/_actions/community'

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title max 120 characters'),
  seriousness: z.enum(['YELLOW', 'ORANGE', 'RED']),
  urgency: z.enum(['YELLOW', 'ORANGE', 'RED']),
  category: z.string().min(1, 'Select a category'),
  message: z.string().min(10, 'Please describe the issue (min 10 characters)'),
  location: z.string().optional(),
  contactPreference: z.enum(['NoContact', 'Email', 'InApp']).optional(),
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
  const [mediaFiles, setMediaFiles] = useState<UploadedFile[]>([])

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: '', message: '', contactPreference: 'InApp' },
  })

  function handleClose() {
    reset()
    setMediaFiles([])
    setOpen(false)
  }

  function onSubmit(values: FormValues) {
    const photos = mediaFiles.filter((f) => f.type.startsWith('image/'))
    const videos = mediaFiles.filter((f) => f.type.startsWith('video/'))

    const attachments = [
      ...photos.map((f) => ({
        storageKey: f.url,
        mimeType: f.type,
        sizeBytes: f.size,
        name: f.name,
        fieldName: 'photo',
      })),
      ...videos.map((f) => ({
        storageKey: f.url,
        mimeType: f.type,
        sizeBytes: f.size,
        name: f.name,
        fieldName: 'video',
      })),
    ]

    startTransition(async () => {
      try {
        await raiseIssueAction({
          ...values,
          attachments: attachments.length > 0 ? attachments : undefined,
        })
        toast.success('Issue raised', {
          description: 'Your issue has been submitted to the Admin team.',
        })
        handleClose()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to raise issue')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-karis-green-900 text-white rounded-full shadow-md flex items-center justify-center border-2 border-karis-gold-500 hover:bg-karis-green-700 transition-colors duration-150 ease-out"
        aria-label="Raise an issue"
      >
        <Plus size={24} />
      </button>

      <Modal open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
        <ModalContent size="lg">
          <ModalHeader>
            <ModalTitle className="font-heading text-karis-green-900">Raise an issue</ModalTitle>
            <ModalDescription className="font-body text-sm text-karis-stone-500">
              Report a concern to the Admin team. They will follow up directly.
            </ModalDescription>
          </ModalHeader>

          <ModalBody>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">
                  Title <span className="text-status-red">*</span>
                </Label>
                <Input
                  className="font-body text-sm"
                  placeholder="Brief description of the issue"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-xs text-status-red font-body">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">
                  Seriousness <span className="text-status-red">*</span>
                </Label>
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
                <Label className="text-xs font-body text-karis-stone-500">
                  Urgency <span className="text-status-red">*</span>
                </Label>
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
                <Label className="text-xs font-body text-karis-stone-500">
                  Category <span className="text-status-red">*</span>
                </Label>
                <Select onValueChange={(v: string | null) => { if (v !== null) setValue('category', v) }}>
                  <SelectTrigger className="font-body text-sm">
                    <SelectValue placeholder="Select category…" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Maintenance', 'Security', 'Treasury', 'Property', 'Noise', 'Cleanliness', 'Other'].map((c) => (
                      <SelectItem key={c} value={c} className="font-body text-sm">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-xs text-status-red font-body">{errors.category.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">
                  Description <span className="text-status-red">*</span>
                </Label>
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

              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">Location</Label>
                <Input
                  className="font-body text-sm"
                  placeholder="e.g. North Sector, Block 3, Stairwell B"
                  {...register('location')}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">Contact preference</Label>
                <div className="flex gap-2">
                  {(['NoContact', 'Email', 'InApp'] as const).map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => setValue('contactPreference', pref)}
                      className={cn(
                        'flex-1 py-2 rounded-lg border font-body text-xs transition-all duration-150 min-h-[40px]',
                        'border-karis-stone-200 text-karis-stone-500 bg-white',
                      )}
                    >
                      <Controller
                        control={control}
                        name="contactPreference"
                        render={({ field }) => (
                          <span className={cn(
                            field.value === pref ? 'text-karis-green-900 font-semibold' : '',
                          )}>
                            {pref === 'NoContact' ? 'No contact' : pref === 'Email' ? 'Email me' : 'In-app'}
                          </span>
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <FileUpload
                endpoint={{ entityType: 'ISSUE', fieldName: 'media', category: 'photo' }}
                label="Photos or video (optional — max 5 photos, 1 video up to 50 MB)"
                value={mediaFiles}
                onComplete={(files) => setMediaFiles((prev) => [...prev, ...files])}
                onRemove={(key) => setMediaFiles((prev) => prev.filter((f) => f.key !== key))}
              />
            </form>
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              className="font-body text-sm min-h-[44px]"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-karis-green-900 text-white font-body text-sm min-h-[44px]"
              onClick={handleSubmit(onSubmit)}
              disabled={isPending}
            >
              {isPending ? 'Submitting…' : 'Raise issue'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
