'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wallet, Home, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Role } from '@prisma/client'

interface TabBarProps {
  role: Role
  unreadCount?: number
}

const tabs = [
  { label: 'Wallet', href: '/wallet', icon: Wallet },
  { label: 'Property', href: '/property', icon: Home, residentOnly: true },
  { label: 'Community', href: '/community', icon: Users, showBadge: true },
  { label: 'Profile', href: '/profile', icon: User },
]

export function ResidentTabBar({ role, unreadCount = 0 }: TabBarProps) {
  const pathname = usePathname()

  const visibleTabs = tabs.filter(
    (tab) => !tab.residentOnly || role === 'RESIDENT',
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-karis-green-900 flex items-center z-50 safe-area-pb">
      {visibleTabs.map((tab) => {
        const Icon = tab.icon
        const isActive = pathname.startsWith(tab.href)
        const hasBadge = tab.showBadge && unreadCount > 0 && !isActive
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full gap-1 min-h-[44px] transition-colors relative',
              isActive
                ? 'text-karis-gold-500'
                : 'text-karis-green-100 hover:text-karis-stone-50',
            )}
          >
            <div className="relative">
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
              {hasBadge && (
                <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-karis-gold-500 border border-karis-green-900" />
              )}
            </div>
            <span className="text-[10px] font-body font-medium tracking-wide">
              {tab.label}
            </span>
            {isActive && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-karis-gold-500 rounded-full" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
