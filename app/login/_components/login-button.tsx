'use client'

import { useClerk } from '@clerk/nextjs'

interface LoginButtonProps {
  firstName: string
  token: string
}

export function LoginButton({ firstName, token }: LoginButtonProps) {
  const { signOut } = useClerk()

  async function handleClick() {
    await signOut()
    window.location.href = `/sign-in?__clerk_ticket=${token}`
  }

  return (
    <button
      onClick={handleClick}
      className="w-full py-3 text-sm font-body font-medium text-karis-stone-900 bg-karis-gold-500 hover:bg-karis-gold-300 rounded-lg transition-colors duration-150 cursor-pointer"
    >
      Enter as {firstName}
    </button>
  )
}
