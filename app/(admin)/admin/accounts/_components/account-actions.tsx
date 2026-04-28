'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { MoreHorizontal, Eye, Ban, RotateCcw, ArrowUpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  suspendAccountAction,
  restoreAccountAction,
  upgradeRoleAction,
} from '@/app/(admin)/_actions/accounts'

type ModalType = 'suspend' | 'restore' | 'upgrade' | null

interface AccountActionsProps {
  userId: string
  userName: string
  status: string
  role: string
  onView: () => void
}

export function AccountActions({ userId, userName, status, role, onView }: AccountActionsProps) {
  const [modal, setModal] = useState<ModalType>(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSuspend() {
    if (!suspendReason.trim()) { toast.error('Reason required'); return }
    startTransition(async () => {
      try {
        await suspendAccountAction(userId, suspendReason)
        toast.success(`${userName} suspended`)
        setModal(null)
        setSuspendReason('')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  function handleRestore() {
    startTransition(async () => {
      try {
        await restoreAccountAction(userId)
        toast.success(`${userName} restored`)
        setModal(null)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  function handleUpgrade() {
    if (!targetRole) { toast.error('Select a role'); return }
    startTransition(async () => {
      try {
        await upgradeRoleAction(userId, targetRole as Parameters<typeof upgradeRoleAction>[1])
        toast.success(`${userName} upgraded to ${targetRole}`)
        setModal(null)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-7 w-7 items-center justify-center rounded-md text-karis-stone-400 hover:bg-karis-stone-100 hover:text-karis-stone-700 transition-colors">
          <MoreHorizontal size={15} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="font-body text-sm w-44">
          <DropdownMenuItem onClick={onView} className="gap-2 cursor-pointer">
            <Eye size={14} /> View details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setModal('upgrade')} className="gap-2 cursor-pointer">
            <ArrowUpCircle size={14} /> Change role
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {status === 'SUSPENDED' ? (
            <DropdownMenuItem
              onClick={() => setModal('restore')}
              className="gap-2 cursor-pointer text-status-green"
            >
              <RotateCcw size={14} /> Restore account
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setModal('suspend')}
              className="gap-2 cursor-pointer text-status-red"
            >
              <Ban size={14} /> Suspend
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Suspend modal */}
      <Modal open={modal === 'suspend'} onOpenChange={(v) => !v && setModal(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle className="font-heading text-karis-green-900">
              Suspend {userName}
            </ModalTitle>
            <ModalDescription className="font-body text-sm text-karis-stone-500">
              The member will lose access immediately. Provide a reason.
            </ModalDescription>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-2">
              <Label className="text-xs font-body text-karis-stone-500">Reason</Label>
              <Textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Explain why this account is being suspended…"
                className="font-body text-sm resize-none"
                rows={3}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" size="sm" onClick={() => setModal(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleSuspend} disabled={isPending || !suspendReason.trim()}>
              {isPending ? 'Suspending…' : 'Suspend account'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Restore modal */}
      <Modal open={modal === 'restore'} onOpenChange={(v) => !v && setModal(null)}>
        <ModalContent dismissOnBackdrop={false}>
          <ModalHeader>
            <ModalTitle className="font-heading text-karis-green-900">
              Restore {userName}?
            </ModalTitle>
            <ModalDescription className="font-body text-sm text-karis-stone-500">
              The account will be set back to Active and the member will regain full access.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" size="sm" onClick={() => setModal(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleRestore} disabled={isPending}>
              {isPending ? 'Restoring…' : 'Restore account'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Upgrade role modal */}
      <Modal open={modal === 'upgrade'} onOpenChange={(v) => !v && setModal(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle className="font-heading text-karis-green-900">
              Change role — {userName}
            </ModalTitle>
            <ModalDescription className="font-body text-sm text-karis-stone-500">
              Current role: <strong>{role}</strong>
            </ModalDescription>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-2">
              <Label className="text-xs font-body text-karis-stone-500">New role</Label>
              <Select onValueChange={(v: string | null) => { if (v !== null) setTargetRole(v) }}>
                <SelectTrigger className="font-body text-sm">
                  <SelectValue placeholder="Select role…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VISITOR" className="font-body text-sm">Visitor</SelectItem>
                  <SelectItem value="RESIDENT" className="font-body text-sm">Resident</SelectItem>
                  <SelectItem value="VENDOR" className="font-body text-sm">Vendor</SelectItem>
                  <SelectItem value="ADMIN" className="font-body text-sm">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" size="sm" onClick={() => setModal(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleUpgrade} disabled={isPending || !targetRole}>
              {isPending ? 'Updating…' : 'Update role'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
