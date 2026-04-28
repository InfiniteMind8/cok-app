import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { MessageSquare, Vote, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getCommunityUpdates, getAdminVotes, getIssues } from '@/lib/queries/community'
import { getVisitorGroups } from '@/lib/queries/visitor-groups'
import { IssueLevel, IssueStatus, Role } from '@prisma/client'
import { NewUpdateSheet } from './_components/new-update-sheet'
import { NewVoteSheet, CloseVoteButton } from './_components/new-vote-sheet'
import { IssuesTable } from './_components/issues-table'

interface SearchParams {
  tab?: string
  seriousness?: string
  urgency?: string
  status?: string
  role?: string
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const tab = sp.tab ?? 'updates'

  const seriousness = Object.values(IssueLevel).includes(sp.seriousness as IssueLevel)
    ? (sp.seriousness as IssueLevel) : undefined
  const urgency = Object.values(IssueLevel).includes(sp.urgency as IssueLevel)
    ? (sp.urgency as IssueLevel) : undefined
  const issueStatus = Object.values(IssueStatus).includes(sp.status as IssueStatus)
    ? (sp.status as IssueStatus) : undefined
  const issueRole = Object.values(Role).includes(sp.role as Role)
    ? (sp.role as Role) : undefined

  const [{ updates }, votes, { issues }, visitorGroups] = await Promise.all([
    getCommunityUpdates(1, 20),
    getAdminVotes(),
    getIssues({ seriousness, urgency, status: issueStatus, role: issueRole, page: 1, pageSize: 40 }),
    getVisitorGroups(false),
  ])

  const openIssueCount = issues.filter((i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="Community"
        subtitle="Publish updates, manage votes, and track member issues."
      />

      <Tabs defaultValue={tab}>
        <TabsList className="mb-6">
          <TabsTrigger value="updates" className="font-body text-sm gap-2">
            <MessageSquare size={14} /> Updates
          </TabsTrigger>
          <TabsTrigger value="votes" className="font-body text-sm gap-2">
            <Vote size={14} /> Votes
          </TabsTrigger>
          <TabsTrigger value="issues" className="font-body text-sm gap-2">
            <AlertTriangle size={14} /> Issues
            {openIssueCount > 0 && (
              <Badge variant="secondary" className="text-xs h-5 min-w-5 px-1.5 bg-status-red/15 text-status-red">
                {openIssueCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ─── Updates ──────────────────────────────────────────────────── */}
        <TabsContent value="updates">
          <div className="flex justify-between items-center mb-5">
            <span className="text-xs font-body text-karis-stone-500">{updates.length} update{updates.length !== 1 ? 's' : ''}</span>
            <NewUpdateSheet
              visitorGroups={visitorGroups.map((g) => ({
                id: g.id,
                name: g.name,
                theme: g.theme,
              }))}
            />
          </div>
          {updates.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No updates yet" body="Community updates will appear here after publishing." />
          ) : (
            <div className="space-y-4">
              {updates.map((u) => (
                <div key={u.id} className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
                  <div className="flex gap-4 p-5">
                    {u.photoUrl && (
                      <div className="relative w-24 h-20 rounded-lg overflow-hidden shrink-0">
                        <Image src={u.photoUrl} alt={u.headline} fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-heading text-base text-karis-green-900">{u.headline}</h3>
                        <Badge variant="secondary" className="font-body text-xs bg-karis-stone-100 text-karis-stone-700 shrink-0">
                          {u.category}
                        </Badge>
                      </div>
                      <p className="font-body text-sm text-karis-stone-500 line-clamp-2">{u.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs font-body text-karis-stone-400">
                          {format(u.publishedAt, 'dd MMM yyyy')}
                        </span>
                        <span className="text-xs font-body text-karis-stone-400">
                          {u._count.acknowledgements} read
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Votes ────────────────────────────────────────────────────── */}
        <TabsContent value="votes">
          <div className="flex justify-between items-center mb-5">
            <span className="text-xs font-body text-karis-stone-500">
              {votes.filter((v) => v.isOpen).length} open · {votes.filter((v) => !v.isOpen).length} closed
            </span>
            <NewVoteSheet />
          </div>
          {votes.length === 0 ? (
            <EmptyState icon={Vote} title="No votes yet" body="Create a vote to gather community input." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {votes.map((v) => (
                <div key={v.id} className="bg-white border border-karis-stone-100 rounded-xl shadow-sm p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading text-base text-karis-green-900">{v.headline}</h3>
                    <Badge
                      variant="secondary"
                      className={`font-body text-xs shrink-0 ${v.isOpen ? 'bg-status-green/15 text-status-green' : 'bg-karis-stone-100 text-karis-stone-500'}`}
                    >
                      {v.isOpen ? 'Open' : 'Closed'}
                    </Badge>
                  </div>
                  <p className="font-body text-xs text-karis-stone-500 line-clamp-2">{v.description}</p>
                  <div className="space-y-2">
                    {v.options.map((o) => (
                      <div key={o.id} className="space-y-0.5">
                        <div className="flex justify-between items-center text-xs font-body">
                          <span className="text-karis-stone-700">{o.label}</span>
                        </div>
                        <details className="group">
                          <summary className="text-xs font-body text-karis-stone-400 cursor-pointer list-none hover:text-karis-stone-600 transition-colors">
                            {o._count.submissions} {o._count.submissions === 1 ? 'vote' : 'votes'}
                          </summary>
                          {o.submissions.length > 0 ? (
                            <ul className="mt-1 pl-3 space-y-0.5 border-l border-karis-stone-100">
                              {o.submissions.map((s) => (
                                <li key={s.id} className="text-xs font-body text-karis-stone-500">
                                  {s.user.fullName} · {s.user.memberId}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-1 text-xs font-body text-karis-stone-400 pl-3">No votes yet</p>
                          )}
                        </details>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-karis-stone-50">
                    <div className="space-y-0.5">
                      <span className="text-xs font-body text-karis-stone-400">
                        {v._count.submissions} total · {format(v.createdAt, 'dd MMM yyyy')}
                      </span>
                      <p className="text-[10px] font-body text-karis-stone-300">
                        Participant data is visible to Admin only.
                      </p>
                    </div>
                    {v.isOpen && <CloseVoteButton voteId={v.id} headline={v.headline} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Issues ───────────────────────────────────────────────────── */}
        <TabsContent value="issues">
          {/* Filters */}
          <form method="GET" className="flex flex-wrap gap-3 mb-5">
            <input type="hidden" name="tab" value="issues" />
            <Select name="seriousness" defaultValue={sp.seriousness ?? ''}>
              <SelectTrigger className="font-body text-sm w-36 h-9">
                <SelectValue placeholder="Seriousness" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" className="font-body text-sm">All seriousness</SelectItem>
                <SelectItem value="YELLOW" className="font-body text-sm">Yellow</SelectItem>
                <SelectItem value="ORANGE" className="font-body text-sm">Orange</SelectItem>
                <SelectItem value="RED" className="font-body text-sm">Red</SelectItem>
              </SelectContent>
            </Select>
            <Select name="urgency" defaultValue={sp.urgency ?? ''}>
              <SelectTrigger className="font-body text-sm w-32 h-9">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" className="font-body text-sm">All urgency</SelectItem>
                <SelectItem value="YELLOW" className="font-body text-sm">Yellow</SelectItem>
                <SelectItem value="ORANGE" className="font-body text-sm">Orange</SelectItem>
                <SelectItem value="RED" className="font-body text-sm">Red</SelectItem>
              </SelectContent>
            </Select>
            <Select name="status" defaultValue={sp.status ?? ''}>
              <SelectTrigger className="font-body text-sm w-36 h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" className="font-body text-sm">All statuses</SelectItem>
                <SelectItem value="OPEN" className="font-body text-sm">Open</SelectItem>
                <SelectItem value="IN_PROGRESS" className="font-body text-sm">In progress</SelectItem>
                <SelectItem value="RESOLVED" className="font-body text-sm">Resolved</SelectItem>
                <SelectItem value="CLOSED" className="font-body text-sm">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select name="role" defaultValue={sp.role ?? ''}>
              <SelectTrigger className="font-body text-sm w-32 h-9">
                <SelectValue placeholder="Reporter role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" className="font-body text-sm">All roles</SelectItem>
                <SelectItem value="RESIDENT" className="font-body text-sm">Resident</SelectItem>
                <SelectItem value="VENDOR" className="font-body text-sm">Vendor</SelectItem>
                <SelectItem value="VISITOR" className="font-body text-sm">Visitor</SelectItem>
                <SelectItem value="ADMIN" className="font-body text-sm">Admin</SelectItem>
              </SelectContent>
            </Select>
            <button
              type="submit"
              className="text-xs font-body text-white bg-karis-green-900 hover:bg-karis-green-700 px-4 py-2 rounded-lg transition-colors h-9"
            >
              Filter
            </button>
            {(sp.seriousness || sp.urgency || sp.status || sp.role) && (
              <Link
                href="/admin/community?tab=issues"
                className="text-xs font-body text-karis-stone-500 hover:text-karis-stone-900 px-3 py-2 border border-karis-stone-100 rounded-lg transition-colors h-9 flex items-center"
              >
                Clear
              </Link>
            )}
          </form>

          <IssuesTable issues={issues as unknown as Parameters<typeof IssuesTable>[0]['issues']} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
