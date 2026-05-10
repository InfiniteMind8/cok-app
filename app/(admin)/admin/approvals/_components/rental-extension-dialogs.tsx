'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
import { CheckCircle2, XCircle } from 'lucide-react'
import { adminRentalExtensionsApi, getBrowserApi } from '@/lib/api'

interface RentalExtensionActionsProps {
  row: {
    id: string
    requesterName: string
    propertyCode: string
    currentEnd: string
    requestedEnd: string
    deltaDays: number
  }
}

export function RentalExtensionApprovalActions({ row }: RentalExtensionActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <ApproveDialog row={row} />
      <DeclineDialog row={row} />
    </div>
  )
}

function ApproveDialog({ row }: RentalExtensionActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleApprove() {
    startTransition(async () => {
      try {
        await adminRentalExtensionsApi.approve(getBrowserApi(), row.id, note.trim() || undefined)
        toast.success('Extension approved')
        setOpen(false)
        setNote('')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to approve')
      }
    })
  }

  return (
    <>
      <Button size="sm" variant="default" className="text-xs h-7 px-3 font-body" onClick={() => setOpen(true)}>
        <CheckCircle2 size={13} className="mr-1" />
        Approve
      </Button>

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle className="font-heading text-karis-green-900">Confirm approval</ModalTitle>
            <ModalDescription className="font-body text-sm text-karis-stone-500">
              Extend {row.requesterName}&apos;s lease for {row.propertyCode} to {row.requestedEnd} (+{row.deltaDays} days).
            </ModalDescription>
          </ModalHeader>

          <ModalBody>
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Note (optional)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note to include in the resident's notification…"
                className="text-sm font-body resize-none"
                rows={3}
              />
            </div>
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApprove} disabled={isPending}>
              {isPending ? 'Approving…' : 'Confirm approval'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

function DeclineDialog({ row }: RentalExtensionActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleDecline() {
    if (!note.trim()) {
      toast.error('Please provide a reason for declining')
      return
    }
    startTransition(async () => {
      try {
        await adminRentalExtensionsApi.decline(getBrowserApi(), row.id, note.trim())
        toast.success('Extension declined')
        setOpen(false)
        setNote('')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to decline')
      }
    })
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="text-xs h-7 px-3 font-body text-status-red border-status-red/30 hover:bg-status-red/5"
        onClick={() => setOpen(true)}
      >
        <XCircle size={13} className="mr-1" />
        Decline
      </Button>

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle className="font-heading text-karis-green-900">Decline extension</ModalTitle>
            <ModalDescription className="font-body text-sm text-karis-stone-500">
              Decline {row.requesterName}&apos;s lease extension request for {row.propertyCode}.
            </ModalDescription>
          </ModalHeader>

          <ModalBody>
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Reason (required)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Explain why this extension is being declined…"
                className="text-sm font-body resize-none"
                rows={3}
              />
            </div>
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDecline}
              disabled={isPending || !note.trim()}
            >
              {isPending ? 'Declining…' : 'Confirm decline'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
