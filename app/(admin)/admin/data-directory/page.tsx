import { Suspense } from 'react'
import { requireRole } from '@/lib/auth'
import {
  getDirectoryTree,
  getUserEntityDetail,
  getPropertyEntityDetail,
  getLeaseEntityDetail,
  getIssueEntityDetail,
} from '@/lib/queries/data-directory'
import { EntityTree } from './_components/entity-tree'
import { EntityDetailPanel } from './_components/entity-detail'

interface SearchParams {
  type?: string
  id?: string
  q?: string
}

async function EntityDetailLoader({
  type,
  id,
  userRole,
}: {
  type: string
  id: string
  userRole: string
}) {
  let detail = null

  if (type === 'users') detail = await getUserEntityDetail(id)
  else if (type === 'properties') detail = await getPropertyEntityDetail(id)
  else if (type === 'leases') detail = await getLeaseEntityDetail(id)
  else if (type === 'issues') detail = await getIssueEntityDetail(id)

  return <EntityDetailPanel detail={detail} userRole={userRole} />
}

export default async function DataDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const actor = await requireRole('MASTER_ADMIN')
  const sp = await searchParams
  const { type, id, q } = sp

  const { users, properties, leases, issues } = await getDirectoryTree(q)

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      {/* Left rail */}
      <div className="w-64 shrink-0 border-r border-karis-stone-100 bg-white overflow-hidden flex flex-col">
        <div className="p-4 border-b border-karis-stone-100">
          <h2 className="font-heading text-base text-karis-green-900">Data Directory</h2>
          <p className="font-body text-[10px] text-karis-stone-400 mt-0.5">
            {users.length + properties.length + leases.length + issues.length} entities
          </p>
        </div>
        <Suspense fallback={null}>
          <EntityTree
            users={users}
            properties={properties}
            leases={leases}
            issues={issues}
            search={q ?? ''}
          />
        </Suspense>
      </div>

      {/* Right pane */}
      <div className="flex-1 overflow-hidden bg-karis-stone-50/30">
        {type && id ? (
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <p className="font-body text-sm text-karis-stone-400">Loading…</p>
              </div>
            }
          >
            <EntityDetailLoader type={type} id={id} userRole={actor.role} />
          </Suspense>
        ) : (
          <EntityDetailPanel detail={null} userRole={actor.role} />
        )}
      </div>
    </div>
  )
}
