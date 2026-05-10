import { requireRole } from '@/lib/auth'
import { requireMfaEnrolled } from '@/lib/mfa'
import { AdminSidebar } from '@/components/shared/admin-sidebar'
import { ReconciliationAlertBanner } from '@/components/admin/reconciliation-alert-banner'
import { EmergencyBroadcastBanner } from '@/components/shared/emergency-broadcast-banner'
import { TourProvider } from '@/components/shared/tour-provider'
import { meApi, getServerApi } from '@/lib/api'
import { getTourSteps } from '@/lib/tour/steps'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole('MASTER_ADMIN')
  await requireMfaEnrolled(user)
  const { shouldShow } = await meApi.tourStatus(getServerApi())

  return (
    <TourProvider initialShow={shouldShow} steps={getTourSteps(user.role)}>
      <div className="flex min-h-screen">
        <AdminSidebar userName={user.fullName} userPhoto={user.profilePhotoUrl} />
        <div className="flex-1 flex flex-col bg-karis-stone-50 overflow-y-auto">
          <EmergencyBroadcastBanner userId={user.id} />
          <ReconciliationAlertBanner />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </TourProvider>
  )
}
