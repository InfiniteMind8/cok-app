'use client'

import { format } from 'date-fns'
import { X, Download, ExternalLink, Check, Calendar } from 'lucide-react'
import { Prisma } from '@prisma/client'
import { KAmount } from '@/components/admin/k-amount'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent } from '@/components/ui/sheet'

interface InstallmentPayment {
  amount: Prisma.Decimal
  proofUrl: string | null
  paidAt: Date
}

interface InstallmentDetail {
  id: string
  number: number
  dueDate: Date
  amount: Prisma.Decimal
  progressNote: string | null
  payments: InstallmentPayment[]
}

interface InstallmentNodeSheetProps {
  installment: InstallmentDetail | null
  propertyCode: string
  open: boolean
  onClose: () => void
}

export function InstallmentNodeSheet({
  installment,
  propertyCode,
  open,
  onClose,
}: InstallmentNodeSheetProps) {
  if (!installment) return null

  const isPaid = installment.payments.length > 0
  const payment = installment.payments[0]

  const statusLabel = isPaid ? 'Paid' : 'Upcoming'
  const statusColor = isPaid ? 'text-status-green' : 'text-karis-stone-400'
  const StatusIcon = isPaid ? Check : Calendar

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[85dvh] flex flex-col rounded-t-2xl p-0 gap-0"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-karis-stone-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-karis-stone-100 shrink-0">
          <h2 className="font-heading text-lg text-karis-green-900">
            Installment #{installment.number}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-karis-stone-100 hover:bg-karis-stone-200 flex items-center justify-center transition-colors duration-150"
            aria-label="Close"
          >
            <X size={15} className="text-karis-stone-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Status */}
          <div className="flex items-center gap-2 mb-4">
            <div className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
              isPaid ? 'bg-status-green' : 'bg-karis-stone-200',
            )}>
              <StatusIcon size={11} className={isPaid ? 'text-white' : 'text-karis-stone-500'} strokeWidth={isPaid ? 3 : 2} />
            </div>
            <span className={cn('font-body text-sm font-medium', statusColor)}>
              {statusLabel}
            </span>
          </div>

          {/* Rows */}
          <Row label="Property" value={propertyCode} />
          <Row
            label="Amount"
            value={<KAmount amount={installment.amount} className="font-body text-sm text-karis-stone-900 tabular-nums" />}
          />
          <Row
            label="Due date"
            value={format(new Date(installment.dueDate), 'dd MMMM yyyy')}
          />
          {isPaid && payment && (
            <Row
              label="Paid on"
              value={format(new Date(payment.paidAt), 'dd MMMM yyyy')}
            />
          )}
          {isPaid && payment?.proofUrl && (
            <div className="flex items-center justify-between py-2 border-b border-karis-stone-100">
              <span className="font-body text-xs text-karis-stone-500">Proof</span>
              <a
                href={payment.proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-sm text-karis-green-700 hover:text-karis-green-900 flex items-center gap-1.5"
              >
                View <ExternalLink size={12} />
              </a>
            </div>
          )}
          {installment.progressNote && (
            <div className="mt-2 bg-karis-stone-50 rounded-xl px-4 py-3">
              <p className="font-body text-xs text-karis-stone-500 mb-1">Milestone</p>
              <p className="font-body text-sm text-karis-stone-900">{installment.progressNote}</p>
            </div>
          )}

          {!isPaid && (
            <div className="mt-2 flex items-center gap-2 py-3 px-4 bg-karis-stone-50 rounded-xl">
              <Calendar size={14} className="text-karis-stone-400 shrink-0" />
              <p className="font-body text-sm text-karis-stone-500">
                This installment is not yet due.
              </p>
            </div>
          )}
        </div>

        {/* Download receipt */}
        {isPaid && (
          <div className="px-5 py-4 border-t border-karis-stone-100 shrink-0">
            <a
              href={`/property/receipt/${installment.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-karis-green-900 text-white font-body text-sm rounded-xl px-4 py-3 hover:bg-karis-green-700 transition-colors duration-150 min-h-[44px]"
            >
              <Download size={15} />
              Download receipt
            </a>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-karis-stone-100">
      <span className="font-body text-xs text-karis-stone-500">{label}</span>
      <span className="font-body text-sm text-karis-stone-900 text-right">{value}</span>
    </div>
  )
}
