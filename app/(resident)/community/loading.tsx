import { Skeleton } from '@/components/ui/skeleton'

export default function CommunityLoading() {
  return (
    <div className="pb-8">
      {/* Tab bar skeleton */}
      <div className="sticky top-14 z-30 bg-karis-stone-50 border-b border-karis-stone-100">
        <div className="flex max-w-lg mx-auto px-4 py-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-5 space-y-3"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  )
}
