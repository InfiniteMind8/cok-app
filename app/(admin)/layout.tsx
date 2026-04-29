import { requireRole } from '@/lib/auth'
import { requireMfaEnrolled } from '@/lib/mfa'
import { AdminSidebar } from '@/components/shared/admin-sidebar'

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
      <main className="flex-1 bg-karis-stone-50 overflow-y-auto">{children}</main>
    </div>
  )
}
