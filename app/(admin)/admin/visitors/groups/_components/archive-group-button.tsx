'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Archive, ArchiveRestore } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { adminVisitorGroupsApi, getBrowserApi } from '@/lib/api'

export function ArchiveGroupButton({ id, archived }: { id: string; archived: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      try {
        const api = getBrowserApi()
        if (archived) {
          await adminVisitorGroupsApi.unarchive(api, id)
          toast.success('Group restored')
        } else {
          await adminVisitorGroupsApi.archive(api, id)
          toast.success('Group archived')
        }
        router.refresh()
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
