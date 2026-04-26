import Image from 'next/image'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  size?: number
  className?: string
  priority?: boolean
}

export function BrandLogo({ size = 48, className, priority = false }: BrandLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="City of Karis"
      width={size}
      height={size}
      priority={priority}
      className={cn('object-contain', className)}
    />
  )
}
