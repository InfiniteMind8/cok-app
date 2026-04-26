import Link from 'next/link'
import { BrandLogo } from '@/components/shared/brand-logo'
import { Wordmark } from '@/components/shared/wordmark'

export const metadata = {
  title: 'Founders — City of Karis',
  description:
    'Meet the founding members who chose to build something extraordinary in Guyana.',
}

interface Founder {
  initials: string
  name: string
  location: string
  role: string
  intro: string
}

const FOUNDERS: Founder[] = [
  {
    initials: 'KM',
    name: 'Karis Munroe',
    location: 'Toronto, Canada',
    role: 'Visionary & Master Admin',
    intro:
      "Karis spent fifteen years in Toronto's urban planning sector before returning to Guyana with a singular question: what would a community look like if you built it right from the start? City of Karis is her answer.",
  },
  {
    initials: 'NW',
    name: 'Naomi Wells',
    location: 'London, United Kingdom',
    role: 'Community Coordinator',
    intro:
      'Naomi left London after a decade in nonprofit housing policy, drawn by the chance to put theory into practice. She leads the community operations team and keeps the Karis experience warm and responsive.',
  },
  {
    initials: 'DM',
    name: 'Devon McKenzie',
    location: 'New York, USA',
    role: 'Founding Resident & Architect',
    intro:
      'Devon is a licensed architect who spent twelve years shaping skylines in New York. He chose Residence A-12 as the place to raise his family and now contributes pro-bono design consultation to the community.',
  },
  {
    initials: 'AS',
    name: 'Aaliyah Singh',
    location: 'Gainesville, USA',
    role: 'Founding Resident & Wellness Practitioner',
    intro:
      'Aaliyah trained as a naturopath and ran a practice in Florida before joining Karis as one of its first residents. She collaborates with Pereira Wellness and advocates for accessible health services inside the community.',
  },
  {
    initials: 'JL',
    name: 'James Layne',
    location: 'Bridgetown, Barbados',
    role: 'Structural Engineer',
    intro:
      'James brings three decades of Caribbean construction experience to the Karis build team. His engineering oversight ensures every structure meets — and often exceeds — international standards for the tropical climate.',
  },
  {
    initials: 'PR',
    name: 'Priya Ramkhelawan',
    location: 'Paramaribo, Suriname',
    role: 'Educator & Co-Founder',
    intro:
      'Priya co-founded Karis after leading bilingual schooling programmes across Suriname and Trinidad. She is building the community learning centre and championing the next generation of Guyanese leaders from within Karis.',
  },
]

function FounderCard({ founder }: { founder: Founder }) {
  return (
    <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-6 space-y-4">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div
          className="h-14 w-14 rounded-full bg-karis-green-900 flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <span className="font-display text-lg text-karis-gold-500 font-semibold">
            {founder.initials}
          </span>
        </div>
        <div>
          <p className="font-heading text-base text-karis-green-900">{founder.name}</p>
          <p className="font-body text-xs text-karis-stone-500">{founder.location}</p>
        </div>
      </div>

      {/* Role pill */}
      <span className="inline-block font-body text-[10px] bg-karis-green-900/8 text-karis-green-900 px-2.5 py-1 rounded-full uppercase tracking-wider">
        {founder.role}
      </span>

      {/* Intro */}
      <p className="font-body text-sm text-karis-stone-500 leading-relaxed">
        {founder.intro}
      </p>
    </div>
  )
}

export default function FoundersPage() {
  return (
    <div className="min-h-screen bg-karis-stone-50">
      {/* Nav strip */}
      <header className="border-b border-karis-stone-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/" aria-label="Back to home">
            <BrandLogo size={36} />
          </Link>
          <Wordmark size="sm" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-16">
        {/* Hero */}
        <div className="max-w-2xl space-y-5">
          <span className="font-body text-xs text-karis-gold-700 uppercase tracking-widest">
            Founders&apos; Monument
          </span>
          <h1 className="font-heading text-4xl text-karis-green-900 leading-tight">
            The people who chose to build something extraordinary.
          </h1>
          <p className="font-body text-base text-karis-stone-500 leading-relaxed">
            Every great community begins with a small group of people willing to
            arrive before the roads are finished. These are the founding members of
            City of Karis — the ones who saw the vision clearly enough to act on it.
            Their names will be engraved in the Founders&apos; Monument at the centre of
            Phase 1.
          </p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FOUNDERS.map((founder) => (
            <FounderCard key={founder.name} founder={founder} />
          ))}
        </div>

        {/* Teaser CTA */}
        <div className="border border-karis-gold-300 rounded-2xl p-8 bg-karis-gold-300/10 text-center space-y-3">
          <p className="font-heading text-xl text-karis-green-900">
            Joining the founders cohort?
          </p>
          <p className="font-body text-sm text-karis-stone-500">
            Founding membership is still open to a limited number of families.
            Applications are reviewed by Dr. Karis Munroe personally.
          </p>
          <a
            href="https://cityofkaris.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-karis-green-900 text-white font-body text-sm rounded-lg hover:bg-karis-green-700 transition-colors duration-150 min-h-[44px] mt-1"
          >
            Apply at cityofkaris.com
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-karis-stone-100 px-6 py-6 text-center">
        <Wordmark size="sm" className="opacity-50" />
        <p className="font-body text-xs text-karis-stone-500 mt-2">
          Guyana{' '}
          <span aria-label="Guyana" role="img">
            🇬🇾
          </span>{' '}
          &middot; 2026
        </p>
      </footer>
    </div>
  )
}
