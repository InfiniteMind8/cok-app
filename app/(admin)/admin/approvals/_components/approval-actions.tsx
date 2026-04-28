'use client'

import { useState, useTransition } from 'react'
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

interface ApprovalActionsProps {
  label: string
  onApprove: () => Promise<void>
  onDecline: (reason: string) => Promise<void>
}

export function ApprovalActions({ label, onApprove, onDecline }: ApprovalActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <ApproveDialog label={label} onApprove={onApprove} />
      <DeclineDialog label={label} onDecline={onDecline} />
    </div>
  )
}

function ApproveDialog({ label, onApprove }: { label: string; onApprove: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleApprove() {
    startTransition(async () => {
      try {
        await onApprove()
        toast.success('Approved successfully')
        setOpen(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to approve')
      }
    })
  }

  return (
    <>
      <Button
        size="sm"
        variant="default"
        className="text-xs h-7 px-3 font-body"
        onClick={() => setOpen(true)}
      >
        <CheckCircle2 size={13} className="mr-1" />
        Approve
      </Button>

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle className="font-heading text-karis-green-900">Confirm approval</ModalTitle>
            <ModalDescription className="font-body text-sm text-karis-stone-500">
              {label}
            </ModalDescription>
          </ModalHeader>
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

function DeclineDialog({ label, onDecline }: { label: string; onDecline: (reason: string) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleDecline() {
    if (!reason.trim()) {
      toast.error('Please provide a reason')
      return
    }
    startTransition(async () => {
      try {
        await onDecline(reason)
        toast.success('Declined')
        setOpen(false)
        setReason('')
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
            <ModalTitle className="font-heading text-karis-green-900">Decline request</ModalTitle>
            <ModalDescription className="font-body text-sm text-karis-stone-500">
              {label} — provide a reason for the member.
            </ModalDescription>
          </ModalHeader>

          <ModalBody>
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">Reason</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this request is being declined…"
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
              disabled={isPending || !reason.trim()}
            >
              {isPending ? 'Declining…' : 'Confirm decline'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
