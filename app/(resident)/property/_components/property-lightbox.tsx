'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PropertyLightboxProps {
  photos: string[]
  initialIndex: number
  open: boolean
  onClose: () => void
  address?: string | null
}

export function PropertyLightbox({
  photos,
  initialIndex,
  open,
  onClose,
  address,
}: PropertyLightboxProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && scrollRef.current) {
      const el = scrollRef.current
      // Scroll to initialIndex without animation
      el.scrollLeft = initialIndex * el.clientWidth
    }
  }, [open, initialIndex])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Property photo viewer"
    >
      <div className="flex items-center justify-end px-4 pt-safe pt-4 pb-2">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-150 flex items-center justify-center"
          aria-label="Close"
        >
          <X size={20} className="text-white" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {photos.map((src, i) => (
          <div key={i} className="shrink-0 w-full h-full snap-start flex items-center justify-center px-4">
            <div className="relative w-full max-h-full" style={{ aspectRatio: '16/9' }}>
              <Image
                src={src}
                alt={address ?? `Property photo ${i + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority={i === initialIndex}
              />
            </div>
          </div>
        ))}
      </div>

      {photos.length > 1 && (
        <div className="flex justify-center gap-2 py-4">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollTo({ left: i * scrollRef.current.clientWidth, behavior: 'smooth' })
                }
              }}
              className={cn(
                'h-1.5 rounded-full transition-all duration-150',
                i === initialIndex ? 'w-4 bg-karis-gold-500' : 'w-1.5 bg-white/30',
              )}
              aria-label={`Photo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
