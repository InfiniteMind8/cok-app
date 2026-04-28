import 'server-only'
import { format } from 'date-fns'
import { Tag } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { db } from '@/lib/db'
import { NewPromotionModal } from './_components/new-promotion-modal'
import { ArchiveButton } from './_components/archive-button'

export const dynamic = 'force-dynamic'

const DIRECTION_LABELS: Record<string, string> = {
  FIAT_TO_KCRD: 'Fiat → KCRD',
  KCRD_TO_FIAT: 'KCRD → Fiat',
}

const ELIGIBILITY_LABELS: Record<string, string> = {
  ALL: 'All users',
  FOUNDING_MEMBERS: 'Founding members',
  RESIDENTS_ONLY: 'Residents only',
  SPECIFIC_USERS: 'Specific users',
}

function PromotionStatusBadge({ active, startsAt, endsAt }: { active: boolean; startsAt: Date; endsAt: Date }) {
  const now = new Date()
  if (!active || endsAt < now) {
    return <Badge variant="secondary" className="font-body text-xs bg-karis-stone-100 text-karis-stone-500">Expired</Badge>
  }
  if (startsAt > now) {
    return <Badge variant="secondary" className="font-body text-xs bg-karis-gold-500/15 text-karis-gold-700">Scheduled</Badge>
  }
  return <Badge variant="secondary" className="font-body text-xs bg-status-green/15 text-status-green">Active</Badge>
}

function PromotionsTable({
  promotions,
  showArchive,
}: {
  promotions: Awaited<ReturnType<typeof db.conversionPromotion.findMany>>
  showArchive: boolean
}) {
  if (promotions.length === 0) {
    return (
      <p className="font-body text-sm text-karis-stone-400 py-4 px-1">None.</p>
    )
  }

  return (
    <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-karis-stone-50">
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Name</TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Bonus %</TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Direction</TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Eligibility</TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Window</TableHead>
            <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Status</TableHead>
            {showArchive && <TableHead className="px-5" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {promotions.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="px-5">
                <div className="font-body text-sm font-medium text-karis-stone-900">{p.name}</div>
                <div className="font-body text-xs text-karis-stone-500 max-w-[200px] truncate">{p.description}</div>
              </TableCell>
              <TableCell className="px-5 tabular-nums font-body text-sm text-karis-stone-900">
                +{p.bonusPercent.toString()}%
              </TableCell>
              <TableCell className="px-5 font-body text-sm text-karis-stone-700">
                {DIRECTION_LABELS[p.direction] ?? p.direction}
              </TableCell>
              <TableCell className="px-5 font-body text-sm text-karis-stone-700">
                {ELIGIBILITY_LABELS[p.eligibility] ?? p.eligibility}
                {p.eligibility === 'SPECIFIC_USERS' && p.eligibleUserIds.length > 0 && (
                  <span className="ml-1 text-karis-stone-400">({p.eligibleUserIds.length})</span>
                )}
              </TableCell>
              <TableCell className="px-5 font-body text-xs text-karis-stone-500 whitespace-nowrap">
                {format(p.startsAt, 'dd MMM yyyy')} — {format(p.endsAt, 'dd MMM yyyy')}
              </TableCell>
              <TableCell className="px-5">
                <PromotionStatusBadge active={p.active} startsAt={p.startsAt} endsAt={p.endsAt} />
              </TableCell>
              {showArchive && (
                <TableCell className="px-5 py-2">
                  <ArchiveButton id={p.id} />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default async function PromotionsPage() {
  const now = new Date()
  const promotions = await db.conversionPromotion.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const active = promotions.filter((p) => p.active && p.startsAt <= now && p.endsAt >= now)
  const scheduled = promotions.filter((p) => p.active && p.startsAt > now)
  const expired = promotions.filter((p) => !p.active || p.endsAt < now)

  return (
    <div className="p-8 max-w-5xl space-y-8">
      <PageHeader
        title="Promotions"
        subtitle="Bonus K Credit incentives applied during fiat conversions."
        action={<NewPromotionModal />}
      />

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Tag size={14} className="text-status-green" />
          <h2 className="font-heading text-sm text-karis-green-900">Active</h2>
        </div>
        <PromotionsTable promotions={active} showArchive />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Tag size={14} className="text-karis-gold-600" />
          <h2 className="font-heading text-sm text-karis-green-900">Scheduled</h2>
        </div>
        <PromotionsTable promotions={scheduled} showArchive />
      </section>

      {expired.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Tag size={14} className="text-karis-stone-400" />
            <h2 className="font-heading text-sm text-karis-green-900">Expired / Archived</h2>
          </div>
          <PromotionsTable promotions={expired} showArchive={false} />
        </section>
      )}
    </div>
  )
}
