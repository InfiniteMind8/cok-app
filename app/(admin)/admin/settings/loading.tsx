import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <Skeleton className="h-8 w-28" />

      {/* Fee schedule card */}
      <div className="bg-white border border-karis-stone-100 rounded-xl p-5 space-y-3">
        <Skeleton className="h-5 w-40" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex justify-between py-1">
            <Skeleton className="h-3 w-32" />
            <div className="flex gap-8">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>

      {/* System wallets card */}
      <div className="bg-white border border-karis-stone-100 rounded-xl p-5 space-y-3">
        <Skeleton className="h-5 w-36" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between py-1">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
