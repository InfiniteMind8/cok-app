'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronDown, ChevronRight, Users, Building2, FileText, AlertCircle } from 'lucide-react'
import type { TreeUser, TreeProperty, TreeLease, TreeIssue } from '@/lib/queries/data-directory'

interface EntityTreeProps {
  users: TreeUser[]
  properties: TreeProperty[]
  leases: TreeLease[]
  issues: TreeIssue[]
  search: string
}

const ROLE_ORDER = ['MASTER_ADMIN', 'ADMIN', 'RESIDENT', 'VENDOR', 'VISITOR']

const ROLE_LABELS: Record<string, string> = {
  MASTER_ADMIN: 'Master Admins',
  ADMIN: 'Admins',
  RESIDENT: 'Residents',
  VENDOR: 'Vendors',
  VISITOR: 'Visitors',
}

function TreeSection({
  label,
  icon: Icon,
  count,
  children,
  defaultOpen = true,
}: {
  label: string
  icon: React.ElementType
  count: number
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-karis-stone-100 rounded-lg transition-colors"
      >
        {open
          ? <ChevronDown className="h-3.5 w-3.5 text-karis-stone-400 shrink-0" />
          : <ChevronRight className="h-3.5 w-3.5 text-karis-stone-400 shrink-0" />}
        <Icon className="h-3.5 w-3.5 text-karis-stone-500 shrink-0" />
        <span className="font-body text-xs font-semibold text-karis-stone-700 flex-1">{label}</span>
        <span className="font-mono text-[10px] text-karis-stone-400">{count}</span>
      </button>
      {open && <div className="ml-4 border-l border-karis-stone-100">{children}</div>}
    </div>
  )
}

function TreeLeaf({
  href,
  label,
  sublabel,
  active,
}: {
  href: string
  label: string
  sublabel?: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`block px-3 py-1.5 rounded-lg mx-1 transition-colors ${
        active
          ? 'bg-karis-green-900 text-white'
          : 'hover:bg-karis-stone-100 text-karis-stone-700'
      }`}
    >
      <span className={`font-body text-xs block truncate ${active ? 'text-white' : ''}`}>{label}</span>
      {sublabel && (
        <span className={`font-mono text-[10px] block truncate ${active ? 'text-karis-green-200' : 'text-karis-stone-400'}`}>
          {sublabel}
        </span>
      )}
    </Link>
  )
}

export function EntityTree({ users, properties, leases, issues, search }: EntityTreeProps) {
  const searchParams = useSearchParams()
  const activeType = searchParams.get('type')
  const activeId = searchParams.get('id')
  const [localSearch, setLocalSearch] = useState(search)

  const buildHref = (type: string, id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('type', type)
    params.set('id', id)
    if (localSearch) params.set('q', localSearch)
    else params.delete('q')
    return `/admin/data-directory?${params}`
  }

  const filteredUsers = localSearch
    ? users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(localSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(localSearch.toLowerCase()) ||
          u.memberId.toLowerCase().includes(localSearch.toLowerCase()),
      )
    : users

  const usersByRole = ROLE_ORDER.reduce<Record<string, TreeUser[]>>((acc, role) => {
    acc[role] = filteredUsers.filter((u) => u.role === role)
    return acc
  }, {})

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-3 border-b border-karis-stone-100">
        <input
          type="text"
          placeholder="Search by name, email, ID…"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full font-body text-xs px-3 py-2 border border-karis-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-karis-green-400 placeholder:text-karis-stone-400"
        />
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Users */}
        <TreeSection label="All Users" icon={Users} count={filteredUsers.length}>
          {ROLE_ORDER.map((role) => {
            const roleUsers = usersByRole[role] ?? []
            if (roleUsers.length === 0) return null
            return (
              <div key={role} className="mt-1">
                <div className="px-3 py-1">
                  <span className="font-body text-[10px] font-semibold text-karis-stone-400 uppercase tracking-wider">
                    {ROLE_LABELS[role]} ({roleUsers.length})
                  </span>
                </div>
                {roleUsers.map((u) => (
                  <TreeLeaf
                    key={u.id}
                    href={buildHref('users', u.id)}
                    label={u.fullName}
                    sublabel={u.memberId}
                    active={activeType === 'users' && activeId === u.id}
                  />
                ))}
              </div>
            )
          })}
          {filteredUsers.length === 0 && (
            <p className="px-3 py-2 text-[10px] font-body text-karis-stone-400 italic">No users match.</p>
          )}
        </TreeSection>

        {/* Properties */}
        <TreeSection label="All Properties" icon={Building2} count={properties.length} defaultOpen={false}>
          {properties.map((p) => (
            <TreeLeaf
              key={p.id}
              href={buildHref('properties', p.id)}
              label={p.code}
              sublabel={p.address ?? p.type}
              active={activeType === 'properties' && activeId === p.id}
            />
          ))}
          {properties.length === 0 && (
            <p className="px-3 py-2 text-[10px] font-body text-karis-stone-400 italic">No properties.</p>
          )}
        </TreeSection>

        {/* Leases */}
        <TreeSection label="All Leases" icon={FileText} count={leases.length} defaultOpen={false}>
          {leases.map((l) => (
            <TreeLeaf
              key={l.id}
              href={buildHref('leases', l.id)}
              label={`${l.propertyCode} — ${l.userName}`}
              sublabel={l.leaseStatus}
              active={activeType === 'leases' && activeId === l.id}
            />
          ))}
          {leases.length === 0 && (
            <p className="px-3 py-2 text-[10px] font-body text-karis-stone-400 italic">No leases.</p>
          )}
        </TreeSection>

        {/* Issues */}
        <TreeSection label="All Issue Reports" icon={AlertCircle} count={issues.length} defaultOpen={false}>
          {issues.map((i) => (
            <TreeLeaf
              key={i.id}
              href={buildHref('issues', i.id)}
              label={i.title ?? i.category}
              sublabel={`${i.status} · ${i.reporterName}`}
              active={activeType === 'issues' && activeId === i.id}
            />
          ))}
          {issues.length === 0 && (
            <p className="px-3 py-2 text-[10px] font-body text-karis-stone-400 italic">No issues.</p>
          )}
        </TreeSection>
      </div>
    </div>
  )
}
