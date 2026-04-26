'use client'

import { SignOutButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function ResidentSignOutButton() {
  return (
    <SignOutButton>
      <Button
        variant="outline"
        className="w-full font-body text-sm gap-2 min-h-[44px] border-karis-stone-300 text-karis-stone-700 hover:bg-karis-stone-50"
      >
        <LogOut size={16} />
        Sign out
      </Button>
    </SignOutButton>
  )
}
