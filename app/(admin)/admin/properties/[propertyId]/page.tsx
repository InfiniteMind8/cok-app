import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/admin/empty-state'
import { getPropertyDetail } from '@/lib/queries/properties'
import { getAllUsersForSelect } from '@/lib/queries/accounts'
import { Prisma } from '@prisma/client'
import { format } from 'date-fns'
import {
  AddInstallmentDialog,
  AssignOwnerDialog,
  AssignTenantDialog,
} from './_components/property-tabs-client'

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ propertyId: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { propertyId } = await params
  const { tab = 'overview' } = await searchParams

  const [property, users] = await Promise.all([
    getPropertyDetail(propertyId),
    getAllUsersForSelect(),
  ])

  if (!property) notFound()

  const specs = property.specifications as Record<string, string> | null

  return (
    <div className="p-8 max-w-5xl">
      {/* Back link */}
      <Link
        href="/admin/properties"
        className="inline-flex items-center gap-1.5 text-xs font-body text-karis-stone-500 hover:text-karis-stone-900 mb-6 transition-colors"
      >
        <ArrowLeft size={13} /> All properties
      </Link>

      {/* Property header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-heading text-3xl text-karis-green-900">{property.code}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary" className="font-body text-xs bg-karis-green-100 text-karis-green-900">
              {property.type}
            </Badge>
            <Badge variant="secondary" className="font-body text-xs bg-karis-stone-100 text-karis-stone-700">
              {property.category}
            </Badge>
          </div>
          {property.address && (
            <p className="font-body text-sm text-karis-stone-500 mt-1">{property.address}</p>
          )}
        </div>
        {property.totalPrice && (
          <div className="text-right">
            <p className="text-xs font-body text-karis-stone-500">Total price</p>
            <p className="text-xl font-heading text-karis-green-900 tabular-nums">
              ${new Prisma.Decimal(property.totalPrice).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </p>
          </div>
        )}
      </div>

      <Tabs defaultValue={tab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview" className="font-body text-sm">Overview</TabsTrigger>
          <TabsTrigger value="installments" className="font-body text-sm">Installments</TabsTrigger>
          <TabsTrigger value="owner" className="font-body text-sm">Owner</TabsTrigger>
          <TabsTrigger value="tenant" className="font-body text-sm">Tenant</TabsTrigger>
          <TabsTrigger value="documents" className="font-body text-sm">Documents</TabsTrigger>
        </TabsList>

        {/* ─── Overview ─────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6">
          {/* Photos */}
          {property.photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {property.photos.map((url, i) => (
                <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-karis-stone-100">
                  <Image src={url} alt={`${property.code} photo ${i + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-karis-stone-50 border border-karis-stone-100 rounded-xl p-8 text-center">
              <p className="text-sm font-body text-karis-stone-400">No photos uploaded yet.</p>
            </div>
          )}

          {/* Specifications */}
          {specs && Object.keys(specs).length > 0 && (
            <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-karis-stone-100">
                <h3 className="font-heading text-base text-karis-green-900">Specifications</h3>
              </div>
              <Table>
                <TableBody>
                  {Object.entries(specs).map(([k, v]) => (
                    <TableRow key={k}>
                      <TableCell className="px-5 font-body text-sm text-karis-stone-500 w-48">{k}</TableCell>
                      <TableCell className="px-5 font-body text-sm text-karis-stone-900">{v}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ─── Installments ─────────────────────────────────────────────── */}
        <TabsContent value="installments">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading text-base text-karis-green-900">Payment installments</h3>
            <AddInstallmentDialog propertyId={property.id} />
          </div>
          {property.installments.length === 0 ? (
            <EmptyState icon={FileText} title="No installments" body="Add the payment schedule for this property." />
          ) : (
            <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-karis-stone-50">
                    <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">#</TableHead>
                    <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Due date</TableHead>
                    <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">Amount</TableHead>
                    <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">Paid</TableHead>
                    <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {property.installments.map((inst) => {
                    const paid = inst.payments.reduce((a, p) => a.add(p.amount), new Prisma.Decimal(0))
                    return (
                      <TableRow key={inst.id}>
                        <TableCell className="px-5 font-body text-sm tabular-nums text-karis-stone-900">{inst.number}</TableCell>
                        <TableCell className="px-5 font-body text-sm text-karis-stone-500">{format(inst.dueDate, 'dd MMM yyyy')}</TableCell>
                        <TableCell className="px-5 text-right font-body text-sm tabular-nums text-karis-stone-900">
                          ${new Prisma.Decimal(inst.amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="px-5 text-right font-body text-sm tabular-nums text-karis-stone-700">
                          ${paid.toFixed(2)}
                        </TableCell>
                        <TableCell className="px-5 font-body text-xs text-karis-stone-500">
                          {inst.progressNote ?? '—'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ─── Owner ────────────────────────────────────────────────────── */}
        <TabsContent value="owner">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading text-base text-karis-green-900">Ownership</h3>
            <AssignOwnerDialog propertyId={property.id} users={users} />
          </div>
          {property.ownerships.length === 0 ? (
            <EmptyState icon={FileText} title="No owner assigned" body="Assign an owner to this property." />
          ) : (
            <div className="space-y-4">
              {property.ownerships.map((o) => (
                <div key={o.id} className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-karis-stone-100 flex justify-between">
                    <div>
                      <p className="font-body text-sm font-medium text-karis-stone-900">{o.user.fullName}</p>
                      <p className="font-body text-xs text-karis-stone-500">{o.user.memberId} · {o.ownershipPct.toString()}% ownership</p>
                    </div>
                    <div className="text-right text-xs font-body text-karis-stone-500">
                      <p>Contract: {format(o.contractDate, 'dd MMM yyyy')}</p>
                      {o.contractUrl && (
                        <a href={o.contractUrl} target="_blank" rel="noopener noreferrer" className="text-karis-green-700 hover:underline inline-flex items-center gap-1">
                          View contract <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                  {o.payments.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-karis-stone-50">
                          <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Date paid</TableHead>
                          <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Installment</TableHead>
                          <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">Amount</TableHead>
                          <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Proof</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {o.payments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="px-5 font-body text-sm text-karis-stone-500">{format(p.paidAt, 'dd MMM yyyy')}</TableCell>
                            <TableCell className="px-5 font-body text-sm text-karis-stone-500">#{p.installment.number}</TableCell>
                            <TableCell className="px-5 text-right font-body text-sm tabular-nums">${new Prisma.Decimal(p.amount).toFixed(2)}</TableCell>
                            <TableCell className="px-5">
                              {p.proofUrl ? (
                                <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-body text-karis-green-700 hover:underline inline-flex items-center gap-1">View <ExternalLink size={10} /></a>
                              ) : <span className="text-xs font-body text-karis-stone-300">—</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Tenant ───────────────────────────────────────────────────── */}
        <TabsContent value="tenant">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading text-base text-karis-green-900">Tenancy</h3>
            <AssignTenantDialog propertyId={property.id} users={users} />
          </div>
          {property.tenancies.length === 0 ? (
            <EmptyState icon={FileText} title="No tenant assigned" body="Assign a tenant to this property." />
          ) : (
            <div className="space-y-4">
              {property.tenancies.map((t) => (
                <div key={t.id} className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-karis-stone-100">
                    <p className="font-body text-sm font-medium text-karis-stone-900">{t.user.fullName}</p>
                    <p className="font-body text-xs text-karis-stone-500">
                      {t.user.memberId} · {t.cycle} — ${new Prisma.Decimal(t.cyclePayment).toFixed(2)}/cycle
                    </p>
                    <p className="font-body text-xs text-karis-stone-500">Contract: {format(t.contractDate, 'dd MMM yyyy')}</p>
                  </div>
                  {t.cyclePayments.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-karis-stone-50">
                          <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Date paid</TableHead>
                          <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Cycle</TableHead>
                          <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {t.cyclePayments.map((cp) => (
                          <TableRow key={cp.id}>
                            <TableCell className="px-5 font-body text-sm text-karis-stone-500">{format(cp.paidAt, 'dd MMM yyyy')}</TableCell>
                            <TableCell className="px-5 font-body text-sm text-karis-stone-500 tabular-nums">#{cp.cycleNumber}</TableCell>
                            <TableCell className="px-5 text-right font-body text-sm tabular-nums">${new Prisma.Decimal(cp.amount).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Documents ────────────────────────────────────────────────── */}
        <TabsContent value="documents">
          {(() => {
            const docs: { label: string; url: string }[] = []
            property.ownerships.forEach((o) => {
              if (o.contractUrl) docs.push({ label: `Ownership contract — ${o.user.fullName}`, url: o.contractUrl })
            })
            property.tenancies.forEach((t) => {
              if (t.contractUrl) docs.push({ label: `Tenancy contract — ${t.user.fullName}`, url: t.contractUrl })
            })

            if (docs.length === 0) {
              return <EmptyState icon={FileText} title="No documents" body="Contract documents will appear here once uploaded." />
            }

            return (
              <div className="space-y-2">
                {docs.map((d, i) => (
                  <a
                    key={i}
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-white border border-karis-stone-100 rounded-xl px-5 py-4 hover:border-karis-stone-300 transition-colors"
                  >
                    <FileText size={18} className="text-karis-stone-400 shrink-0" />
                    <span className="font-body text-sm text-karis-stone-900 flex-1">{d.label}</span>
                    <ExternalLink size={13} className="text-karis-stone-400 shrink-0" />
                  </a>
                ))}
              </div>
            )
          })()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
