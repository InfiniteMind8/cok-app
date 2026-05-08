import { format, differenceInDays } from 'date-fns'
import { Prisma } from '@prisma/client'
import type { CycleUnit, LeaseStatus, RequestStatus } from '@prisma/client'
import { KAmount } from '@/components/admin/k-amount'
import { Check, Clock, AlertTriangle } from 'lucide-react'
import { ExtensionRequestModal } from './extension-request-modal'

interface TenancyCyclePayment {
  id: string
  cycleNumber: number
  amount: Prisma.Decimal
  paidAt: Date
}

interface ExtensionRequest {
  id: string
  requestedNewEndDate: Date
  status: RequestStatus
  reason: string | null
  decisionNote: string | null
  createdAt: Date
}

interface TenancyStatusCardProps {
  tenancyId: string
  cycle: string
  cycleUnit: CycleUnit
  cyclePayment: Prisma.Decimal | string | number
  contractDate: Date
  startDate: Date | null
  endDate: Date | null
  nextPaymentDue: Date | null
  leaseStatus: LeaseStatus
  cyclePayments: TenancyCyclePayment[]
  extensionRequests: ExtensionRequest[]
}

const STATUS_CONFIG: Record<LeaseStatus, { label: string; color: string }> = {
  ACTIVE:      { label: 'Active',       color: 'bg-status-green/10 text-status-green' },
  ENDING_SOON: { label: 'Ending soon',  color: 'bg-amber-50 text-amber-700' },
  EXPIRED:     { label: 'Expired',      color: 'bg-status-red/10 text-status-red' },
  CANCELLED:   { label: 'Cancelled',    color: 'bg-karis-stone-100 text-karis-stone-500' },
}

const REQUEST_STATUS_CONFIG: Record<RequestStatus, { label: string; color: string }> = {
  PENDING:  { label: 'Pending review', color: 'bg-amber-50 text-amber-700' },
  APPROVED: { label: 'Approved',       color: 'bg-status-green/10 text-status-green' },
  DECLINED: { label: 'Declined',       color: 'bg-status-red/10 text-status-red' },
}

const CYCLE_LABEL: Record<CycleUnit, string> = {
  DAILY:   'Daily',
  WEEKLY:  'Weekly',
  MONTHLY: 'Monthly',
  ANNUAL:  'Annual',
}

export function TenancyStatusCard({
  tenancyId,
  cycle,
  cycleUnit,
  cyclePayment,
  contractDate,
  startDate,
  endDate,
  nextPaymentDue,
  leaseStatus,
  cyclePayments,
  extensionRequests,
}: TenancyStatusCardProps) {
  const today = new Date()
  const daysUntilEnd = endDate ? differenceInDays(endDate, today) : null
  const statusConfig = STATUS_CONFIG[leaseStatus]
  const canRequestExtension = leaseStatus === 'ACTIVE' || leaseStatus === 'ENDING_SOON'
  const hasPendingRequest = extensionRequests.some((r) => r.status === 'PENDING')

  return (
    <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-5 space-y-5">
      {/* Header: status badge + CTA */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-base text-karis-green-900">Rental status</h3>
        <span className={`font-body text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* Lease details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-body text-xs text-karis-stone-500">Payment cycle</span>
          <span className="font-body text-sm text-karis-stone-900 capitalize">
            {CYCLE_LABEL[cycleUnit] ?? cycle}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-body text-xs text-karis-stone-500">Amount per cycle</span>
          <KAmount amount={cyclePayment} className="font-body text-sm text-karis-stone-900" />
        </div>
        {startDate && (
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-karis-stone-500">Lease start</span>
            <span className="font-body text-sm text-karis-stone-900">
              {format(new Date(startDate), 'dd MMM yyyy')}
            </span>
          </div>
        )}
        {endDate && (
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-karis-stone-500">Lease end</span>
            <div className="text-right">
              <span className="font-body text-sm text-karis-stone-900">
                {format(new Date(endDate), 'dd MMM yyyy')}
              </span>
              {daysUntilEnd !== null && daysUntilEnd >= 0 && (
                <p className="font-body text-xs text-karis-stone-400">{daysUntilEnd} days remaining</p>
              )}
            </div>
          </div>
        )}
        {nextPaymentDue && (
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-karis-stone-500">Next payment due</span>
            <div className="text-right">
              <span className="font-body text-sm text-karis-stone-900">
                {format(new Date(nextPaymentDue), 'dd MMM yyyy')}
              </span>
              {(() => {
                const d = differenceInDays(new Date(nextPaymentDue), today)
                return d <= 7 && d >= 0 ? (
                  <p className="font-body text-xs text-amber-600 font-medium">Due in {d} days</p>
                ) : null
              })()}
            </div>
          </div>
        )}
        {!nextPaymentDue && (
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-karis-stone-500">Contract date</span>
            <span className="font-body text-sm text-karis-stone-900">
              {format(new Date(contractDate), 'dd MMM yyyy')}
            </span>
          </div>
        )}
      </div>

      {/* ENDING_SOON warning */}
      {leaseStatus === 'ENDING_SOON' && (
        <div className="flex items-start gap-2 py-3 px-4 bg-amber-50 rounded-xl border border-amber-100">
          <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="font-body text-sm text-amber-700 leading-snug">
            Your lease is ending soon. Request an extension below if you&apos;d like to continue.
          </p>
        </div>
      )}

      {/* Extension request CTA */}
      {canRequestExtension && !hasPendingRequest && (
        <ExtensionRequestModal tenancyId={tenancyId} currentEndDate={endDate} />
      )}

      {hasPendingRequest && (
        <div className="flex items-center gap-2 py-2.5 px-4 bg-amber-50 rounded-xl border border-amber-100">
          <Clock size={14} className="text-amber-600 shrink-0" />
          <p className="font-body text-sm text-amber-700">Extension request pending review.</p>
        </div>
      )}

      {/* Recent cycle payments */}
      {cyclePayments.length > 0 && (
        <div>
          <p className="font-body text-xs text-karis-stone-500 uppercase tracking-widest mb-2">
            Recent payments
          </p>
          <div className="space-y-2">
            {cyclePayments.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 py-2 px-3 bg-status-green/5 rounded-xl"
              >
                <div className="w-5 h-5 rounded-full bg-status-green flex items-center justify-center shrink-0">
                  <Check size={10} className="text-white" strokeWidth={3} />
                </div>
                <span className="font-body text-xs text-karis-stone-700 flex-1">
                  Cycle #{p.cycleNumber} — {format(new Date(p.paidAt), 'dd MMM yyyy')}
                </span>
                <KAmount amount={p.amount} className="font-body text-xs text-karis-stone-900" />
              </div>
            ))}
          </div>
        </div>
      )}

      {cyclePayments.length === 0 && (
        <div className="flex items-center gap-2 py-3 px-4 bg-karis-stone-50 rounded-xl">
          <Clock size={15} className="text-karis-stone-400" />
          <p className="font-body text-sm text-karis-stone-500">No payments recorded yet</p>
        </div>
      )}

      {/* Past extension requests */}
      {extensionRequests.length > 0 && (
        <div>
          <p className="font-body text-xs text-karis-stone-500 uppercase tracking-widest mb-2">
            Extension requests
          </p>
          <div className="space-y-2">
            {extensionRequests.map((r) => {
              const cfg = REQUEST_STATUS_CONFIG[r.status]
              return (
                <div key={r.id} className="py-2.5 px-3 bg-karis-stone-50 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-body text-xs text-karis-stone-700">
                      To {format(new Date(r.requestedNewEndDate), 'dd MMM yyyy')}
                    </span>
                    <span className={`font-body text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  {r.status === 'DECLINED' && r.decisionNote && (
                    <p className="font-body text-xs text-status-red leading-snug">{r.decisionNote}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
