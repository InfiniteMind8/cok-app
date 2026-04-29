import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Shield, Bell, Info, ChevronRight, Lock } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { Separator } from '@/components/ui/separator'
import { MemberQrCard } from './_components/member-qr-card'
import { ProfilePhotoUpload } from './_components/profile-photo-upload'
import { ResidentSignOutButton } from './_components/sign-out-button'
import { DisplayCurrencySelector } from './_components/display-currency-selector'
import { Wordmark } from '@/components/shared/wordmark'

export const dynamic = 'force-dynamic'

const ROLE_LABELS: Record<string, string> = {
  RESIDENT: 'Resident',
  VISITOR: 'Visitor',
  MASTER_ADMIN: 'Master Admin',
  ADMIN: 'Admin',
  VENDOR: 'Vendor',
}

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const [fullUser, clerkUser] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        fullName: true,
        memberId: true,
        role: true,
        status: true,
        profilePhotoUrl: true,
        introduction: true,
        kyc: true,
        createdAt: true,
        displayCurrency: true,
      },
    }),
    user.clerkId
      ? clerkClient().then((c) => c.users.getUser(user.clerkId!))
      : Promise.resolve(null),
  ])

  if (!fullUser) redirect('/sign-in')
  const mfaEnabled = clerkUser?.twoFactorEnabled ?? false

  const kyc = fullUser.kyc as Record<string, string> | null

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5 pb-8">
      {/* Photo + identity */}
      <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-6">
        <ProfilePhotoUpload
          currentUrl={fullUser.profilePhotoUrl}
          fullName={fullUser.fullName}
        />

        <div className="text-center mt-4">
          <h1 className="font-heading text-2xl text-karis-green-900">{fullUser.fullName}</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="font-body text-xs text-karis-stone-500 tabular-nums">{fullUser.memberId}</p>
            <span className="text-karis-stone-300">·</span>
            <span className="font-body text-[10px] bg-karis-green-900/10 text-karis-green-900 px-2 py-0.5 rounded-full">
              {ROLE_LABELS[fullUser.role] ?? fullUser.role}
            </span>
          </div>
          <p className="font-body text-xs text-karis-stone-400 mt-1">
            Member since {format(new Date(fullUser.createdAt), 'MMMM yyyy')}
          </p>
        </div>
      </div>

      {/* QR card */}
      <MemberQrCard memberId={fullUser.memberId} />

      {/* KYC summary */}
      <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-karis-green-700" />
          <h2 className="font-heading text-base text-karis-green-900">KYC information</h2>
        </div>

        {kyc && Object.keys(kyc).length > 0 ? (
          <dl className="space-y-2.5">
            {Object.entries(kyc).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <dt className="font-body text-xs text-karis-stone-500 capitalize">
                  {key.replace(/_/g, ' ')}
                </dt>
                <dd className="font-body text-sm text-karis-stone-900">{String(value)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="flex items-start gap-3 py-2">
            <Info size={15} className="text-karis-stone-400 shrink-0 mt-0.5" />
            <p className="font-body text-sm text-karis-stone-500">
              No KYC information on file. Contact your Admin to submit your documents.
            </p>
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={16} className="text-karis-green-700" />
          <h2 className="font-heading text-base text-karis-green-900">Settings</h2>
        </div>

        <div className="space-y-3">
          <DisplayCurrencySelector
            current={(fullUser.displayCurrency ?? 'KCRD') as 'KCRD' | 'USD' | 'GYD'}
          />

          <Separator className="bg-karis-stone-100" />

          <div className="flex items-center justify-between py-1">
            <p className="font-body text-sm text-karis-stone-700">Notification preferences</p>
            <span className="font-body text-xs text-karis-stone-400">More options are on the way</span>
          </div>

          <Separator className="bg-karis-stone-100" />

          <Link
            href="/account/mfa-enroll"
            className="flex items-center justify-between py-2 min-h-[44px]"
          >
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-karis-green-700" />
              <p className="font-body text-sm text-karis-stone-700">Two-factor authentication</p>
            </div>
            {mfaEnabled ? (
              <span className="font-body text-[10px] bg-karis-green-900/10 text-karis-green-900 px-2 py-0.5 rounded-full">
                Enabled
              </span>
            ) : (
              <ChevronRight size={14} className="text-karis-stone-400" />
            )}
          </Link>

          <Separator className="bg-karis-stone-100" />

          <Link
            href="/community/issues"
            className="flex items-center justify-between py-2 min-h-[44px]"
          >
            <p className="font-body text-sm text-karis-stone-700">My issues</p>
            <ChevronRight size={14} className="text-karis-stone-400" />
          </Link>

          <Separator className="bg-karis-stone-100" />

          <ResidentSignOutButton />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 space-y-1">
        <Wordmark size="sm" className="justify-center" />
        <p className="font-body text-[10px] text-karis-stone-400">
          © 2026 City of Karis · v0.1.0
        </p>
      </div>
    </div>
  )
}
