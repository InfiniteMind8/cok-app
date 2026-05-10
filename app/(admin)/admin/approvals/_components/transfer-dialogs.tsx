'use client'

import { approveTransferAction, declineTransferAction } from '@/app/(admin)/_actions/property-transfers'
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
      onApprove={approveTransferAction.bind(null, row.id)}
      onDecline={declineTransferAction.bind(null, row.id)}
    />
  )
}
