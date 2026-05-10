'use client'

import { approveVoucherRequestAction, declineVoucherRequestAction } from '@/app/(admin)/_actions/voucher-requests'
import { ApprovalActions } from './approval-actions'

interface VoucherRow {
  id: string
  amount: string
  recipientName: string
}

export function VoucherRequestApprovalActions({ row }: { row: VoucherRow }) {
  return (
    <ApprovalActions
      label={`Issue ${row.amount} KCRD voucher to ${row.recipientName}`}
      onApprove={approveVoucherRequestAction.bind(null, row.id)}
      onDecline={declineVoucherRequestAction.bind(null, row.id)}
    />
  )
}
