interface SpecListProps {
  specs: Record<string, string> | null | undefined
}

export function SpecList({ specs }: SpecListProps) {
  if (!specs || Object.keys(specs).length === 0) return null

  const entries = Object.entries(specs)

  return (
    <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-5">
      <h3 className="font-heading text-base text-karis-green-900 mb-3">Specifications</h3>
      <div className="divide-y divide-karis-stone-100">
        {entries.map(([key, val]) => (
          <div key={key} className="flex items-center justify-between min-h-[40px] py-1">
            <span className="font-body text-sm text-karis-stone-500">{key}</span>
            <span className="font-body text-sm text-karis-stone-900 text-right">{val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
