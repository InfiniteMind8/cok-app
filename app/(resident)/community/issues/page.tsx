import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getMyIssues } from '@/lib/queries/community'
import { MyIssuesList } from './_components/my-issues-list'

export const dynamic = 'force-dynamic'

export default async function MyIssuesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const issues = await getMyIssues(user.id)

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-4 pb-8">
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="flex items-center gap-1 font-body text-sm text-karis-stone-500 hover:text-karis-stone-900 transition-colors -ml-1"
        >
          <ChevronLeft size={16} />
          Profile
        </Link>
      </div>

      <h1 className="font-heading text-2xl text-karis-green-900">My issues</h1>

      <MyIssuesList issues={issues} />
    </div>
  )
}
