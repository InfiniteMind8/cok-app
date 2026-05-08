import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUpdatesWithAcknowledgements, getVotesWithUserSubmissions, getNotifications } from '@/lib/queries/community'
import { getUserActiveGroups } from '@/lib/queries/visitor-groups'
import { UpdatesFeed } from './_components/updates-feed'
import { VotingList } from './_components/vote-card'
import { NotificationList } from './_components/notification-list'
import { RaiseIssueFab } from './_components/raise-issue-fab'

export const dynamic = 'force-dynamic'

const RESIDENT_TABS = ['updates', 'voting', 'notifications'] as const
const VISITOR_TABS = ['updates', 'my-groups', 'notifications'] as const
type Tab = 'updates' | 'voting' | 'notifications' | 'my-groups'

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const isVisitor = user.role === 'VISITOR'
  const sp = await searchParams

  const validTabs: readonly string[] = isVisitor ? VISITOR_TABS : RESIDENT_TABS
  const activeTab: Tab = validTabs.includes(sp.tab ?? '') ? (sp.tab as Tab) : 'updates'

  const myGroups = isVisitor ? await getUserActiveGroups(user.id) : []
  const activeGroupIds = myGroups.map((g) => g.id)

  const [{ updates }, votes, notifications] = await Promise.all([
    getUpdatesWithAcknowledgements(user.id, user.role, activeGroupIds),
    isVisitor ? Promise.resolve([]) : getVotesWithUserSubmissions(user.id),
    getNotifications(user.id),
  ])

  const unreadCount = notifications.filter((n) => !n.readAt).length

  const openVotes = votes.filter((v) => v.isOpen)
  const closedVotes = votes.filter((v) => !v.isOpen)

  const toVoteProps = (v: (typeof votes)[number]) => ({
    voteId: v.id,
    headline: v.headline,
    description: v.description,
    isOpen: v.isOpen,
    options: v.options,
    totalVotes: v._count.submissions,
    userVotedOptionId: v.submissions[0]?.optionId ?? null,
  })

  const tabList = isVisitor ? VISITOR_TABS : RESIDENT_TABS

  return (
    <div className="pb-8">
      {/* Sticky tab row */}
      <div className="sticky top-14 z-30 bg-karis-stone-50 border-b border-karis-stone-100">
        <nav aria-label="Community sections" className="flex max-w-lg mx-auto">
          {tabList.map((tab) => {
            const isActive = tab === activeTab
            const label =
              tab === 'updates'
                ? 'Updates'
                : tab === 'voting'
                ? 'Voting'
                : tab === 'my-groups'
                ? `My Groups${myGroups.length > 0 ? ` (${myGroups.length})` : ''}`
                : `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`
            return (
              <a
                key={tab}
                href={`/community?tab=${tab}`}
                aria-current={isActive ? 'page' : undefined}
                className={`flex-1 py-3 text-center font-body text-sm transition-colors duration-150 ${
                  isActive
                    ? 'text-karis-green-900 border-b-2 border-karis-green-900'
                    : 'text-karis-stone-500 hover:text-karis-stone-700'
                }`}
              >
                {label}
              </a>
            )
          })}
        </nav>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto">
        {activeTab === 'updates' && (
          <UpdatesFeed
            updates={updates.map((u) => ({
              id: u.id,
              category: u.category,
              headline: u.headline,
              message: u.message,
              photoUrl: u.photoUrl,
              publishedAt: new Date(u.publishedAt),
              acknowledgements: u.acknowledgements,
            }))}
          />
        )}

        {activeTab === 'voting' && !isVisitor && (
          <VotingList
            votes={openVotes.map(toVoteProps)}
            pastVotes={closedVotes.map(toVoteProps)}
          />
        )}

        {activeTab === 'my-groups' && isVisitor && (
          <div className="space-y-4">
            <p className="font-body text-xs text-karis-stone-500 uppercase tracking-wider">
              Your visitor groups
            </p>
            {myGroups.length === 0 ? (
              <p className="font-body text-sm text-karis-stone-400">
                You have not been assigned to any visitor groups yet.
              </p>
            ) : (
              myGroups.map((g) => (
                <div
                  key={g.id}
                  className="bg-white border border-karis-stone-100 rounded-xl p-4 space-y-1"
                >
                  <p className="font-heading text-base text-karis-green-900">{g.name}</p>
                  {g.theme && (
                    <p className="font-body text-xs text-karis-stone-400">{g.theme}</p>
                  )}
                  <p className="font-body text-sm text-karis-stone-500">{g.description}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <NotificationList
            notifications={notifications.map((n) => ({
              id: n.id,
              type: n.type,
              title: n.title,
              body: n.body,
              link: n.link,
              readAt: n.readAt ? new Date(n.readAt) : null,
              createdAt: new Date(n.createdAt),
            }))}
          />
        )}
      </div>

      <RaiseIssueFab />
    </div>
  )
}
