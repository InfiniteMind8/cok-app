import Link from 'next/link'
import { LogOut, Mail, IdCard, Globe } from 'lucide-react'
import { DEMO_USERS } from '@/lib/demo/fixtures'
import { Button } from '@/components/ui/button'

export default function DemoResidentProfilePage() {
  const user = DEMO_USERS.resident
  const initials = user.fullName
    .replace(/\s*\(.*\)/, '')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5 pb-8">
      {/* Identity card */}
      <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-6 text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-karis-green-900 text-karis-gold-100 flex items-center justify-center mb-4 font-heading text-2xl">
          {initials}
        </div>
        <p className="font-heading text-xl text-karis-green-900">{user.fullName}</p>
        <p className="font-body text-xs text-karis-stone-500 tabular-nums mt-1">
          {user.memberId}
        </p>
        <span className="inline-block mt-3 font-body text-[10px] uppercase tracking-widest bg-karis-gold-100 text-karis-green-900 px-3 py-1 rounded-full">
          Resident
        </span>
      </div>

      {/* Member info */}
      <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-karis-stone-100">
          <h3 className="font-heading text-base text-karis-green-900">Account</h3>
        </div>
        <ul className="divide-y divide-karis-stone-100">
          <li className="px-5 py-3 flex items-center gap-3">
            <Mail size={16} className="text-karis-stone-500 shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="font-body text-[10px] uppercase tracking-widest text-karis-stone-500">
                Email
              </p>
              <p className="font-body text-sm text-karis-stone-900 truncate">{user.email}</p>
            </div>
          </li>
          <li className="px-5 py-3 flex items-center gap-3">
            <IdCard size={16} className="text-karis-stone-500 shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-body text-[10px] uppercase tracking-widest text-karis-stone-500">
                Member ID
              </p>
              <p className="font-body text-sm text-karis-stone-900 tabular-nums">{user.memberId}</p>
            </div>
          </li>
          <li className="px-5 py-3 flex items-center gap-3">
            <Globe size={16} className="text-karis-stone-500 shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-body text-[10px] uppercase tracking-widest text-karis-stone-500">
                Display currency
              </p>
              <p className="font-body text-sm text-karis-stone-900">KCRD (default)</p>
            </div>
          </li>
        </ul>
      </div>

      {/* Demo notice */}
      <div className="bg-karis-gold-100 border border-karis-gold-700/30 rounded-2xl p-5">
        <p className="font-heading text-sm text-karis-green-900 mb-1">You&rsquo;re in demo preview</p>
        <p className="font-body text-xs text-karis-green-700 leading-relaxed">
          This profile is hardcoded. Sign in to the real app to see your own member ID, photo, and preferences.
        </p>
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-karis-green-900 text-white font-body text-xs rounded-md hover:bg-karis-green-700 transition-colors"
        >
          <LogOut size={12} />
          Exit demo &amp; sign in
        </Link>
      </div>

      {/* Sign out (locked) */}
      <Link
        href="/sign-in"
        className="block w-full"
      >
        <Button
          type="button"
          variant="outline"
          className="w-full border-karis-stone-300 text-karis-stone-700 font-body text-sm gap-2 min-h-[44px]"
        >
          <LogOut size={16} />
          Sign out (returns to landing)
        </Button>
      </Link>
    </div>
  )
}
