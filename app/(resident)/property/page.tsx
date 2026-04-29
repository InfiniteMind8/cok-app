import { redirect } from 'next/navigation'
import { Building2, Construction } from 'lucide-react'
import { Prisma } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth'
import { getResidentProperty } from '@/lib/queries/properties'
import { EmptyState } from '@/components/admin/empty-state'
import { PropertyCarousel } from './_components/property-carousel'
import { MilestoneStrip } from './_components/milestone-strip'
import { TenancyStatusCard } from './_components/tenancy-status-card'
import { SpecList } from './_components/spec-list'
import { ContractCard } from './_components/contract-card'

export const dynamic = 'force-dynamic'

export default async function PropertyPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  if (user.role === 'VISITOR') {
    return (
      <div className="px-4 py-8 max-w-lg mx-auto">
        <EmptyState
          icon={Building2}
          title="Property not available"
          body="Property ownership is available to Residents. Contact your Admin to upgrade your account."
        />
      </div>
    )
  }

  const property = await getResidentProperty(user.id)

  if (!property) {
    return (
      <div className="px-4 py-8 max-w-lg mx-auto">
        <EmptyState
          icon={Building2}
          title="No property assigned"
          body="Your property will appear here once assigned. Contact your Admin if you believe this is an error."
        />
      </div>
    )
  }

  const p = property.property
  const typeLabel = p.type === 'OWNERSHIP' ? 'Ownership' : p.type === 'RENTAL' ? 'Rental' : 'Admin'

  const specs =
    p.specifications && typeof p.specifications === 'object' && !Array.isArray(p.specifications)
      ? (p.specifications as Record<string, string>)
      : null

  const documents: { name: string; url: string }[] = Array.isArray(p.documents)
    ? (p.documents as { name: string; url: string }[])
    : []

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5 pb-8">
      <PropertyCarousel photos={p.photos} address={p.address} />

      {/* Address + type badge */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {p.address && (
            <p className="font-heading text-lg text-karis-green-900 leading-snug">{p.address}</p>
          )}
          <p className="font-body text-xs text-karis-stone-500 tabular-nums mt-0.5">
            Code: {p.code}
          </p>
        </div>
        <span className="shrink-0 font-body text-xs bg-karis-green-900 text-white px-3 py-1 rounded-full">
          {typeLabel}
        </span>
      </div>

      {/* Specifications */}
      <SpecList specs={specs} />

      {/* Ownership: milestone strip */}
      {property.kind === 'ownership' && (
        <MilestoneStrip
          installments={property.property.installments.map((inst) => ({
            id: inst.id,
            number: inst.number,
            dueDate: new Date(inst.dueDate),
            amount: new Prisma.Decimal(inst.amount),
            progressNote: inst.progressNote,
            payments: inst.payments.map((pay) => ({
              amount: new Prisma.Decimal(pay.amount),
              proofUrl: pay.proofUrl,
              paidAt: new Date(pay.paidAt),
            })),
          }))}
          paidPct={property.paidPct}
          paidAmount={property.paidAmount}
          totalPrice={property.totalPrice}
          outstanding={property.outstanding}
          nextInstallment={
            property.nextInstallment
              ? {
                  number: property.nextInstallment.number,
                  dueDate: new Date(property.nextInstallment.dueDate),
                  amount: new Prisma.Decimal(property.nextInstallment.amount),
                }
              : null
          }
          propertyCode={p.code}
        />
      )}

      {/* Tenancy: rental status card */}
      {property.kind === 'tenancy' && (
        <TenancyStatusCard
          tenancyId={property.tenancy.id}
          cycle={property.tenancy.cycle}
          cycleUnit={property.tenancy.cycleUnit}
          cyclePayment={property.tenancy.cyclePayment}
          contractDate={new Date(property.tenancy.contractDate)}
          startDate={property.tenancy.startDate ? new Date(property.tenancy.startDate) : null}
          endDate={property.tenancy.endDate ? new Date(property.tenancy.endDate) : null}
          nextPaymentDue={property.tenancy.nextPaymentDue ? new Date(property.tenancy.nextPaymentDue) : null}
          leaseStatus={property.tenancy.leaseStatus}
          cyclePayments={property.tenancy.cyclePayments.map((cp) => ({
            id: cp.id,
            cycleNumber: cp.cycleNumber,
            amount: new Prisma.Decimal(cp.amount),
            paidAt: new Date(cp.paidAt),
          }))}
          extensionRequests={property.tenancy.rentalExtensionRequests.map((r) => ({
            id: r.id,
            requestedNewEndDate: new Date(r.requestedNewEndDate),
            status: r.status,
            reason: r.reason,
            decisionNote: r.decisionNote,
            createdAt: new Date(r.createdAt),
          }))}
        />
      )}

      {/* Contract & documents */}
      {property.kind === 'ownership' && (
        <ContractCard
          contractDate={new Date(property.ownership.contractDate)}
          contractType="Ownership Agreement"
          contractUrl={property.ownership.contractUrl}
          documents={documents}
        />
      )}
      {property.kind === 'tenancy' && (
        <ContractCard
          contractDate={new Date(property.tenancy.contractDate)}
          contractType="Tenancy Agreement"
          contractUrl={property.tenancy.contractUrl}
          documents={documents}
        />
      )}

      {/* Construction updates placeholder */}
      <div className="bg-karis-stone-50 border border-karis-stone-100 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Construction size={18} className="text-karis-stone-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-body text-sm text-karis-stone-700 font-medium">Construction updates</p>
            <p className="font-body text-xs text-karis-stone-500 mt-1 leading-relaxed">
              Construction updates from your assigned Admin will appear here, with photos and percentage completion across foundations, structure, and finishing. Coming in Phase 2.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
