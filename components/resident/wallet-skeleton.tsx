import { Skeleton } from '@/components/ui/skeleton'

export function WalletSkeleton() {
  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
      {/* Hero card skeleton */}
      <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-6 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-0.5 w-20" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-24" />
        <div className="flex gap-3 mt-2">
          <Skeleton className="h-11 flex-1 rounded-lg" />
          <Skeleton className="h-11 flex-1 rounded-lg" />
        </div>
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-karis-stone-100 rounded-xl p-4 space-y-2">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-5 w-28" />
          </div>
        ))}
      </div>

      {/* Transaction list skeleton */}
      <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm px-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3.5 border-b border-karis-stone-100 last:border-0">
            <Skeleton className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <Skeleton className="h-3.5 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
