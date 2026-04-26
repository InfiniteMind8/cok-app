import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  body: string
}

export function EmptyState({ icon: Icon, title, body }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-karis-stone-300 mb-4">
        <Icon size={40} strokeWidth={1.25} />
      </div>
      <h3 className="font-heading text-lg text-karis-green-900 mb-1">{title}</h3>
      <p className="font-body text-sm text-karis-stone-500 max-w-xs">{body}</p>
    </div>
  )
}
