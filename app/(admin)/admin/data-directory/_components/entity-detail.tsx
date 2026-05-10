'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { Download, ExternalLink, KeyRound, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { adminDataDirectoryApi, attachmentsApi, getBrowserApi } from '@/lib/api'
import { JsonDiffView } from '../../audit-log/_components/json-diff-view'
import type { getUserEntityDetail, getPropertyEntityDetail, getLeaseEntityDetail, getIssueEntityDetail } from '@/lib/queries/data-directory'

type UserDetail = NonNullable<Awaited<ReturnType<typeof getUserEntityDetail>>>
type PropertyDetail = NonNullable<Awaited<ReturnType<typeof getPropertyEntityDetail>>>
type LeaseDetail = NonNullable<Awaited<ReturnType<typeof getLeaseEntityDetail>>>
type IssueDetail = NonNullable<Awaited<ReturnType<typeof getIssueEntityDetail>>>
type EntityDetail = UserDetail | PropertyDetail | LeaseDetail | IssueDetail

const TABS = ['Overview', 'Records', 'Attachments', 'Transactions', 'Audit'] as const
type Tab = (typeof TABS)[number]

function TabBar({ active, onChange, showTransactions }: { active: Tab; onChange: (t: Tab) => void; showTransactions: boolean }) {
  return (
    <div className="flex gap-1 border-b border-karis-stone-100 px-4">
      {TABS.filter((t) => t !== 'Transactions' || showTransactions).map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`font-body text-xs px-3 py-2.5 border-b-2 transition-colors ${
            active === tab
              ? 'border-karis-green-700 text-karis-green-900 font-semibold'
              : 'border-transparent text-karis-stone-500 hover:text-karis-stone-900'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2 border-b border-karis-stone-50 last:border-0">
      <span className="font-body text-xs text-karis-stone-400 w-40 shrink-0">{label}</span>
      <span className="font-body text-xs text-karis-stone-800 flex-1 break-all">{value ?? '—'}</span>
    </div>
  )
}

function AttachmentCard({
  att,
}: {
  att: { id: string; name: string; mimeType: string; storageKey: string }
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const isImage = att.mimeType.startsWith('image/')

  function handleView() {
    startTransition(async () => {
      try {
        const result = await attachmentsApi.getUrl(getBrowserApi(), att.id)
        setUrl(result.url)
        window.open(result.url, '_blank', 'noopener')
      } catch {
        // Surface failure quietly — the user retries via the button.
      }
    })
  }

  return (
    <div className="border border-karis-stone-200 rounded-lg p-3 flex flex-col gap-2 bg-white">
      {isImage && url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={att.name} className="w-full h-24 object-cover rounded" />
      ) : (
        <div className="w-full h-24 bg-karis-stone-50 rounded flex items-center justify-center">
          <span className="font-mono text-[10px] text-karis-stone-400 uppercase">{att.mimeType.split('/')[1]}</span>
        </div>
      )}
      <p className="font-body text-xs text-karis-stone-700 truncate" title={att.name}>{att.name}</p>
      <button
        onClick={handleView}
        disabled={pending}
        className="inline-flex items-center gap-1.5 text-xs font-body text-karis-green-700 hover:text-karis-green-900 disabled:opacity-50 transition-colors"
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
        View
      </button>
    </div>
  )
}

function AuditTab({ entries }: { entries: Array<{ id: string; action: string; entity: string; createdAt: Date; before: unknown; after: unknown }> }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  if (entries.length === 0) {
    return <p className="text-xs font-body text-karis-stone-400 italic py-4">No audit entries for this entity.</p>
  }

  return (
    <div className="space-y-1">
      {entries.map((e) => (
        <div key={e.id} className="border border-karis-stone-100 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpanded((prev) => {
              const next = new Set(prev)
              if (next.has(e.id)) { next.delete(e.id) } else { next.add(e.id) }
              return next
            })}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-karis-stone-50 transition-colors text-left"
          >
            <span className="font-mono text-[10px] text-karis-stone-400 tabular-nums">
              {format(new Date(e.createdAt), 'yyyy-MM-dd HH:mm')}
            </span>
            <span className="font-mono text-xs font-semibold text-karis-green-800">{e.action}</span>
          </button>
          {expanded.has(e.id) && (
            <div className="px-3 pb-3 bg-karis-stone-50/50">
              <JsonDiffView before={e.before} after={e.after} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function UserDetailPanel({ detail, userRole }: { detail: UserDetail; userRole: string }) {
  const [tab, setTab] = useState<Tab>('Overview')
  const [mfaPending, startMfaTransition] = useTransition()
  const [mfaMsg, setMfaMsg] = useState<{ ok: boolean; msg: string } | null>(null)
  const { entity: user, walletBalance, attachments, auditEntries, ledgerEntries } = detail

  const isStaff = user.role === 'MASTER_ADMIN' || user.role === 'ADMIN'
  const isMasterAdmin = userRole === 'MASTER_ADMIN'

  function handleMfaReset() {
    if (!isMasterAdmin) return
    startMfaTransition(async () => {
      try {
        await adminDataDirectoryApi.resetMfa(getBrowserApi(), user.id)
        setMfaMsg({ ok: true, msg: '2FA reset. User will re-enrol on next sign-in.' })
      } catch (err) {
        setMfaMsg({ ok: false, msg: err instanceof Error ? err.message : 'Unknown error' })
      }
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header identity card */}
      <div className="p-4 border-b border-karis-stone-100 flex items-center gap-3">
        {user.profilePhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.profilePhotoUrl} alt={user.fullName} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-karis-green-100 flex items-center justify-center">
            <span className="font-heading text-sm text-karis-green-800 font-semibold">
              {user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-heading text-base text-karis-green-900 truncate">{user.fullName}</p>
          <p className="font-body text-xs text-karis-stone-500">{user.email}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant="outline" className="text-[10px]">{user.role}</Badge>
          <Badge variant="outline" className="text-[10px]">{user.status}</Badge>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-karis-stone-100 bg-karis-stone-50/60">
        {isMasterAdmin && (
          <a
            href={`/api/admin/data-directory/export/${user.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-body text-karis-stone-600 hover:text-karis-green-900 border border-karis-stone-200 bg-white hover:bg-karis-green-50 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <Download className="h-3 w-3" />
            Export records
          </a>
        )}
        {isStaff && isMasterAdmin && (
          <button
            onClick={handleMfaReset}
            disabled={mfaPending}
            className="inline-flex items-center gap-1.5 text-xs font-body text-red-600 hover:text-red-800 border border-red-200 bg-white hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {mfaPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <KeyRound className="h-3 w-3" />}
            Reset MFA
          </button>
        )}
        {mfaMsg && (
          <span className={`text-xs font-body ${mfaMsg.ok ? 'text-emerald-600' : 'text-red-600'}`}>
            {mfaMsg.msg}
          </span>
        )}
      </div>

      <TabBar active={tab} onChange={setTab} showTransactions />

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'Overview' && (
          <div>
            <FieldRow label="Member ID" value={user.memberId} />
            <FieldRow label="Role" value={user.role} />
            <FieldRow label="Status" value={user.status} />
            <FieldRow label="Wallet balance" value={walletBalance ? `K ${walletBalance.toFixed(2)}` : '—'} />
            <FieldRow label="Display currency" value={user.displayCurrency} />
            <FieldRow label="Founding member" value={user.foundingMember ? 'Yes' : 'No'} />
            <FieldRow label="Created" value={format(new Date(user.createdAt), 'yyyy-MM-dd')} />
          </div>
        )}

        {tab === 'Records' && (
          <div>
            <FieldRow label="Full name" value={user.fullName} />
            <FieldRow label="Preferred name" value={user.preferredName} />
            <FieldRow label="Email" value={user.email} />
            <FieldRow label="Phone" value={user.phone} />
            <FieldRow label="Gender" value={user.gender} />
            <FieldRow label="National ID type" value={user.nationalIdType} />
            <FieldRow label="National ID number" value={user.nationalIdNumber} />
            <FieldRow label="Emergency contact name" value={user.emergencyContactName} />
            <FieldRow label="Emergency contact phone" value={user.emergencyContactPhone} />
            <FieldRow label="Household size" value={user.householdSize} />
            <FieldRow label="Vehicle plates" value={user.vehiclePlates?.join(', ')} />
            <FieldRow label="Notes" value={user.notes} />
            {user.visitorProfile && (
              <>
                <p className="font-body text-[10px] font-semibold text-karis-stone-400 uppercase tracking-wider mt-3 mb-1">Visitor Profile</p>
                <FieldRow label="Visit purpose" value={user.visitorProfile.visitPurpose} />
                <FieldRow label="Expected arrival" value={user.visitorProfile.expectedArrival ? format(new Date(user.visitorProfile.expectedArrival), 'yyyy-MM-dd') : undefined} />
                <FieldRow label="Expected departure" value={user.visitorProfile.expectedDeparture ? format(new Date(user.visitorProfile.expectedDeparture), 'yyyy-MM-dd') : undefined} />
              </>
            )}
            {user.vendorProfile && (
              <>
                <p className="font-body text-[10px] font-semibold text-karis-stone-400 uppercase tracking-wider mt-3 mb-1">Vendor Profile</p>
                <FieldRow label="Business name" value={user.vendorProfile.businessName} />
                <FieldRow label="Business category" value={user.vendorProfile.businessCategory} />
                <FieldRow label="Payout method" value={user.vendorProfile.payoutMethod} />
              </>
            )}
          </div>
        )}

        {tab === 'Attachments' && (
          <div>
            {attachments.length === 0 ? (
              <p className="text-xs font-body text-karis-stone-400 italic">No attachments.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {attachments.map((att) => (
                  <AttachmentCard key={att.id} att={att} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'Transactions' && (
          <div className="space-y-1">
            {ledgerEntries.length === 0 ? (
              <p className="text-xs font-body text-karis-stone-400 italic">No ledger entries.</p>
            ) : (
              ledgerEntries.map((e) => (
                <div key={e.id} className="flex items-center gap-3 py-2 border-b border-karis-stone-50 last:border-0">
                  <span className="font-mono text-[10px] text-karis-stone-400 tabular-nums w-32 shrink-0">
                    {format(new Date(e.createdAt), 'yyyy-MM-dd')}
                  </span>
                  <span className="font-body text-xs text-karis-stone-700 flex-1 truncate">
                    {e.transaction.description}
                  </span>
                  <Badge variant="outline" className="text-[10px]">{e.transaction.type}</Badge>
                  <span className={`font-mono text-xs tabular-nums ${Number(e.amount) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {Number(e.amount) >= 0 ? '+' : ''}{Number(e.amount).toFixed(4)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'Audit' && <AuditTab entries={auditEntries} />}
      </div>
    </div>
  )
}

function PropertyDetailPanel({ detail }: { detail: PropertyDetail }) {
  const [tab, setTab] = useState<Tab>('Overview')
  const { entity: property, attachments, auditEntries } = detail

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-karis-stone-100">
        <p className="font-heading text-base text-karis-green-900">{property.code}</p>
        <p className="font-body text-xs text-karis-stone-500">{property.address ?? property.type}</p>
      </div>

      <TabBar active={tab} onChange={setTab} showTransactions={false} />

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'Overview' && (
          <div>
            <FieldRow label="Code" value={property.code} />
            <FieldRow label="Type" value={property.type} />
            <FieldRow label="Category" value={property.category} />
            <FieldRow label="Status" value={property.propertyStatus} />
            <FieldRow label="Lot number" value={property.lotNumber} />
            <FieldRow label="Size (sqm)" value={property.sizeSqm?.toString()} />
            <FieldRow label="Bedrooms" value={property.bedrooms} />
            <FieldRow label="Bathrooms" value={property.bathrooms} />
            <FieldRow label="Year built" value={property.yearBuilt} />
            <FieldRow label="Total price" value={property.totalPrice ? `$${Number(property.totalPrice).toFixed(2)}` : undefined} />
            <FieldRow label="Valuation (KCRD)" value={property.currentValuationKcrd?.toString()} />
          </div>
        )}

        {tab === 'Records' && (
          <div>
            <p className="font-body text-[10px] font-semibold text-karis-stone-400 uppercase tracking-wider mb-2">Ownerships</p>
            {property.ownerships.map((o) => (
              <div key={o.id} className="flex gap-2 py-1.5 border-b border-karis-stone-50">
                <span className="font-body text-xs text-karis-stone-700">{o.user.fullName}</span>
                <span className="font-body text-xs text-karis-stone-400">({Number(o.ownershipPct)}%)</span>
              </div>
            ))}
            <p className="font-body text-[10px] font-semibold text-karis-stone-400 uppercase tracking-wider mt-3 mb-2">Tenancies</p>
            {property.tenancies.map((t) => (
              <div key={t.id} className="flex gap-2 py-1.5 border-b border-karis-stone-50">
                <span className="font-body text-xs text-karis-stone-700">{t.user.fullName}</span>
                <Badge variant="outline" className="text-[10px]">{t.leaseStatus}</Badge>
              </div>
            ))}
          </div>
        )}

        {tab === 'Attachments' && (
          <div>
            {attachments.length === 0 ? (
              <p className="text-xs font-body text-karis-stone-400 italic">No attachments.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {attachments.map((att) => (
                  <AttachmentCard key={att.id} att={att} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'Audit' && <AuditTab entries={auditEntries} />}
      </div>
    </div>
  )
}

function GenericDetailPanel({ detail }: { detail: LeaseDetail | IssueDetail }) {
  const [tab, setTab] = useState<Tab>('Overview')
  const { entity, attachments, auditEntries } = detail

  const title = detail.type === 'Lease'
    ? `${(entity as LeaseDetail['entity']).property.code} — ${(entity as LeaseDetail['entity']).user.fullName}`
    : ((entity as IssueDetail['entity']).title ?? (entity as IssueDetail['entity']).category)

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-karis-stone-100">
        <p className="font-heading text-base text-karis-green-900">{title}</p>
        <p className="font-body text-xs text-karis-stone-500 capitalize">{detail.type}</p>
      </div>

      <TabBar active={tab} onChange={setTab} showTransactions={false} />

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'Overview' && (
          <pre className="text-xs font-mono text-karis-stone-700 bg-karis-stone-50 rounded p-3 overflow-auto whitespace-pre-wrap break-all">
            {JSON.stringify(entity, null, 2)}
          </pre>
        )}

        {tab === 'Records' && (
          <pre className="text-xs font-mono text-karis-stone-700 bg-karis-stone-50 rounded p-3 overflow-auto whitespace-pre-wrap break-all">
            {JSON.stringify(entity, null, 2)}
          </pre>
        )}

        {tab === 'Attachments' && (
          <div>
            {attachments.length === 0 ? (
              <p className="text-xs font-body text-karis-stone-400 italic">No attachments.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {attachments.map((att) => (
                  <AttachmentCard key={att.id} att={att} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'Audit' && <AuditTab entries={auditEntries} />}
      </div>
    </div>
  )
}

export function EntityDetailPanel({
  detail,
  userRole,
}: {
  detail: EntityDetail | null
  userRole: string
}) {
  if (!detail) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <p className="font-heading text-lg text-karis-stone-300">Select an entity</p>
          <p className="font-body text-sm text-karis-stone-400 mt-1">
            Choose a user, property, lease, or issue from the tree to inspect its records.
          </p>
        </div>
      </div>
    )
  }

  if (detail.type === 'User') return <UserDetailPanel detail={detail} userRole={userRole} />
  if (detail.type === 'Property') return <PropertyDetailPanel detail={detail} />
  return <GenericDetailPanel detail={detail} />
}
