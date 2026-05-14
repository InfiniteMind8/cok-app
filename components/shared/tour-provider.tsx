'use client'

import { createContext, useCallback, useContext, useState, useTransition } from 'react'
import type { TourStep } from '@/lib/tour/steps'
import { OnboardingTour } from '@/components/shared/onboarding-tour'
import { getBrowserApi } from '@/lib/api/browser'
import { meApi } from '@/lib/api/me'

interface TourContextValue {
  startTour: () => void
}

const TourContext = createContext<TourContextValue | null>(null)

export function useTour(): TourContextValue | null {
  return useContext(TourContext)
}

interface TourProviderProps {
  children: React.ReactNode
  initialShow: boolean
  steps: TourStep[]
}

export function TourProvider({ children, initialShow, steps }: TourProviderProps) {
  const [visible, setVisible] = useState(initialShow)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [, startTransition] = useTransition()

  const startTour = useCallback(() => {
    setCurrentIndex(0)
    setVisible(true)
  }, [])

  const handleNext = useCallback(() => {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      setVisible(false)
      startTransition(() => { meApi.completeTour(getBrowserApi()).catch(() => {}) })
    }
  }, [currentIndex, steps.length])

  const handleBack = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1)
  }, [currentIndex])

  const handleSkip = useCallback(() => {
    setVisible(false)
    startTransition(() => { meApi.dismissTour(getBrowserApi()).catch(() => {}) })
  }, [])

  return (
    <TourContext.Provider value={{ startTour }}>
      {children}
      {steps.length > 0 && (
        <OnboardingTour
          visible={visible}
          steps={steps}
          currentIndex={currentIndex}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={handleSkip}
        />
      )}
    </TourContext.Provider>
  )
}
