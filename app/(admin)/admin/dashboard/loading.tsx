import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Page header */}
      <Skeleton className="h-8 w-48" />

      {/* Stat cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white border border-karis-stone-100 rounded-xl p-4 space-y-2"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        ))}
      </div>

      {/* Two side-by-side tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {[1, 2].map((t) => (
          <div
            key={t}
            className="bg-white border border-karis-stone-100 rounded-xl p-5 space-y-3"
          >
            <Skeleton className="h-5 w-40" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between py-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
