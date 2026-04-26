import { Skeleton } from '@/components/ui/skeleton'

export default function ProfileLoading() {
  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5 pb-8">
      {/* Identity card */}
      <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-6">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      {/* QR card */}
      <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-6">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-48 w-48 rounded-xl" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* KYC card */}
      <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-5 space-y-3">
        <Skeleton className="h-4 w-32" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
