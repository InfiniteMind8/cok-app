'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Archive, ArchiveRestore } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { archiveGroupAction, unarchiveGroupAction } from '@/app/(admin)/_actions/visitor-groups'

export function ArchiveGroupButton({ id, archived }: { id: string; archived: boolean }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      try {
        if (archived) {
          await unarchiveGroupAction(id)
          toast.success('Group restored')
        } else {
          await archiveGroupAction(id)
          toast.success('Group archived')
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="font-body text-xs gap-1.5 h-8"
      onClick={handleClick}
      disabled={isPending}
    >
      {archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
      {archived ? 'Restore' : 'Archive'}
    </Button>
  )
}
