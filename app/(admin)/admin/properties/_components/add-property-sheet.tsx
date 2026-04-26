'use client'

import { useState, useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Building2, Plus, Trash2 } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createPropertyAction } from '@/app/(admin)/_actions/properties'

const schema = z.object({
  code: z.string().min(1, 'Property code required'),
  type: z.enum(['OWNERSHIP', 'RENTAL', 'ADMIN']),
  category: z.enum(['COMMERCIAL', 'RESIDENTIAL', 'MIXED']),
  address: z.string().optional(),
  totalPrice: z.string().optional(),
  specs: z.array(z.object({ key: z.string(), value: z.string() })),
})

type FormValues = z.infer<typeof schema>

export function AddPropertySheet() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const { register, handleSubmit, setValue, reset, control, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { type: 'OWNERSHIP', category: 'RESIDENTIAL', specs: [] },
    })

  const { fields, append, remove } = useFieldArray({ control, name: 'specs' })

  function onSubmit(values: FormValues) {
    const specifications = Object.fromEntries(
      values.specs.filter((s) => s.key.trim()).map((s) => [s.key.trim(), s.value.trim()])
    )
    startTransition(async () => {
      try {
        const result = await createPropertyAction({
          ...values,
          specifications,
          photos: [],
        })
        toast.success(`Property ${values.code} created`)
        reset()
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

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-heading text-karis-green-900">Add property</SheetTitle>
            <SheetDescription className="font-body text-sm text-karis-stone-500">
              Register a new property in the City of Karis registry.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Property code</Label>
              <Input className="font-body text-sm uppercase" placeholder="COK-001" {...register('code')} />
              {errors.code && <p className="text-xs text-status-red font-body">{errors.code.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">Type</Label>
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
                <Label className="text-xs font-body text-karis-stone-500">Category</Label>
                <Select defaultValue="RESIDENTIAL" onValueChange={(v) => setValue('category', v as FormValues['category'])}>
                  <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESIDENTIAL" className="font-body text-sm">Residential</SelectItem>
                    <SelectItem value="COMMERCIAL" className="font-body text-sm">Commercial</SelectItem>
                    <SelectItem value="MIXED" className="font-body text-sm">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Address</Label>
              <Input className="font-body text-sm" placeholder="Plot 12, North Sector" {...register('address')} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Total price (fiat)</Label>
              <Input type="number" step="0.01" className="font-body text-sm tabular-nums" placeholder="0.00" {...register('totalPrice')} />
            </div>

            {/* Specifications key-value editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-body text-karis-stone-500">Specifications</Label>
                <button
                  type="button"
                  onClick={() => append({ key: '', value: '' })}
                  className="text-xs font-body text-karis-green-700 hover:text-karis-green-900 flex items-center gap-1"
                >
                  <Plus size={12} /> Add spec
                </button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    placeholder="Key"
                    className="font-body text-sm flex-1"
                    {...register(`specs.${index}.key`)}
                  />
                  <Input
                    placeholder="Value"
                    className="font-body text-sm flex-1"
                    {...register(`specs.${index}.value`)}
                  />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-karis-stone-400 hover:text-status-red transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 font-body text-sm" onClick={() => setOpen(false)} disabled={isPending}>
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
