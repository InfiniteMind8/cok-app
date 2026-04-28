'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { assignMemberAction, removeMemberAction } from '@/app/(admin)/_actions/visitor-groups'
import { format } from 'date-fns'

interface Visitor {
  id: string
  fullName: string
  memberId: string
  email: string
}

interface Member {
  id: string
  userId: string
  assignedAt: Date
  user: { id: string; fullName: string; memberId: string; email: string }
  assignedBy: { fullName: string; memberId: string }
}

export function MemberManager({
  groupId,
  members,
  availableVisitors,
}: {
  groupId: string
  members: Member[]
  availableVisitors: Visitor[]
}) {
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [isPending, startTransition] = useTransition()

  const unassigned = availableVisitors.filter(
    (v) => !members.some((m) => m.userId === v.id),
  )

  function handleAssign() {
    if (!selectedUserId) return
    startTransition(async () => {
      try {
        await assignMemberAction(groupId, selectedUserId)
        toast.success('Visitor assigned to group')
        setSelectedUserId('')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to assign')
      }
    })
  }

  function handleRemove(membershipId: string) {
    startTransition(async () => {
      try {
        await removeMemberAction(membershipId)
        toast.success('Member removed')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to remove')
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* Assign visitor */}
      {unassigned.length > 0 && (
        <div className="flex items-center gap-3">
          <Select value={selectedUserId} onValueChange={(v) => setSelectedUserId(v ?? '')}>
            <SelectTrigger className="font-body text-sm w-72 h-9">
              <SelectValue placeholder="Select a visitor to assign…" />
            </SelectTrigger>
            <SelectContent>
              {unassigned.map((v) => (
                <SelectItem key={v.id} value={v.id} className="font-body text-sm">
                  {v.fullName} · {v.memberId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="font-body text-sm gap-1.5 h-9"
            onClick={handleAssign}
            disabled={!selectedUserId || isPending}
          >
            <UserPlus size={14} /> Assign
          </Button>
        </div>
      )}

      {/* Member list */}
      {members.length === 0 ? (
        <p className="text-sm font-body text-karis-stone-400">No members yet.</p>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-4 bg-white border border-karis-stone-100 rounded-xl px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-body text-sm text-karis-stone-900">{m.user.fullName}</p>
                <p className="font-body text-xs text-karis-stone-400">
                  {m.user.memberId} · {m.user.email}
                </p>
                <p className="font-body text-xs text-karis-stone-400">
                  Assigned by {m.assignedBy.fullName} · {format(new Date(m.assignedAt), 'dd MMM yyyy')}
                </p>
              </div>
              <button
                onClick={() => handleRemove(m.id)}
                disabled={isPending}
                className="text-karis-stone-400 hover:text-status-red transition-colors disabled:opacity-40"
                aria-label="Remove member"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
