import { Skeleton } from '@/components/ui/skeleton'

export default function PropertyLoading() {
  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5 pb-8">
      {/* Photo carousel skeleton */}
      <Skeleton className="w-full aspect-video rounded-2xl" />

      {/* Property info card */}
      <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-5 space-y-3">
        <Skeleton className="h-3 w-16 rounded-full" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-64" />
      </div>

      {/* Progress card */}
      <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-5 space-y-4">
        <Skeleton className="h-4 w-36" />
        <div className="flex gap-8 justify-center">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-8 w-8 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-3 w-full" />
      </div>

      {/* Specs card */}
      <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-5 space-y-3">
        <Skeleton className="h-4 w-24" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
