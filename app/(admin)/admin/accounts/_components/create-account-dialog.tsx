'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { UserPlus, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createAccountAction } from '@/app/(admin)/_actions/accounts'

const schema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  email: z.string().email('Valid email required'),
  role: z.enum(['RESIDENT', 'VENDOR', 'VISITOR', 'ADMIN']),
  dob: z.string().optional(),
  govId: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function CreateAccountDialog() {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<{ memberId: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'RESIDENT' },
  })

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        const res = await createAccountAction(values)
        setResult({ memberId: res.memberId })
        toast.success(`Account created — ${res.memberId}`, {
          description: 'Invitation email sent to member.',
          duration: 8000,
        })
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to create account')
      }
    })
  }

  function handleClose() {
    reset()
    setResult(null)
    setCopied(false)
    setOpen(false)
  }

  function copyMemberId() {
    if (result) {
      navigator.clipboard.writeText(result.memberId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="font-body text-sm gap-2">
        <UserPlus size={16} />
        Create account
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-karis-green-900">Create account</DialogTitle>
            <DialogDescription className="font-body text-sm text-karis-stone-500">
              Pre-create a member account. An invitation email will be sent automatically.
            </DialogDescription>
          </DialogHeader>

          {result ? (
            <div className="space-y-4 py-2">
              <div className="bg-karis-green-900/5 border border-karis-green-900/10 rounded-lg p-4 text-center">
                <p className="text-xs font-body text-karis-stone-500 mb-1">Member ID assigned</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-heading text-karis-green-900 tabular-nums tracking-wider">
                    {result.memberId}
                  </p>
                  <button
                    onClick={copyMemberId}
                    className="text-karis-stone-400 hover:text-karis-stone-900 transition-colors"
                  >
                    {copied ? <Check size={16} className="text-status-green" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <p className="text-sm font-body text-karis-stone-500 text-center">
                An invitation email has been sent. The member ID is shown above — save it.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-body text-karis-stone-500">Full name</Label>
                  <Input className="font-body text-sm" placeholder="Jane Smith" {...register('fullName')} />
                  {errors.fullName && (
                    <p className="text-xs text-status-red font-body">{errors.fullName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-body text-karis-stone-500">Role</Label>
                  <Select defaultValue="RESIDENT" onValueChange={(v) => setValue('role', v as FormValues['role'])}>
                    <SelectTrigger className="font-body text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RESIDENT" className="font-body text-sm">Resident</SelectItem>
                      <SelectItem value="VENDOR" className="font-body text-sm">Vendor</SelectItem>
                      <SelectItem value="VISITOR" className="font-body text-sm">Visitor</SelectItem>
                      <SelectItem value="ADMIN" className="font-body text-sm">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">Email address</Label>
                <Input type="email" className="font-body text-sm" placeholder="jane@example.com" {...register('email')} />
                {errors.email && (
                  <p className="text-xs text-status-red font-body">{errors.email.message}</p>
                )}
              </div>

              <div className="border-t border-karis-stone-100 pt-4">
                <p className="text-xs font-body text-karis-stone-500 mb-3 uppercase tracking-wider">
                  KYC Information (optional)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-body text-karis-stone-500">Date of birth</Label>
                    <Input type="date" className="font-body text-sm" {...register('dob')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-body text-karis-stone-500">Country</Label>
                    <Input className="font-body text-sm" placeholder="Guyana" {...register('country')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-body text-karis-stone-500">Government ID number</Label>
                    <Input className="font-body text-sm" placeholder="GY-123456" {...register('govId')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-body text-karis-stone-500">Phone number</Label>
                    <Input className="font-body text-sm" placeholder="+592 …" {...register('phone')} />
                  </div>
                </div>
              </div>
            </form>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={handleClose} disabled={isPending}>
              {result ? 'Close' : 'Cancel'}
            </Button>
            {!result && (
              <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={isPending}>
                {isPending ? 'Creating…' : 'Create & send invite'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
