import { Skeleton } from '@/components/ui/skeleton'

export default function TreasuryLoading() {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <Skeleton className="h-8 w-36" />

      {/* Hero treasury card */}
      <div className="bg-white border border-karis-stone-100 rounded-xl p-6 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-3 mt-2">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-40 rounded-lg" />
        </div>
      </div>

      {/* Deposits table */}
      <div className="bg-white border border-karis-stone-100 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-karis-stone-100">
          <Skeleton className="h-4 w-32" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="px-4 py-3.5 border-b border-karis-stone-100 last:border-0 flex justify-between items-center"
          >
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-2.5 w-24" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
