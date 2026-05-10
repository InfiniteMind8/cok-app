'use client'

import { useClerk } from '@clerk/nextjs'

interface DevSignInButtonProps {
  firstName: string
  token: string
}

export function DevSignInButton({ firstName, token }: DevSignInButtonProps) {
  const { signOut } = useClerk()

  async function handleClick() {
    await signOut()
    window.location.href = `/sign-in?__clerk_ticket=${token}`
  }

  return (
    <button
      onClick={handleClick}
      className="block w-full text-center bg-karis-green-900 text-white font-body text-sm py-2.5 rounded-lg hover:bg-karis-green-800 transition-colors duration-150 cursor-pointer"
    >
      Sign in as {firstName}
    </button>
  )
}
