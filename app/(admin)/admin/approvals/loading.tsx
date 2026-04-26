import { Skeleton } from '@/components/ui/skeleton'

export default function ApprovalsLoading() {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <Skeleton className="h-8 w-40" />

      {/* Tab row */}
      <div className="flex gap-4 border-b border-karis-stone-100 pb-px">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-karis-stone-100 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-karis-stone-100">
          <div className="flex gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-3 w-20" />
            ))}
          </div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="px-4 py-3.5 border-b border-karis-stone-100 last:border-0 flex gap-6 items-center"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
