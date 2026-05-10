'use client'

import { adminVoucherRequestsApi, getBrowserApi } from '@/lib/api'
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
      onApprove={async () => {
        await adminVoucherRequestsApi.approve(getBrowserApi(), row.id)
      }}
      onDecline={async (reason) => {
        await adminVoucherRequestsApi.decline(getBrowserApi(), row.id, reason)
      }}
    />
  )
}
