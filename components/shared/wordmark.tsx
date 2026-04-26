import { cn } from '@/lib/utils'

interface WordmarkProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
}

export function Wordmark({ className, size = 'md' }: WordmarkProps) {
  return (
    <span
      className={cn(
        'font-display font-medium tracking-wide text-karis-green-900',
        sizeClasses[size],
        className,
      )}
    >
      City of Karis
    </span>
  )
}
