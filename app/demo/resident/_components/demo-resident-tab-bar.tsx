'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wallet, Home, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Wallet', href: '/demo/resident/wallet', icon: Wallet },
  { label: 'Property', href: '/demo/resident/property', icon: Home },
  { label: 'Community', href: '/demo/resident/community', icon: Users },
  { label: 'Profile', href: '/demo/resident/profile', icon: User },
]

export function DemoResidentTabBar() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Demo resident navigation"
      className="fixed bottom-0 left-0 right-0 h-16 bg-karis-green-900 flex items-center z-50 safe-area-pb"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = pathname.startsWith(tab.href)
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
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
            <span className="text-[10px] font-body font-medium tracking-wide">{tab.label}</span>
            {isActive && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-karis-gold-500 rounded-full" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
