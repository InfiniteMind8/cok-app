import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUpdatesWithAcknowledgements, getVotesWithUserSubmissions, getNotifications } from '@/lib/queries/community'
import { UpdatesFeed } from './_components/updates-feed'
import { VotingList } from './_components/vote-card'
import { NotificationList } from './_components/notification-list'
import { RaiseIssueFab } from './_components/raise-issue-fab'

export const dynamic = 'force-dynamic'

const TABS = ['updates', 'voting', 'notifications'] as const
type Tab = (typeof TABS)[number]

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const sp = await searchParams
  const activeTab: Tab = (TABS as readonly string[]).includes(sp.tab ?? '')
    ? (sp.tab as Tab)
    : 'updates'

  const [{ updates }, votes, notifications] = await Promise.all([
    getUpdatesWithAcknowledgements(user.id),
    getVotesWithUserSubmissions(user.id),
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

  return (
    <div className="pb-8">
      {/* Sticky tab row */}
      <div className="sticky top-14 z-30 bg-karis-stone-50 border-b border-karis-stone-100">
        <nav className="flex max-w-lg mx-auto">
          {TABS.map((tab) => {
            const isActive = tab === activeTab
            const label =
              tab === 'updates' ? 'Updates' : tab === 'voting' ? 'Voting' : `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`
            return (
              <a
                key={tab}
                href={`/community?tab=${tab}`}
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

        {activeTab === 'voting' && (
          <VotingList
            votes={openVotes.map(toVoteProps)}
            pastVotes={closedVotes.map(toVoteProps)}
          />
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
