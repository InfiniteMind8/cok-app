'use client'

import dynamic from 'next/dynamic'

const AccessButton = dynamic(
  () => import('./access-button').then((m) => m.AccessButton),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full py-3 h-10 rounded-lg animate-pulse"
        style={{ background: 'oklch(0.25 0.01 70)' }}
      />
    ),
  },
)

export function AccessButtonWrapper(props: { userId: string; firstName: string }) {
  return <AccessButton {...props} />
}
