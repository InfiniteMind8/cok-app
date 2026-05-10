'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const PERSONAS = [
  { label: 'Master Admin', href: '/demo/master-admin' },
  { label: 'Admin', href: '/demo/admin' },
  { label: 'Resident', href: '/demo/resident' },
  { label: 'Vendor', href: '/demo/vendor' },
  { label: 'Visitor', href: '/demo/visitor' },
] as const

export function PersonaSwitcher() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Persona tour switcher"
      className="w-full bg-white border-b border-karis-stone-100"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-1 overflow-x-auto">
        <Link
          href="/demo"
          className={cn(
            'shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs transition-colors',
            pathname === '/demo'
              ? 'bg-karis-green-900 text-white'
              : 'text-karis-stone-700 hover:text-karis-green-900 hover:bg-karis-stone-50',
          )}
        >
          <Home size={12} aria-hidden="true" />
          Tour home
        </Link>
        <span className="text-karis-stone-300 font-body text-xs px-1" aria-hidden="true">
          /
        </span>
        {PERSONAS.map((persona) => {
          const isActive = pathname.startsWith(persona.href)
          return (
            <Link
              key={persona.href}
              href={persona.href}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-lg font-body text-xs transition-colors',
                isActive
                  ? 'bg-karis-green-900 text-white'
                  : 'text-karis-stone-700 hover:text-karis-green-900 hover:bg-karis-stone-50',
              )}
            >
              {persona.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
