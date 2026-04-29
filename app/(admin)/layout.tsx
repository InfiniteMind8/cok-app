import { requireRole } from '@/lib/auth'
import { requireMfaEnrolled } from '@/lib/mfa'
import { AdminSidebar } from '@/components/shared/admin-sidebar'
import { ReconciliationAlertBanner } from '@/components/admin/reconciliation-alert-banner'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole('MASTER_ADMIN')
  await requireMfaEnrolled(user)

  return (
    <div className="flex min-h-screen">
      <AdminSidebar userName={user.fullName} userPhoto={user.profilePhotoUrl} />
      <div className="flex-1 flex flex-col bg-karis-stone-50 overflow-y-auto">
        <ReconciliationAlertBanner />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
