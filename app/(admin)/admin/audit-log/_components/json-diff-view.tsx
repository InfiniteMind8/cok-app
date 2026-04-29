'use client'

interface JsonDiffViewProps {
  before?: unknown
  after?: unknown
}

export function JsonDiffView({ before, after }: JsonDiffViewProps) {
  const hasContent = before !== null && before !== undefined || after !== null && after !== undefined

  if (!hasContent) {
    return (
      <p className="text-xs font-body text-karis-stone-400 italic py-2">
        No before/after data recorded for this entry.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 mt-2">
      <div>
        <p className="text-[10px] font-body font-semibold text-red-600 uppercase tracking-wider mb-1">
          Before
        </p>
        <pre className="text-xs bg-red-50 border border-red-100 rounded p-3 overflow-auto max-h-48 text-red-800 font-mono whitespace-pre-wrap break-all">
          {before !== null && before !== undefined
            ? JSON.stringify(before, null, 2)
            : <span className="italic text-karis-stone-400">—</span>}
        </pre>
      </div>
      <div>
        <p className="text-[10px] font-body font-semibold text-emerald-700 uppercase tracking-wider mb-1">
          After
        </p>
        <pre className="text-xs bg-emerald-50 border border-emerald-100 rounded p-3 overflow-auto max-h-48 text-emerald-900 font-mono whitespace-pre-wrap break-all">
          {after !== null && after !== undefined
            ? JSON.stringify(after, null, 2)
            : <span className="italic text-karis-stone-400">—</span>}
        </pre>
      </div>
    </div>
  )
}
