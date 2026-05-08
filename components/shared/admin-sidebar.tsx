'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CheckSquare,
  Vault,
  Users,
  Building2,
  MessagesSquare,
  Settings,
  Mail,
  ScrollText,
} from 'lucide-react'
import { SignOutButton } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { BrandLogo } from '@/components/shared/brand-logo'
import { Wordmark } from '@/components/shared/wordmark'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TourTriggerButton } from '@/components/shared/tour-trigger-button'

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, tourId: 'tour-dashboard' },
  { label: 'Approvals', href: '/admin/approvals', icon: CheckSquare, tourId: 'tour-approvals' },
  { label: 'Treasury', href: '/admin/treasury', icon: Vault, tourId: 'tour-treasury' },
  { label: 'Accounts', href: '/admin/accounts', icon: Users, tourId: 'tour-accounts' },
  { label: 'Properties', href: '/admin/properties', icon: Building2, tourId: undefined },
  { label: 'Community', href: '/admin/community', icon: MessagesSquare, tourId: 'tour-community' },
  { label: 'Audit Log', href: '/admin/audit-log', icon: ScrollText, tourId: 'tour-audit-log' },
  { label: 'Email Log', href: '/admin/email-log', icon: Mail, tourId: undefined },
  { label: 'Settings', href: '/admin/settings', icon: Settings, tourId: 'tour-settings' },
]

interface AdminSidebarProps {
  userName: string
  userPhoto?: string | null
}

export function AdminSidebar({ userName, userPhoto }: AdminSidebarProps) {
  const pathname = usePathname()

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <aside aria-label="Main navigation" className="w-64 flex-none bg-karis-stone-900 flex flex-col h-full min-h-screen">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-karis-stone-900/50">
        <BrandLogo size={40} />
        <div className="flex flex-col">
          <Wordmark size="sm" className="text-karis-stone-50" />
          <span className="text-[10px] text-karis-gold-500 font-body tracking-wider uppercase">
            Master Admin
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              {...(item.tourId ? { 'data-tour-id': item.tourId } : {})}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors min-h-[44px]',
                isActive
                  ? 'bg-karis-green-900 text-karis-stone-50'
                  : 'text-karis-stone-300 hover:bg-karis-stone-900/70 hover:text-karis-stone-50',
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div data-tour-id="tour-account-menu" className="p-4 border-t border-karis-stone-900/50">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            {userPhoto && <AvatarImage src={userPhoto} alt={userName} />}
            <AvatarFallback className="bg-karis-green-900 text-karis-stone-50 text-xs font-body">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-karis-stone-50 font-body truncate">{userName}</p>
            <p className="text-xs text-karis-stone-500 font-body">Master Admin</p>
          </div>
        </div>
        <TourTriggerButton />
        <SignOutButton>
          <button type="button" className="w-full text-xs text-karis-stone-500 hover:text-karis-stone-300 font-body py-1.5 text-left transition-colors">
            Sign out
          </button>
        </SignOutButton>
      </div>
    </aside>
  )
}
