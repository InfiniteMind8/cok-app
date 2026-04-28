import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="p-8 max-w-4xl space-y-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-6 w-40" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
