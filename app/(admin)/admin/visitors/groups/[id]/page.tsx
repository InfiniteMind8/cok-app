import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowLeft, Megaphone, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getVisitorGroupById } from '@/lib/queries/visitor-groups'
import { getUsers } from '@/lib/queries/accounts'
import { MemberManager } from './_components/member-manager'
import { EditGroupDialog } from './_components/edit-group-dialog'
import { ArchiveGroupButton } from '../_components/archive-group-button'

export default async function VisitorGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const group = await getVisitorGroupById(id)
  if (!group) notFound()

  const { users: allVisitors } = await getUsers({ role: 'VISITOR', pageSize: 200 })

  const activeMemberIds = new Set(group.memberships.map((m) => m.userId))
  const availableVisitors = allVisitors
    .filter((v) => !activeMemberIds.has(v.id))
    .map((v) => ({ id: v.id, fullName: v.fullName, memberId: v.memberId, email: v.email }))

  return (
    <div className="p-8 max-w-4xl">
      <Link
        href="/admin/visitors/groups"
        className="inline-flex items-center gap-1.5 text-xs font-body text-karis-stone-500 hover:text-karis-stone-900 mb-6 transition-colors"
      >
        <ArrowLeft size={13} /> All groups
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-heading text-2xl text-karis-green-900">{group.name}</h1>
            {group.archived && (
              <Badge variant="secondary" className="font-body text-xs bg-karis-stone-100 text-karis-stone-500">
                Archived
              </Badge>
            )}
            {group.theme && (
              <Badge variant="secondary" className="font-body text-xs bg-karis-gold-50 text-karis-gold-700">
                {group.theme}
              </Badge>
            )}
          </div>
          <p className="font-body text-sm text-karis-stone-500 max-w-lg">{group.description}</p>
          <p className="font-body text-xs text-karis-stone-400 mt-1.5">
            Created by {group.createdBy.fullName} · {format(group.createdAt, 'dd MMM yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <EditGroupDialog
            id={group.id}
            defaultValues={{
              name: group.name,
              theme: group.theme,
              description: group.description,
            }}
          />
          <ArchiveGroupButton id={group.id} archived={group.archived} />
        </div>
      </div>

      {/* Send announcement button */}
      {!group.archived && (
        <div className="mb-8">
          <Link
            href={`/admin/community?announce=group&groupId=${group.id}&groupName=${encodeURIComponent(group.name)}`}
            className="inline-flex items-center gap-2 font-body text-sm bg-karis-green-900 text-white px-4 py-2.5 rounded-xl hover:bg-karis-green-700 transition-colors"
          >
            <Megaphone size={15} /> Send announcement to this group
          </Link>
        </div>
      )}

      {/* Members */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users size={15} className="text-karis-stone-500" />
          <h2 className="font-heading text-base text-karis-stone-900">
            Members ({group.memberships.length})
          </h2>
        </div>

        <MemberManager
          groupId={group.id}
          members={group.memberships.map((m) => ({
            id: m.id,
            userId: m.userId,
            assignedAt: m.assignedAt,
            user: m.user,
            assignedBy: m.assignedBy,
          }))}
          availableVisitors={availableVisitors}
        />
      </div>
    </div>
  )
}
