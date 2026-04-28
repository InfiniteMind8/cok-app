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
import { approveSettlementAction, declineSettlementAction } from '@/app/(admin)/_actions/settlements'
import { CheckCircle2, XCircle } from 'lucide-react'

interface SettlementRow {
  id: string
  userId: string
  amount: string
  purpose: string | null
  createdAt: string
  userName: string
  memberId: string
  eligibleBalance: string
}

export function ApproveSettlementDialog({ settlement }: { settlement: SettlementRow }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleApprove() {
    startTransition(async () => {
      try {
        await approveSettlementAction(settlement.id)
        toast.success('Settlement approved')
        setOpen(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to approve settlement')
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
            <ModalTitle className="font-heading text-karis-green-900">
              Approve settlement
            </ModalTitle>
            <ModalDescription className="font-body text-sm text-karis-stone-500">
              This marks the request as approved. The fiat payout is recorded separately.
            </ModalDescription>
          </ModalHeader>

          <ModalBody>
            <div className="bg-karis-stone-50 rounded-lg p-4 space-y-2 text-sm font-body">
              <div className="flex justify-between">
                <span className="text-karis-stone-500">Member</span>
                <span className="text-karis-stone-900">
                  {settlement.userName} ({settlement.memberId})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-karis-stone-500">Requested</span>
                <span className="text-karis-gold-700 tabular-nums font-medium">
                  K {settlement.amount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-karis-stone-500">Eligible balance</span>
                <span className="text-karis-stone-900 tabular-nums">
                  K {settlement.eligibleBalance}
                </span>
              </div>
              {settlement.purpose && (
                <div className="flex justify-between">
                  <span className="text-karis-stone-500">Purpose</span>
                  <span className="text-karis-stone-900 max-w-[200px] text-right">
                    {settlement.purpose}
                  </span>
                </div>
              )}
            </div>
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApprove} disabled={isPending}>
              {isPending ? 'Approving...' : 'Confirm approval'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export function DeclineSettlementDialog({ settlement }: { settlement: SettlementRow }) {
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
        await declineSettlementAction(settlement.id, reason)
        toast.success('Settlement declined')
        setOpen(false)
        setReason('')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to decline settlement')
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
            <ModalTitle className="font-heading text-karis-green-900">
              Decline settlement
            </ModalTitle>
            <ModalDescription className="font-body text-sm text-karis-stone-500">
              The member will be notified. Provide a clear reason.
            </ModalDescription>
          </ModalHeader>

          <ModalBody>
            <div className="space-y-4">
              <div className="bg-karis-stone-50 rounded-lg px-4 py-3 text-sm font-body">
                <span className="text-karis-stone-500">Request by </span>
                <span className="text-karis-stone-900 font-medium">{settlement.userName}</span>
                <span className="text-karis-stone-500"> — </span>
                <span className="text-karis-gold-700 tabular-nums">K {settlement.amount}</span>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-body text-karis-stone-500">Reason</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this request is being declined..."
                  className="text-sm font-body resize-none"
                  rows={3}
                />
              </div>
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
              {isPending ? 'Declining...' : 'Confirm decline'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
