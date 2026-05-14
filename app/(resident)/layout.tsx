import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { meApi, residentCommunityApi } from '@/lib/api'
import { getServerApi } from '@/lib/api/server'
import { BrandLogo } from '@/components/shared/brand-logo'
import { Wordmark } from '@/components/shared/wordmark'
import { ResidentTabBar } from '@/components/shared/resident-tab-bar'
import { EmergencyBroadcastBanner } from '@/components/shared/emergency-broadcast-banner'
import { TourProvider } from '@/components/shared/tour-provider'
import { getTourSteps } from '@/lib/tour/steps'

export default async function ResidentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  if (user.role === 'MASTER_ADMIN') {
    redirect('/dashboard')
  }

  if (user.role === 'ADMIN' || user.role === 'VENDOR') {
    redirect('/')
  }

  const api = getServerApi()
  const [{ count: unreadCount }, { shouldShow }] = await Promise.all([
    residentCommunityApi.getUnreadNotificationCount(api),
    meApi.tourStatus(api),
  ])

  return (
    <TourProvider initialShow={shouldShow} steps={getTourSteps(user.role)}>
      <div className="flex flex-col min-h-screen bg-karis-stone-50">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-karis-stone-50 border-b border-karis-stone-100 px-4 h-14 flex items-center gap-3">
          <BrandLogo size={40} priority />
          <Wordmark size="sm" className="hidden sm:block" />
        </header>

        {/* Emergency broadcast banner — z-50 sits above sticky header */}
        <EmergencyBroadcastBanner userId={user.id} />

        {/* Main content — scrollable, padded for tab bar */}
        <main className="flex-1 overflow-y-auto pb-16">{children}</main>

        {/* Bottom tab bar */}
        <ResidentTabBar role={user.role} unreadCount={unreadCount} />
      </div>
    </TourProvider>
  )
}
