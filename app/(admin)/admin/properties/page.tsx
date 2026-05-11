import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { adminPropertiesApi } from '@/lib/api'
import { getServerApi } from '@/lib/api/server'
import { AddPropertySheet } from './_components/add-property-sheet'
import { Suspense } from 'react'

const typeColors: Record<string, string> = {
  OWNERSHIP: 'bg-karis-green-100 text-karis-green-900',
  RENTAL: 'bg-karis-gold-300/30 text-karis-gold-700',
  ADMIN: 'bg-karis-stone-100 text-karis-stone-700',
}

interface PropertyListRow {
  id: string
  code: string
  type: string
  category: string
  totalPrice: string | null
  paidPct: string
  primaryOwner: { fullName: string; memberId: string } | null
  primaryTenant: { fullName: string; memberId: string } | null
}

async function PropertiesContent({ page }: { page: number }) {
  const { properties, total } = await adminPropertiesApi.list(getServerApi(), page, 20)
  const rows = properties as PropertyListRow[]
  const totalPages = Math.ceil(total / 20)

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No properties yet"
        body="Add the first property to start building the City of Karis registry."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-xs font-body text-karis-stone-500 tabular-nums">
        {total} propert{total !== 1 ? 'ies' : 'y'}
      </div>
      <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-karis-stone-50">
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Code</TableHead>
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Type</TableHead>
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Category</TableHead>
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Owner</TableHead>
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Tenant</TableHead>
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">Total Price</TableHead>
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">Paid %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => {
              const totalPriceNum = p.totalPrice ? parseFloat(p.totalPrice) : null
              const paidPctNum = parseFloat(p.paidPct)
              return (
                <TableRow key={p.id} className="cursor-pointer">
                  <TableCell className="px-5">
                    <Link
                      href={`/admin/properties/${p.id}`}
                      className="font-body text-sm font-medium text-karis-green-700 hover:text-karis-green-900 tabular-nums"
                    >
                      {p.code}
                    </Link>
                  </TableCell>
                  <TableCell className="px-5">
                    <Badge className={`font-body text-xs ${typeColors[p.type] ?? ''}`} variant="secondary">
                      {p.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 font-body text-sm text-karis-stone-500">
                    {p.category}
                  </TableCell>
                  <TableCell className="px-5 font-body text-sm text-karis-stone-900">
                    {p.primaryOwner?.fullName ?? <span className="text-karis-stone-300">—</span>}
                  </TableCell>
                  <TableCell className="px-5 font-body text-sm text-karis-stone-900">
                    {p.primaryTenant?.fullName ?? <span className="text-karis-stone-300">—</span>}
                  </TableCell>
                  <TableCell className="px-5 text-right font-body text-sm tabular-nums text-karis-stone-900">
                    {totalPriceNum !== null
                      ? `$${totalPriceNum.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                      : <span className="text-karis-stone-300">—</span>}
                  </TableCell>
                  <TableCell className="px-5 text-right font-body text-sm tabular-nums text-karis-stone-700">
                    {totalPriceNum !== null ? `${paidPctNum.toFixed(1)}%` : <span className="text-karis-stone-300">—</span>}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-body text-karis-stone-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/properties?page=${page - 1}`}
                className="text-xs font-body text-karis-stone-500 hover:text-karis-stone-900 px-3 py-1.5 border border-karis-stone-100 rounded-lg transition-colors">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/properties?page=${page + 1}`}
                className="text-xs font-body text-karis-stone-500 hover:text-karis-stone-900 px-3 py-1.5 border border-karis-stone-100 rounded-lg transition-colors">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr = '1' } = await searchParams
  const page = Math.max(1, parseInt(pageStr, 10) || 1)

  return (
    <div className="p-8 max-w-7xl">
      <PageHeader
        title="Properties"
        subtitle="Registry of all City of Karis properties — ownership, rental, and admin units."
        action={<AddPropertySheet />}
      />
      <Suspense fallback={<div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>}>
        <PropertiesContent page={page} />
      </Suspense>
    </div>
  )
}
