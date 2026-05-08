'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { UserPlus, Copy, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal'
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
import { createAccountAction } from '@/app/(admin)/_actions/accounts'

const baseSchema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  email: z.string().email('Valid email required'),
  role: z.enum(['RESIDENT', 'VENDOR', 'VISITOR', 'ADMIN']),
  preferredName: z.string().optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  // Resident
  nationalIdType: z.string().optional(),
  nationalIdNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  householdSize: z.string().optional(),
  notes: z.string().optional(),
  // Visitor
  visitPurpose: z.string().optional(),
  expectedArrival: z.string().optional(),
  expectedDeparture: z.string().optional(),
  // Vendor
  businessName: z.string().optional(),
  businessCategory: z.string().optional(),
  payoutMethod: z.string().optional(),
})

type FormValues = z.infer<typeof baseSchema>

interface VisitorGroupOption {
  id: string
  name: string
  theme?: string | null
}

export function CreateAccountDialog({ visitorGroups = [] }: { visitorGroups?: VisitorGroupOption[] }) {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<{ memberId: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [idDocFiles, setIdDocFiles] = useState<UploadedFile[]>([])
  const [profilePhotoFiles, setProfilePhotoFiles] = useState<UploadedFile[]>([])
  const [vendorDocFiles, setVendorDocFiles] = useState<UploadedFile[]>([])
  const [vehiclePlates, setVehiclePlates] = useState<string[]>([])
  const [plateInput, setPlateInput] = useState('')
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: { role: 'RESIDENT' },
  })

  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form watch() is incompatible with React Compiler; known limitation
  const role = watch('role')

  function handleClose() {
    reset()
    setResult(null)
    setCopied(false)
    setIdDocFiles([])
    setProfilePhotoFiles([])
    setVendorDocFiles([])
    setVehiclePlates([])
    setPlateInput('')
    setSelectedGroupIds([])
    setOpen(false)
  }

  function toggleGroup(id: string) {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function addPlate() {
    const plate = plateInput.trim().toUpperCase()
    if (plate && !vehiclePlates.includes(plate)) {
      setVehiclePlates((prev) => [...prev, plate])
    }
    setPlateInput('')
  }

  function onSubmit(values: FormValues) {
    const attachments = [
      ...idDocFiles.map((f) => ({ storageKey: f.url, mimeType: f.type, sizeBytes: f.size, name: f.name, fieldName: 'idScan' })),
      ...profilePhotoFiles.map((f) => ({ storageKey: f.url, mimeType: f.type, sizeBytes: f.size, name: f.name, fieldName: 'profilePhoto' })),
      ...vendorDocFiles.map((f, i) => ({ storageKey: f.url, mimeType: f.type, sizeBytes: f.size, name: f.name, fieldName: i === 0 ? 'businessLicense' : 'insuranceCert' })),
    ]

    startTransition(async () => {
      try {
        const res = await createAccountAction({
          fullName: values.fullName,
          email: values.email,
          role: values.role as 'RESIDENT' | 'VENDOR' | 'VISITOR' | 'ADMIN',
          preferredName: values.preferredName,
          phone: values.phone,
          gender: values.gender,
          residentFields: values.role === 'RESIDENT' ? {
            nationalIdType: values.nationalIdType,
            nationalIdNumber: values.nationalIdNumber,
            emergencyContactName: values.emergencyContactName,
            emergencyContactPhone: values.emergencyContactPhone,
            householdSize: values.householdSize ? parseInt(values.householdSize, 10) : undefined,
            vehiclePlates,
            notes: values.notes,
          } : undefined,
          visitorFields: values.role === 'VISITOR' ? {
            nationalIdType: values.nationalIdType,
            nationalIdNumber: values.nationalIdNumber,
            visitPurpose: values.visitPurpose,
            expectedArrival: values.expectedArrival,
            expectedDeparture: values.expectedDeparture,
          } : undefined,
          groupIds: values.role === 'VISITOR' && selectedGroupIds.length > 0 ? selectedGroupIds : undefined,
          vendorFields: values.role === 'VENDOR' ? {
            businessName: values.businessName,
            businessCategory: values.businessCategory,
            payoutMethod: values.payoutMethod,
            notes: values.notes,
          } : undefined,
          attachments: attachments.length > 0 ? attachments : undefined,
        })
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

      <Modal open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
        <ModalContent size="lg">
          <ModalHeader>
            <ModalTitle className="font-heading text-karis-green-900">Create account</ModalTitle>
            <ModalDescription className="font-body text-sm text-karis-stone-500">
              Pre-create a member account. An invitation email will be sent automatically.
            </ModalDescription>
          </ModalHeader>

          <ModalBody>
            {result ? (
              <div className="space-y-4">
                <div className="bg-karis-green-900/5 border border-karis-green-900/10 rounded-lg p-4 text-center">
                  <p className="text-xs font-body text-karis-stone-500 mb-1">Member ID assigned</p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-2xl font-heading text-karis-green-900 tabular-nums tracking-wider">
                      {result.memberId}
                    </p>
                    <button
                      type="button"
                      onClick={copyMemberId}
                      className="text-karis-stone-400 hover:text-karis-stone-900 transition-colors"
                    >
                      {copied ? <Check size={16} className="text-status-green" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <p className="text-sm font-body text-karis-stone-500 text-center">
                  An invitation email has been sent. Save the member ID shown above.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                {/* ── Core identity ── */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-body text-karis-stone-500">
                      Full name <span className="text-status-red">*</span>
                    </Label>
                    <Input className="font-body text-sm" placeholder="Jane Smith" {...register('fullName')} />
                    {errors.fullName && <p className="text-xs text-status-red font-body">{errors.fullName.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-body text-karis-stone-500">Preferred name</Label>
                    <Input className="font-body text-sm" placeholder="Jane" {...register('preferredName')} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-body text-karis-stone-500">
                    Email <span className="text-status-red">*</span>
                  </Label>
                  <Input type="email" className="font-body text-sm" placeholder="jane@example.com" {...register('email')} />
                  {errors.email && <p className="text-xs text-status-red font-body">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-body text-karis-stone-500">Role <span className="text-status-red">*</span></Label>
                    <Select defaultValue="RESIDENT" onValueChange={(v) => setValue('role', v as FormValues['role'])}>
                      <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RESIDENT" className="font-body text-sm">Resident</SelectItem>
                        <SelectItem value="VENDOR" className="font-body text-sm">Vendor</SelectItem>
                        <SelectItem value="VISITOR" className="font-body text-sm">Visitor</SelectItem>
                        <SelectItem value="ADMIN" className="font-body text-sm">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-body text-karis-stone-500">Phone</Label>
                    <Input className="font-body text-sm" placeholder="+592 …" {...register('phone')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-body text-karis-stone-500">Gender</Label>
                    <Select onValueChange={(v: unknown) => setValue('gender', v as string)}>
                      <SelectTrigger className="font-body text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male" className="font-body text-sm">Male</SelectItem>
                        <SelectItem value="Female" className="font-body text-sm">Female</SelectItem>
                        <SelectItem value="Non-binary" className="font-body text-sm">Non-binary</SelectItem>
                        <SelectItem value="Prefer not to say" className="font-body text-sm">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ── Resident-specific ── */}
                {role === 'RESIDENT' && (
                  <div className="border-t border-karis-stone-100 pt-4 space-y-4">
                    <p className="text-xs font-body text-karis-stone-400 uppercase tracking-wider">Resident profile</p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-body text-karis-stone-500">National ID type</Label>
                        <Select onValueChange={(v: unknown) => setValue('nationalIdType', v as string)}>
                          <SelectTrigger className="font-body text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Passport" className="font-body text-sm">Passport</SelectItem>
                            <SelectItem value="National ID" className="font-body text-sm">National ID</SelectItem>
                            <SelectItem value="Driver's licence" className="font-body text-sm">Driver&apos;s licence</SelectItem>
                            <SelectItem value="Other" className="font-body text-sm">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-body text-karis-stone-500">National ID number</Label>
                        <Input className="font-body text-sm" {...register('nationalIdNumber')} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-body text-karis-stone-500">Emergency contact name</Label>
                        <Input className="font-body text-sm" {...register('emergencyContactName')} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-body text-karis-stone-500">Emergency contact phone</Label>
                        <Input className="font-body text-sm" placeholder="+592 …" {...register('emergencyContactPhone')} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-body text-karis-stone-500">Household members</Label>
                        <Input type="number" min="1" className="font-body text-sm" {...register('householdSize')} />
                      </div>
                    </div>

                    {/* Vehicle plates tag input */}
                    <div className="space-y-2">
                      <Label className="text-xs font-body text-karis-stone-500">Vehicle plates</Label>
                      <div className="flex gap-2">
                        <Input
                          className="font-body text-sm uppercase flex-1"
                          placeholder="ABC 1234"
                          value={plateInput}
                          onChange={(e) => setPlateInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPlate() } }}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={addPlate} className="font-body text-sm">
                          Add
                        </Button>
                      </div>
                      {vehiclePlates.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {vehiclePlates.map((p) => (
                            <span
                              key={p}
                              className="inline-flex items-center gap-1 bg-karis-stone-100 text-karis-stone-700 font-body text-xs px-2 py-0.5 rounded"
                            >
                              {p}
                              <button
                                type="button"
                                onClick={() => setVehiclePlates((prev) => prev.filter((x) => x !== p))}
                                className="text-karis-stone-400 hover:text-status-red"
                              >
                                <X size={11} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-body text-karis-stone-500">Notes</Label>
                      <Textarea className="font-body text-sm resize-none" rows={2} {...register('notes')} />
                    </div>

                    <FileUpload
                      endpoint={{ entityType: 'USER', fieldName: 'idScan', category: 'id_document' }}
                      label="ID document scan (PDF or image)"
                      value={idDocFiles}
                      onComplete={(files) => setIdDocFiles((prev) => [...prev, ...files])}
                      onRemove={(key) => setIdDocFiles((prev) => prev.filter((f) => f.key !== key))}
                    />

                    <FileUpload
                      endpoint={{ entityType: 'USER', fieldName: 'profilePhoto', category: 'profile_photo' }}
                      label="Profile photo (image)"
                      value={profilePhotoFiles}
                      onComplete={(files) => setProfilePhotoFiles((prev) => [...prev, ...files])}
                      onRemove={(key) => setProfilePhotoFiles((prev) => prev.filter((f) => f.key !== key))}
                    />
                  </div>
                )}

                {/* ── Visitor-specific ── */}
                {role === 'VISITOR' && (
                  <div className="border-t border-karis-stone-100 pt-4 space-y-4">
                    <p className="text-xs font-body text-karis-stone-400 uppercase tracking-wider">Visitor profile</p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-body text-karis-stone-500">National ID type</Label>
                        <Select onValueChange={(v: unknown) => setValue('nationalIdType', v as string)}>
                          <SelectTrigger className="font-body text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Passport" className="font-body text-sm">Passport</SelectItem>
                            <SelectItem value="National ID" className="font-body text-sm">National ID</SelectItem>
                            <SelectItem value="Driver's licence" className="font-body text-sm">Driver&apos;s licence</SelectItem>
                            <SelectItem value="Other" className="font-body text-sm">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-body text-karis-stone-500">National ID number</Label>
                        <Input className="font-body text-sm" {...register('nationalIdNumber')} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-body text-karis-stone-500">Visit purpose</Label>
                      <Select onValueChange={(v: unknown) => setValue('visitPurpose', v as string)}>
                        <SelectTrigger className="font-body text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Business" className="font-body text-sm">Business</SelectItem>
                          <SelectItem value="Personal" className="font-body text-sm">Personal</SelectItem>
                          <SelectItem value="Medical" className="font-body text-sm">Medical</SelectItem>
                          <SelectItem value="Tourism" className="font-body text-sm">Tourism</SelectItem>
                          <SelectItem value="Other" className="font-body text-sm">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-body text-karis-stone-500">Expected arrival</Label>
                        <Input type="date" className="font-body text-sm" {...register('expectedArrival')} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-body text-karis-stone-500">Expected departure</Label>
                        <Input type="date" className="font-body text-sm" {...register('expectedDeparture')} />
                      </div>
                    </div>

                    <FileUpload
                      endpoint={{ entityType: 'USER', fieldName: 'idScan', category: 'id_document' }}
                      label="ID document scan (PDF or image)"
                      value={idDocFiles}
                      onComplete={(files) => setIdDocFiles((prev) => [...prev, ...files])}
                      onRemove={(key) => setIdDocFiles((prev) => prev.filter((f) => f.key !== key))}
                    />

                    {visitorGroups.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-body text-karis-stone-500">Visitor groups (optional)</Label>
                        <div className="flex flex-wrap gap-2">
                          {visitorGroups.map((g) => {
                            const selected = selectedGroupIds.includes(g.id)
                            return (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => toggleGroup(g.id)}
                                className={`font-body text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                                  selected
                                    ? 'bg-karis-green-900 text-white border-karis-green-900'
                                    : 'bg-white text-karis-stone-600 border-karis-stone-200 hover:border-karis-green-900/40'
                                }`}
                              >
                                {g.name}
                                {g.theme ? ` · ${g.theme}` : ''}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Vendor-specific ── */}
                {role === 'VENDOR' && (
                  <div className="border-t border-karis-stone-100 pt-4 space-y-4">
                    <p className="text-xs font-body text-karis-stone-400 uppercase tracking-wider">Vendor profile</p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-body text-karis-stone-500">Business name <span className="text-status-red">*</span></Label>
                        <Input className="font-body text-sm" {...register('businessName')} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-body text-karis-stone-500">Business category</Label>
                        <Select onValueChange={(v: unknown) => setValue('businessCategory', v as string)}>
                          <SelectTrigger className="font-body text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Construction" className="font-body text-sm">Construction</SelectItem>
                            <SelectItem value="Maintenance" className="font-body text-sm">Maintenance</SelectItem>
                            <SelectItem value="Landscaping" className="font-body text-sm">Landscaping</SelectItem>
                            <SelectItem value="Security" className="font-body text-sm">Security</SelectItem>
                            <SelectItem value="Cleaning" className="font-body text-sm">Cleaning</SelectItem>
                            <SelectItem value="Technology" className="font-body text-sm">Technology</SelectItem>
                            <SelectItem value="Food & Beverage" className="font-body text-sm">Food &amp; Beverage</SelectItem>
                            <SelectItem value="Healthcare" className="font-body text-sm">Healthcare</SelectItem>
                            <SelectItem value="Other" className="font-body text-sm">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-body text-karis-stone-500">Payout method</Label>
                      <Select onValueChange={(v: unknown) => setValue('payoutMethod', v as string)}>
                        <SelectTrigger className="font-body text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BankTransfer" className="font-body text-sm">Bank transfer</SelectItem>
                          <SelectItem value="Cash" className="font-body text-sm">Cash</SelectItem>
                          <SelectItem value="KCRDWallet" className="font-body text-sm">KCRD wallet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-body text-karis-stone-500">Notes</Label>
                      <Textarea className="font-body text-sm resize-none" rows={2} {...register('notes')} />
                    </div>

                    <FileUpload
                      endpoint={{ entityType: 'USER', fieldName: 'vendorDocs', category: 'business_license' }}
                      label="Business license (PDF) &amp; insurance certificate (PDF)"
                      value={vendorDocFiles}
                      onComplete={(files) => setVendorDocFiles((prev) => [...prev, ...files])}
                      onRemove={(key) => setVendorDocFiles((prev) => prev.filter((f) => f.key !== key))}
                    />
                  </div>
                )}
              </form>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" size="sm" onClick={handleClose} disabled={isPending}>
              {result ? 'Close' : 'Cancel'}
            </Button>
            {!result && (
              <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={isPending}>
                {isPending ? 'Creating…' : 'Create & send invite'}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
