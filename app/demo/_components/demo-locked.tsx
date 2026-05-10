'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cloneElement, isValidElement, type ReactElement, type ReactNode, type FormEvent, type MouseEvent } from 'react'

const TOAST_MESSAGE = 'This is a demo preview — sign in to use this feature.'

function showDemoToast(router: ReturnType<typeof useRouter>) {
  toast.info(TOAST_MESSAGE, {
    action: {
      label: 'Sign in',
      onClick: () => router.push('/sign-in'),
    },
  })
}

interface DemoLockedProps {
  children: ReactElement<{
    onClick?: (e: MouseEvent<HTMLElement>) => void
    'aria-disabled'?: boolean
    'data-demo-locked'?: string
  }>
}

export function DemoLocked({ children }: DemoLockedProps) {
  const router = useRouter()

  if (!isValidElement(children)) return children as ReactNode

  return cloneElement(children, {
    onClick: (e: MouseEvent<HTMLElement>) => {
      e.preventDefault()
      e.stopPropagation()
      showDemoToast(router)
    },
    'aria-disabled': true,
    'data-demo-locked': 'true',
  })
}

interface DemoLockedFormShellProps {
  children: ReactNode
  className?: string
  onIntercept?: () => void
}

export function DemoLockedFormShell({ children, className, onIntercept }: DemoLockedFormShellProps) {
  const router = useRouter()

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation()
    showDemoToast(router)
    onIntercept?.()
  }

  return (
    <form onSubmit={handleSubmit} className={className} data-demo-locked-form="true">
      {children}
    </form>
  )
}

export function useDemoToast() {
  const router = useRouter()
  return () => showDemoToast(router)
}
