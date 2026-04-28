import Link from 'next/link'
import { PageHeader } from '@/components/admin/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { getUsers } from '@/lib/queries/accounts'
import { getVisitorGroups } from '@/lib/queries/visitor-groups'
import { Role, AccountStatus } from '@prisma/client'
import { CreateAccountDialog } from './_components/create-account-dialog'
import { AccountsTable } from './_components/accounts-table'
import { Suspense } from 'react'

const PAGE_SIZE = 20

interface SearchParams {
  role?: string
  status?: string
  q?: string
  page?: string
}

async function AccountsContent({ sp }: { sp: SearchParams }) {
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
  const role = Object.values(Role).includes(sp.role as Role) ? (sp.role as Role) : undefined
  const status = Object.values(AccountStatus).includes(sp.status as AccountStatus)
    ? (sp.status as AccountStatus)
    : undefined

  const { users, total } = await getUsers({
    role,
    status,
    search: sp.q,
    page,
    pageSize: PAGE_SIZE,
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="text-xs font-body text-karis-stone-500 tabular-nums">
        {total} member{total !== 1 ? 's' : ''}
        {sp.role || sp.status || sp.q ? ' matching filters' : ' total'}
      </div>

      <AccountsTable users={users as Parameters<typeof AccountsTable>[0]['users']} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-body text-karis-stone-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/accounts?${new URLSearchParams({ ...sp, page: String(page - 1) })}`}
                className="text-xs font-body text-karis-stone-500 hover:text-karis-stone-900 px-3 py-1.5 border border-karis-stone-100 rounded-lg transition-colors"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/accounts?${new URLSearchParams({ ...sp, page: String(page + 1) })}`}
                className="text-xs font-body text-karis-stone-500 hover:text-karis-stone-900 px-3 py-1.5 border border-karis-stone-100 rounded-lg transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const visitorGroups = await getVisitorGroups(false)

  return (
    <div className="p-8 max-w-7xl">
      <PageHeader
        title="Accounts"
        subtitle="Manage member accounts, roles, and KYC status."
        action={
          <CreateAccountDialog
            visitorGroups={visitorGroups.map((g) => ({
              id: g.id,
              name: g.name,
              theme: g.theme,
            }))}
          />
        }
      />

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6">
        <Input
          name="q"
          defaultValue={sp.q}
          placeholder="Search by name, email, or member ID…"
          className="font-body text-sm w-64"
        />
        <Select name="role" defaultValue={sp.role ?? ''}>
          <SelectTrigger className="font-body text-sm w-36">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="" className="font-body text-sm">All roles</SelectItem>
            <SelectItem value="RESIDENT" className="font-body text-sm">Resident</SelectItem>
            <SelectItem value="VENDOR" className="font-body text-sm">Vendor</SelectItem>
            <SelectItem value="VISITOR" className="font-body text-sm">Visitor</SelectItem>
            <SelectItem value="ADMIN" className="font-body text-sm">Admin</SelectItem>
            <SelectItem value="MASTER_ADMIN" className="font-body text-sm">Master Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select name="status" defaultValue={sp.status ?? ''}>
          <SelectTrigger className="font-body text-sm w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="" className="font-body text-sm">All statuses</SelectItem>
            <SelectItem value="ACTIVE" className="font-body text-sm">Active</SelectItem>
            <SelectItem value="SUSPENDED" className="font-body text-sm">Suspended</SelectItem>
            <SelectItem value="PENDING_KYC" className="font-body text-sm">Pending KYC</SelectItem>
          </SelectContent>
        </Select>
        <button
          type="submit"
          className="text-xs font-body text-white bg-karis-green-900 hover:bg-karis-green-700 px-4 py-2 rounded-lg transition-colors"
        >
          Filter
        </button>
        {(sp.role || sp.status || sp.q) && (
          <Link
            href="/admin/accounts"
            className="text-xs font-body text-karis-stone-500 hover:text-karis-stone-900 px-3 py-2 border border-karis-stone-100 rounded-lg transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      <Suspense
        fallback={
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        }
      >
        <AccountsContent sp={sp} />
      </Suspense>
    </div>
  )
}
