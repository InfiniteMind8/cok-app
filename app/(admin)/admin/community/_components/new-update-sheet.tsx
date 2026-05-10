'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { adminCommunityApi, getBrowserApi, type AnnouncementTargetType, type Role } from '@/lib/api'

interface VisitorGroupOption {
  id: string
  name: string
  theme?: string | null
}

const schema = z.object({
  headline: z.string().min(1, 'Headline required'),
  category: z.string().min(1, 'Category required'),
  message: z.string().min(1, 'Message required'),
  photoUrl: z.string().optional(),
  targetType: z.enum(['COMMUNITY_WIDE', 'ROLE', 'VISITOR_GROUP']),
  targetRole: z.string().optional(),
  targetGroupId: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function NewUpdateSheet({
  visitorGroups = [],
  defaultGroupId,
}: {
  visitorGroups?: VisitorGroupOption[]
  defaultGroupId?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      targetType: defaultGroupId ? 'VISITOR_GROUP' : 'COMMUNITY_WIDE',
      targetGroupId: defaultGroupId ?? '',
    },
  })

  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form watch() is incompatible with React Compiler; known limitation
  const targetType = watch('targetType')

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await adminCommunityApi.publishUpdate(getBrowserApi(), {
          headline: values.headline,
          category: values.category,
          message: values.message,
          photoUrl: values.photoUrl,
          targetType: values.targetType as AnnouncementTargetType,
          targetRole: values.targetType === 'ROLE' ? (values.targetRole as Role | undefined) : undefined,
          targetGroupId: values.targetType === 'VISITOR_GROUP' ? values.targetGroupId : undefined,
        })
        toast.success('Update published')
        reset()
        setOpen(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  const audienceLabel =
    targetType === 'ROLE'
      ? 'By role'
      : targetType === 'VISITOR_GROUP'
      ? 'Visitor group'
      : 'Community-wide'

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
              {targetType === 'COMMUNITY_WIDE'
                ? 'Published to all community members.'
                : `Targeted: ${audienceLabel}`}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Audience */}
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Audience</Label>
              <Controller
                control={control}
                name="targetType"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="font-body text-sm h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMMUNITY_WIDE" className="font-body text-sm">Community-wide</SelectItem>
                      <SelectItem value="ROLE" className="font-body text-sm">By role</SelectItem>
                      {visitorGroups.length > 0 && (
                        <SelectItem value="VISITOR_GROUP" className="font-body text-sm">Visitor group</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Role picker */}
            {targetType === 'ROLE' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">Role</Label>
                <Controller
                  control={control}
                  name="targetRole"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <SelectTrigger className="font-body text-sm h-9">
                        <SelectValue placeholder="Select role…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RESIDENT" className="font-body text-sm">Resident</SelectItem>
                        <SelectItem value="VISITOR" className="font-body text-sm">Visitor</SelectItem>
                        <SelectItem value="VENDOR" className="font-body text-sm">Vendor</SelectItem>
                        <SelectItem value="ADMIN" className="font-body text-sm">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            {/* Group picker */}
            {targetType === 'VISITOR_GROUP' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">Visitor group</Label>
                <Controller
                  control={control}
                  name="targetGroupId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <SelectTrigger className="font-body text-sm h-9">
                        <SelectValue placeholder="Select group…" />
                      </SelectTrigger>
                      <SelectContent>
                        {visitorGroups.map((g) => (
                          <SelectItem key={g.id} value={g.id} className="font-body text-sm">
                            {g.name}{g.theme ? ` — ${g.theme}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

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
              <Button
                type="button"
                variant="outline"
                className="flex-1 font-body text-sm"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
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
