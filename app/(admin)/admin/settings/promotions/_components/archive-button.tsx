'use client'
import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { archivePromotionAction } from '../_actions/promotions'

export function ArchiveButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  if (done) return <span className="font-body text-xs text-karis-stone-400">Archived</span>

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await archivePromotionAction(id)
          setDone(true)
        })
      }
      className="h-7 font-body text-xs text-status-red border-status-red/30 hover:bg-status-red/5 hover:text-status-red"
    >
      {pending ? <Loader2 size={12} className="animate-spin" /> : 'Archive'}
    </Button>
  )
}
