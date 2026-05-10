'use client'

import { adminPropertyTransfersApi, getBrowserApi } from '@/lib/api'
import { ApprovalActions } from './approval-actions'

interface TransferRow {
  id: string
  propertyCode: string
  fromUserName: string
  toUserName: string
}

export function TransferApprovalActions({ row }: { row: TransferRow }) {
  return (
    <ApprovalActions
      label={`Transfer ${row.propertyCode} from ${row.fromUserName} to ${row.toUserName}`}
      onApprove={async () => {
        await adminPropertyTransfersApi.approve(getBrowserApi(), row.id)
      }}
      onDecline={async (reason) => {
        await adminPropertyTransfersApi.decline(getBrowserApi(), row.id, reason)
      }}
    />
  )
}
