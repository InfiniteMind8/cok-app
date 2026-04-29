'use client'

import { Map } from 'lucide-react'
import { useTour } from '@/components/shared/tour-provider'

interface TourTriggerButtonProps {
  className?: string
}

export function TourTriggerButton({ className }: TourTriggerButtonProps) {
  const tour = useTour()

  if (!tour) return null

  return (
    <button
      type="button"
      onClick={tour.startTour}
      className={className ?? 'flex items-center gap-2 w-full text-xs text-karis-stone-500 hover:text-karis-stone-300 font-body py-1.5 text-left transition-colors'}
    >
      <Map size={13} />
      Show me around
    </button>
  )
}
