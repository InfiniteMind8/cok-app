'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CalendarDays } from 'lucide-react'
import { residentPropertyApi, getBrowserApi } from '@/lib/api'

interface ExtensionRequestModalProps {
  tenancyId: string
  currentEndDate: Date | null
}

export function ExtensionRequestModal({ tenancyId, currentEndDate }: ExtensionRequestModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [newEndDate, setNewEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()

  const minDate = currentEndDate
    ? format(new Date(currentEndDate.getTime() + 86400000), 'yyyy-MM-dd')
    : format(new Date(), 'yyyy-MM-dd')

  function handleSubmit() {
    if (!newEndDate) {
      toast.error('Please select a new end date')
      return
    }
    startTransition(async () => {
      try {
        await residentPropertyApi.requestExtension(getBrowserApi(), {
          tenancyId,
          requestedNewEndDate: newEndDate,
          reason: reason.trim() || undefined,
        })
        toast.success('Extension request submitted. You will be notified once reviewed.')
        setOpen(false)
        setNewEndDate('')
        setReason('')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to submit request')
      }
    })
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="font-body text-sm h-9 px-4 border-karis-green-900/20 text-karis-green-900 hover:bg-karis-green-900/5"
        onClick={() => setOpen(true)}
      >
        <CalendarDays size={14} className="mr-2" />
        Request extension
      </Button>

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle className="font-heading text-karis-green-900">Request lease extension</ModalTitle>
            <ModalDescription className="font-body text-sm text-karis-stone-500">
              {currentEndDate
                ? `Current lease ends ${format(currentEndDate, 'dd MMM yyyy')}. Select a new end date to request.`
                : 'Select a new end date to request an extension.'}
            </ModalDescription>
          </ModalHeader>

          <ModalBody>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">New end date</Label>
                <Input
                  type="date"
                  value={newEndDate}
                  min={minDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="font-body text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">Reason (optional)</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Briefly explain why you are requesting an extension…"
                  className="font-body text-sm resize-none"
                  rows={3}
                />
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={isPending || !newEndDate}>
              {isPending ? 'Submitting…' : 'Submit request'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
