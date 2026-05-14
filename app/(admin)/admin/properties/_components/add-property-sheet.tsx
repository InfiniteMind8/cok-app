'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
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
import { adminPropertiesApi, getBrowserApi } from '@/lib/api'

const schema = z.object({
  code: z.string().min(1, 'Property code is required *'),
  type: z.enum(['OWNERSHIP', 'RENTAL', 'ADMIN']),
  category: z.enum(['COMMERCIAL', 'RESIDENTIAL', 'MIXED']),
  propertyStatus: z.enum(['VACANT', 'OCCUPIED', 'UNDER_CONSTRUCTION']).optional(),
  address: z.string().optional(),
  addressLine2: z.string().optional(),
  lotNumber: z.string().optional(),
  sizeSqm: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  parkingSpots: z.string().optional(),
  yearBuilt: z.string().optional(),
  totalPrice: z.string().optional(),
  currentValuationKcrd: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface AttachmentGroup {
  photos: UploadedFile[]
  titleDeed: UploadedFile[]
  occupancyPermit: UploadedFile[]
  utilityDocs: UploadedFile[]
}

export function AddPropertySheet() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [attachments, setAttachments] = useState<AttachmentGroup>({
    photos: [],
    titleDeed: [],
    occupancyPermit: [],
    utilityDocs: [],
  })
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'OWNERSHIP',
      category: 'RESIDENTIAL',
      propertyStatus: 'VACANT',
    },
  })

  function handleClose() {
    if (isDirty) {
      if (!confirm('Discard unsaved changes?')) return
    }
    reset()
    setAttachments({ photos: [], titleDeed: [], occupancyPermit: [], utilityDocs: [] })
    setOpen(false)
  }

  function appendFiles(group: keyof AttachmentGroup, files: UploadedFile[]) {
    setAttachments((prev) => ({ ...prev, [group]: [...prev[group], ...files] }))
  }

  function removeFile(group: keyof AttachmentGroup, key: string) {
    setAttachments((prev) => ({
      ...prev,
      [group]: prev[group].filter((f) => f.key !== key),
    }))
  }

  function onSubmit(values: FormValues) {
    const allAttachments = [
      ...attachments.photos.map((f) => ({ ...f, fieldName: 'photos' })),
      ...attachments.titleDeed.map((f) => ({ ...f, fieldName: 'titleDeed' })),
      ...attachments.occupancyPermit.map((f) => ({ ...f, fieldName: 'occupancyPermit' })),
      ...attachments.utilityDocs.map((f) => ({ ...f, fieldName: 'utilityDocs' })),
    ]

    startTransition(async () => {
      try {
        const result = await adminPropertiesApi.create(getBrowserApi(), {
          ...values,
          photos: attachments.photos.map((f) => f.url),
          attachments: allAttachments.map((f) => ({
            storageKey: f.url,
            mimeType: f.type,
            sizeBytes: f.size,
            name: f.name,
            fieldName: f.fieldName,
          })),
        })
        toast.success(`Property ${values.code} created`)
        reset()
        setAttachments({ photos: [], titleDeed: [], occupancyPermit: [], utilityDocs: [] })
        setOpen(false)
        router.push(`/admin/properties/${result.propertyId}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to create property')
      }
    })
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="font-body text-sm gap-2">
        <Building2 size={16} />
        Add property
      </Button>

      <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-heading text-karis-green-900">Add property</SheetTitle>
            <SheetDescription className="font-body text-sm text-karis-stone-500">
              Register a new property in the City of Karis registry.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* ── Basic ── */}
            <section className="space-y-4">
              <p className="text-xs font-body text-karis-stone-400 uppercase tracking-wider">Basic</p>

              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">
                  Property code <span className="text-status-red">*</span>
                </Label>
                <Input className="font-body text-sm uppercase" placeholder="COK-001" {...register('code')} />
                {errors.code && <p className="text-xs text-status-red font-body">{errors.code.message}</p>}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-body text-karis-stone-500">Type <span className="text-status-red">*</span></Label>
                  <Select defaultValue="OWNERSHIP" onValueChange={(v) => setValue('type', v as FormValues['type'])}>
                    <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OWNERSHIP" className="font-body text-sm">Ownership</SelectItem>
                      <SelectItem value="RENTAL" className="font-body text-sm">Rental</SelectItem>
                      <SelectItem value="ADMIN" className="font-body text-sm">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-body text-karis-stone-500">Category <span className="text-status-red">*</span></Label>
                  <Select defaultValue="RESIDENTIAL" onValueChange={(v) => setValue('category', v as FormValues['category'])}>
                    <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RESIDENTIAL" className="font-body text-sm">Residential</SelectItem>
                      <SelectItem value="COMMERCIAL" className="font-body text-sm">Commercial</SelectItem>
                      <SelectItem value="MIXED" className="font-body text-sm">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-body text-karis-stone-500">Status <span className="text-status-red">*</span></Label>
                  <Select defaultValue="VACANT" onValueChange={(v) => setValue('propertyStatus', v as FormValues['propertyStatus'])}>
                    <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VACANT" className="font-body text-sm">Vacant</SelectItem>
                      <SelectItem value="OCCUPIED" className="font-body text-sm">Occupied</SelectItem>
                      <SelectItem value="UNDER_CONSTRUCTION" className="font-body text-sm">Under construction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* ── Location ── */}
            <section className="space-y-4 border-t border-karis-stone-100 pt-4">
              <p className="text-xs font-body text-karis-stone-400 uppercase tracking-wider">Location</p>

              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">Address line 1</Label>
                <Input className="font-body text-sm" placeholder="Plot 12, North Sector" {...register('address')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-body text-karis-stone-500">Address line 2</Label>
                  <Input className="font-body text-sm" placeholder="Building B" {...register('addressLine2')} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-body text-karis-stone-500">Lot number</Label>
                  <Input className="font-body text-sm" placeholder="L-042" {...register('lotNumber')} />
                </div>
              </div>
            </section>

            {/* ── Specifications ── */}
            <section className="space-y-4 border-t border-karis-stone-100 pt-4">
              <p className="text-xs font-body text-karis-stone-400 uppercase tracking-wider">Specifications</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-body text-karis-stone-500">Size (sq m)</Label>
                  <Input type="number" step="0.01" min="0" className="font-body text-sm tabular-nums" placeholder="120.00" {...register('sizeSqm')} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-body text-karis-stone-500">Year built</Label>
                  <Input type="number" min="1900" max="2100" className="font-body text-sm tabular-nums" placeholder="2022" {...register('yearBuilt')} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-body text-karis-stone-500">Bedrooms</Label>
                  <Input type="number" min="0" className="font-body text-sm tabular-nums" placeholder="3" {...register('bedrooms')} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-body text-karis-stone-500">Bathrooms</Label>
                  <Input type="number" min="0" className="font-body text-sm tabular-nums" placeholder="2" {...register('bathrooms')} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-body text-karis-stone-500">Parking spots</Label>
                  <Input type="number" min="0" className="font-body text-sm tabular-nums" placeholder="1" {...register('parkingSpots')} />
                </div>
              </div>
            </section>

            {/* ── Financials ── */}
            <section className="space-y-4 border-t border-karis-stone-100 pt-4">
              <p className="text-xs font-body text-karis-stone-400 uppercase tracking-wider">Financials</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-body text-karis-stone-500">Purchase price (fiat)</Label>
                  <Input type="number" step="0.01" min="0" className="font-body text-sm tabular-nums" placeholder="0.00" {...register('totalPrice')} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-body text-karis-stone-500">Current valuation (KCRD)</Label>
                  <Input type="number" step="0.01" min="0" className="font-body text-sm tabular-nums" placeholder="0.00" {...register('currentValuationKcrd')} />
                </div>
              </div>
            </section>

            {/* ── Documents ── */}
            <section className="space-y-4 border-t border-karis-stone-100 pt-4">
              <p className="text-xs font-body text-karis-stone-400 uppercase tracking-wider">Documents &amp; Photos</p>

              <FileUpload
                endpoint={{ entityType: 'PROPERTY', fieldName: 'photos', category: 'photo' }}
                label="Photos"
                value={attachments.photos}
                onComplete={(files) => appendFiles('photos', files)}
                onRemove={(key) => removeFile('photos', key)}
              />

              <FileUpload
                endpoint={{ entityType: 'PROPERTY', fieldName: 'titleDeed', category: 'title_deed' }}
                label="Title deed (PDF)"
                value={attachments.titleDeed}
                onComplete={(files) => appendFiles('titleDeed', files)}
                onRemove={(key) => removeFile('titleDeed', key)}
              />

              <FileUpload
                endpoint={{ entityType: 'PROPERTY', fieldName: 'occupancyPermit', category: 'occupancy_permit' }}
                label="Occupancy permit (PDF)"
                value={attachments.occupancyPermit}
                onComplete={(files) => appendFiles('occupancyPermit', files)}
                onRemove={(key) => removeFile('occupancyPermit', key)}
              />

              <FileUpload
                endpoint={{ entityType: 'PROPERTY', fieldName: 'utilityDocs', category: 'utility_document' }}
                label="Utility hookup documents (PDF)"
                value={attachments.utilityDocs}
                onComplete={(files) => appendFiles('utilityDocs', files)}
                onRemove={(key) => removeFile('utilityDocs', key)}
              />
            </section>

            {/* ── Notes ── */}
            <section className="space-y-2 border-t border-karis-stone-100 pt-4">
              <Label className="text-xs font-body text-karis-stone-500">Notes</Label>
              <Textarea
                className="font-body text-sm resize-none"
                rows={3}
                placeholder="Any additional notes…"
                {...register('notes')}
              />
            </section>

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
                {isPending ? 'Creating…' : 'Create property'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
