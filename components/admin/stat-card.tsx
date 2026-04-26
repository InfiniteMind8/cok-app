import Link from 'next/link'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  sub?: string
  icon: LucideIcon
  href?: string
  accent?: 'green' | 'gold' | 'red' | 'orange'
}

const accentMap = {
  green: 'border-l-karis-green-500',
  gold: 'border-l-karis-gold-500',
  red: 'border-l-status-red',
  orange: 'border-l-status-orange',
}

export function StatCard({ title, value, sub, icon: Icon, href, accent = 'green' }: StatCardProps) {
  const inner = (
    <div
      className={cn(
        'bg-white border border-karis-stone-100 rounded-xl p-5 border-l-4 shadow-sm',
        accentMap[accent],
        href && 'hover:border-karis-stone-300 transition-colors',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-body text-karis-stone-500 uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-2xl font-heading text-karis-green-900 tabular-nums leading-none">
            {value}
          </p>
          {sub && (
            <p className="text-xs font-body text-karis-stone-500 mt-1">{sub}</p>
          )}
        </div>
        <div className="text-karis-stone-300 mt-0.5 shrink-0">
          <Icon size={20} />
        </div>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{inner}</Link>
  }
  return inner
}
