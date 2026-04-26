'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PropertyLightbox } from './property-lightbox'

interface PropertyCarouselProps {
  photos: string[]
  address?: string | null
}

export function PropertyCarousel({ photos, address }: PropertyCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const index = Math.round(el.scrollLeft / el.clientWidth)
    setActiveIndex(index)
  }, [])

  const openLightbox = (i: number) => {
    setLightboxIndex(i)
    setLightboxOpen(true)
  }

  if (photos.length === 0) {
    return (
      <div className="w-full aspect-video bg-karis-stone-100 rounded-2xl flex items-center justify-center">
        <Building2 size={48} strokeWidth={1.25} className="text-karis-stone-400" />
      </div>
    )
  }

  return (
    <>
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory rounded-2xl gap-0"
          style={{ scrollbarWidth: 'none' }}
          onScroll={handleScroll}
        >
          {photos.map((src, i) => (
            <div
              key={i}
              className="shrink-0 w-full snap-start cursor-pointer"
              onClick={() => openLightbox(i)}
            >
              <div className="relative w-full aspect-video">
                <Image
                  src={src}
                  alt={address ?? `Property photo ${i + 1}`}
                  fill
                  className="object-cover rounded-2xl"
                  sizes="(max-width: 512px) 100vw, 512px"
                  priority={i === 0}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </div>
            </div>
          ))}
        </div>

        {photos.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {photos.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-150 ease-out',
                  i === activeIndex ? 'w-4 bg-karis-gold-500' : 'w-1.5 bg-karis-stone-300',
                )}
              />
            ))}
          </div>
        )}
      </div>

      <PropertyLightbox
        photos={photos}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        address={address}
      />
    </>
  )
}
