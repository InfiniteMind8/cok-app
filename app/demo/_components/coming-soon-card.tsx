import { Construction } from 'lucide-react'

interface ComingSoonCardProps {
  persona: string
  surfaces: string[]
}

export function ComingSoonCard({ persona, surfaces }: ComingSoonCardProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-karis-gold-100 mb-5">
          <Construction size={20} className="text-karis-gold-700" aria-hidden="true" />
        </div>
        <h2 className="font-heading text-2xl text-karis-green-900 mb-2">
          {persona} tour coming next
        </h2>
        <p className="font-body text-sm text-karis-stone-500 leading-relaxed max-w-md mx-auto">
          Phase 1 of the demo showcase ships the Resident tour. The {persona} tour will be added in a follow-up phase, mirroring the same authenticated surfaces with hardcoded fixtures.
        </p>

        <div className="mt-7 text-left bg-karis-stone-50 border border-karis-stone-100 rounded-xl p-5">
          <p className="font-body text-[10px] uppercase tracking-widest text-karis-stone-500 mb-3">
            Surfaces planned
          </p>
          <ul className="space-y-1.5">
            {surfaces.map((surface) => (
              <li
                key={surface}
                className="font-body text-sm text-karis-stone-700 flex items-baseline gap-2"
              >
                <span className="text-karis-gold-700" aria-hidden="true">·</span>
                {surface}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
