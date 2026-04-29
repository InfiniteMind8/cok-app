'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { TourStep } from '@/lib/tour/steps'
import { cn } from '@/lib/utils'

interface TourRect {
  top: number
  left: number
  width: number
  height: number
}

interface OnboardingTourProps {
  visible: boolean
  steps: TourStep[]
  currentIndex: number
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

const PADDING = 10
const TOOLTIP_WIDTH = 288
const TOOLTIP_GAP = 16

function getTooltipPosition(
  rect: TourRect,
  viewportW: number,
  viewportH: number,
): { top: number; left: number } {
  const spaceBelow = viewportH - (rect.top + rect.height + PADDING)
  const spaceAbove = rect.top - PADDING

  let top: number
  if (spaceBelow >= 160 || spaceBelow >= spaceAbove) {
    top = rect.top + rect.height + PADDING + TOOLTIP_GAP
  } else {
    top = rect.top - TOOLTIP_GAP - 160
  }

  let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2
  left = Math.max(16, Math.min(left, viewportW - TOOLTIP_WIDTH - 16))

  return { top: Math.max(8, top), left }
}

export function OnboardingTour({
  visible,
  steps,
  currentIndex,
  onNext,
  onBack,
  onSkip,
}: OnboardingTourProps) {
  const [targetRect, setTargetRect] = useState<TourRect | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  const step = steps[currentIndex]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === steps.length - 1

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (!visible || !step) return

    function measure() {
      const el = document.querySelector<HTMLElement>(`[data-tour-id="${step.target}"]`)
      if (!el) {
        setTargetRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }

    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, { passive: true })
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure)
    }
  }, [visible, step, currentIndex])

  useEffect(() => {
    if (visible) {
      dialogRef.current?.focus()
    }
  }, [visible, currentIndex])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onSkip() }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); onNext() }
      else if (e.key === 'ArrowLeft' && !isFirst) { e.preventDefault(); onBack() }
    },
    [onNext, onBack, onSkip, isFirst],
  )

  if (!visible || !step) return null

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768

  const spotlight: TourRect = targetRect
    ? {
        top: targetRect.top - PADDING,
        left: targetRect.left - PADDING,
        width: targetRect.width + PADDING * 2,
        height: targetRect.height + PADDING * 2,
      }
    : { top: vh / 2 - 40, left: vw / 2 - 60, width: 120, height: 80 }

  const tooltipPos = getTooltipPosition(spotlight, vw, vh)
  const transition = reducedMotion ? 'none' : 'all 0.25s ease'

  return (
    <>
      {/* Backdrop — splits into 4 quadrants around the spotlight */}
      <div aria-hidden="true" className="fixed inset-0 z-[9998] pointer-events-none">
        {/* Top */}
        <div
          className="absolute bg-karis-stone-900/60"
          style={{ top: 0, left: 0, right: 0, height: spotlight.top, transition }}
        />
        {/* Bottom */}
        <div
          className="absolute bg-karis-stone-900/60"
          style={{
            top: spotlight.top + spotlight.height,
            left: 0,
            right: 0,
            bottom: 0,
            transition,
          }}
        />
        {/* Left */}
        <div
          className="absolute bg-karis-stone-900/60"
          style={{
            top: spotlight.top,
            left: 0,
            width: spotlight.left,
            height: spotlight.height,
            transition,
          }}
        />
        {/* Right */}
        <div
          className="absolute bg-karis-stone-900/60"
          style={{
            top: spotlight.top,
            left: spotlight.left + spotlight.width,
            right: 0,
            height: spotlight.height,
            transition,
          }}
        />
      </div>

      {/* Spotlight border ring */}
      <div
        aria-hidden="true"
        className="fixed z-[9998] pointer-events-none rounded-lg ring-2 ring-karis-gold-500/80"
        style={{
          top: spotlight.top,
          left: spotlight.left,
          width: spotlight.width,
          height: spotlight.height,
          transition,
        }}
      />

      {/* Click-blocker overlay (intercepts clicks outside dialog) */}
      <div
        className="fixed inset-0 z-[9998]"
        aria-hidden="true"
        onClick={onSkip}
      />

      {/* Tour dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Tour step ${currentIndex + 1} of ${steps.length}: ${step.title}`}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="fixed z-[9999] w-72 rounded-xl bg-white shadow-xl ring-1 ring-karis-stone-200 focus:outline-none"
        style={{ top: tooltipPos.top, left: tooltipPos.left, transition }}
      >
        {/* Progress dots */}
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === currentIndex
                  ? 'w-4 bg-karis-green-900'
                  : 'w-1.5 bg-karis-stone-200',
              )}
            />
          ))}
          <span className="ml-auto font-body text-[10px] text-karis-stone-400 tabular-nums">
            {currentIndex + 1}/{steps.length}
          </span>
        </div>

        {/* Content */}
        <div className="px-4 py-2">
          <p className="font-heading text-sm text-karis-green-900 leading-snug">{step.title}</p>
          <p className="font-body text-xs text-karis-stone-600 mt-1 leading-relaxed">{step.body}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-4 pb-3 pt-2 gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="font-body text-xs text-karis-stone-400 hover:text-karis-stone-600 transition-colors py-1"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={onBack}
                className="font-body text-xs text-karis-stone-600 hover:text-karis-green-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-karis-stone-100 min-h-[32px]"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              className="font-body text-xs bg-karis-green-900 text-karis-stone-50 hover:bg-karis-green-800 px-4 py-1.5 rounded-lg transition-colors min-h-[32px]"
            >
              {isLast ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
