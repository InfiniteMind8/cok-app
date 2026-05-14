// D.4: pure-type module. The runtime ledger logic lives on the backend
// (cok_backend_app: src/lib/ledger/*). Only the types used by the website's
// settings/fee-schedule editor remain here.

export type TransactionType =
  | 'DEPOSIT'
  | 'PURCHASE'
  | 'TRANSFER'
  | 'BARTER'
  | 'PAYROLL'
  | 'RESIDENT_SETTLEMENT'
  | 'VENDOR_SETTLEMENT'
  | 'VISITOR_SETTLEMENT'
  | 'TREASURY_ADJUSTMENT'
  | 'FEE_SPLIT'
  | 'REVERSAL'
  | 'FIAT_CONVERSION'
  | 'CONVERSION_BONUS'

export interface FeeRuleEntry {
  totalPct: number
  communityFundPct: number
  operationsFundPct: number
  developerSharePct: number
}

export type FeeScheduleRules = Partial<Record<TransactionType, FeeRuleEntry>>
