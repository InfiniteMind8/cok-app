'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { KAmount } from '@/components/admin/k-amount'
import { Prisma } from '@prisma/client'
import { format } from 'date-fns'

interface AccountDetailDrawerProps {
  open: boolean
  onClose: () => void
  user: {
    fullName: string
    email: string
    memberId: string
    role: string
    status: string
    profilePhotoUrl: string | null
    createdAt: Date
    walletBalance: Prisma.Decimal | null
    kyc: Record<string, string> | null
  } | null
}

const roleColors: Record<string, string> = {
  MASTER_ADMIN: 'bg-karis-green-900 text-white',
  ADMIN: 'bg-karis-green-700 text-white',
  RESIDENT: 'bg-karis-green-100 text-karis-green-900',
  VENDOR: 'bg-karis-gold-300/30 text-karis-gold-700',
  VISITOR: 'bg-karis-stone-100 text-karis-stone-900',
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-status-green/10 text-status-green',
  SUSPENDED: 'bg-status-red/10 text-status-red',
  PENDING_KYC: 'bg-status-yellow/20 text-karis-stone-700',
}

export function AccountDetailDrawer({ open, onClose, user }: AccountDetailDrawerProps) {
  if (!user) return null

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const kyc = user.kyc as Record<string, string> | null

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-heading text-karis-green-900">Account details</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Identity */}
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 shrink-0">
              {user.profilePhotoUrl && (
                <AvatarImage src={user.profilePhotoUrl} alt={user.fullName} />
              )}
              <AvatarFallback className="bg-karis-green-900 text-white text-lg font-body">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-heading text-lg text-karis-green-900">{user.fullName}</p>
              <p className="font-body text-sm text-karis-stone-500">{user.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className={`text-xs font-body ${roleColors[user.role] ?? ''}`}>
                  {user.role.replace('_', ' ')}
                </Badge>
                <Badge className={`text-xs font-body ${statusColors[user.status] ?? ''}`} variant="outline">
                  {user.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>

          {/* Key data */}
          <div className="space-y-1">
            <Row label="Member ID" value={user.memberId} mono />
            <Row label="Joined" value={format(user.createdAt, 'dd MMM yyyy')} />
            {user.walletBalance !== null && (
              <div className="flex justify-between py-2.5 border-b border-karis-stone-100">
                <span className="text-xs font-body text-karis-stone-500">Wallet balance</span>
                <KAmount amount={user.walletBalance} className="text-sm" />
              </div>
            )}
          </div>

          {/* KYC */}
          {kyc && Object.keys(kyc).some((k) => kyc[k]) && (
            <div>
              <p className="text-xs font-body text-karis-stone-500 uppercase tracking-wider mb-2">
                KYC
              </p>
              <div className="space-y-1">
                {kyc.dob && <Row label="Date of birth" value={kyc.dob} />}
                {kyc.govId && <Row label="Government ID" value={kyc.govId} mono />}
                {kyc.country && <Row label="Country" value={kyc.country} />}
                {kyc.phone && <Row label="Phone" value={kyc.phone} />}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex justify-between py-2.5 border-b border-karis-stone-100">
      <span className="text-xs font-body text-karis-stone-500">{label}</span>
      <span className={`text-sm text-karis-stone-900 ${mono ? 'tabular-nums font-mono text-xs' : 'font-body'}`}>
        {value}
      </span>
    </div>
  )
}
