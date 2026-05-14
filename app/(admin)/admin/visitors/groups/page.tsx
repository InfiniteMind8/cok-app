import Link from 'next/link'
import { format } from 'date-fns'
import { Users } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { Badge } from '@/components/ui/badge'
import { adminVisitorGroupsApi } from '@/lib/api'
import { getServerApi } from '@/lib/api/server'
import { CreateGroupDialog } from './_components/create-group-dialog'
import { ArchiveGroupButton } from './_components/archive-group-button'

interface VisitorGroupRow {
  id: string
  name: string
  theme: string | null
  description: string
  archived: boolean
  createdAt: string
  createdBy: { fullName: string; memberId: string }
  _count: { memberships: number }
}

interface SearchParams {
  archived?: string
}

export default async function VisitorGroupsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const showArchived = sp.archived === '1'
  const groups = (await adminVisitorGroupsApi.list(getServerApi(), showArchived)) as VisitorGroupRow[]

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-start justify-between mb-8">
        <PageHeader
          title="Visitor Groups"
          subtitle="Create and manage cohort-based visitor groups. Send targeted announcements to specific groups."
        />
        <CreateGroupDialog />
      </div>

      <div className="flex items-center gap-4 mb-5">
        <span className="text-xs font-body text-karis-stone-500">
          {groups.length} group{groups.length !== 1 ? 's' : ''}
          {showArchived ? ' (including archived)' : ''}
        </span>
        <Link
          href={showArchived ? '/admin/visitors/groups' : '/admin/visitors/groups?archived=1'}
          className="text-xs font-body text-karis-stone-400 hover:text-karis-green-900 transition-colors"
        >
          {showArchived ? 'Hide archived' : 'Show archived'}
        </Link>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No visitor groups yet"
          body="Create a group to organize visitors by cohort and send targeted announcements."
        />
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <div
              key={g.id}
              className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-opacity ${
                g.archived ? 'opacity-60 border-karis-stone-100' : 'border-karis-stone-100 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-4 p-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link
                      href={`/admin/visitors/groups/${g.id}`}
                      className="font-heading text-base text-karis-green-900 hover:underline"
                    >
                      {g.name}
                    </Link>
                    {g.archived && (
                      <Badge
                        variant="secondary"
                        className="font-body text-xs bg-karis-stone-100 text-karis-stone-500"
                      >
                        Archived
                      </Badge>
                    )}
                    {g.theme && (
                      <Badge
                        variant="secondary"
                        className="font-body text-xs bg-karis-gold-50 text-karis-gold-700"
                      >
                        {g.theme}
                      </Badge>
                    )}
                  </div>
                  <p className="font-body text-sm text-karis-stone-500 line-clamp-1">
                    {g.description}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs font-body text-karis-stone-400">
                      {g._count.memberships} member{g._count.memberships !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs font-body text-karis-stone-400">
                      Created by {g.createdBy.fullName}
                    </span>
                    <span className="text-xs font-body text-karis-stone-400">
                      {format(new Date(g.createdAt), 'dd MMM yyyy')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/visitors/groups/${g.id}`}
                    className="text-xs font-body text-karis-green-900 hover:text-karis-green-700 border border-karis-green-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Manage
                  </Link>
                  <ArchiveGroupButton id={g.id} archived={g.archived} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
