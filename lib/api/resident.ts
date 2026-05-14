import type { ApiClient } from './client'
import type {
  AttachmentInput,
  IssueLevel,
  MoneyString,
  SettlementCreatedResponse,
  SettlementStatus,
} from './types'

// D.4: response shape of GET /v1/resident/wallet/settlements. The backend
// stringifies the Decimal amount; all dates arrive as ISO strings.
export interface SettlementRequestRow {
  id: string
  userId: string
  amount: MoneyString
  purpose: string | null
  status: SettlementStatus
  declinedReason: string | null
  proofUrl: string | null
  createdAt: string
  approvedAt: string | null
  settledAt: string | null
}

// `/v1/resident/*` endpoints. Some are RESIDENT-only, some are
// RESIDENT+VISITOR — gating is enforced server-side.

// ─── community ───────────────────────────────────────────────────────────────

export interface RaiseIssueInput {
  seriousness: IssueLevel
  urgency: IssueLevel
  category: string
  message: string
  title?: string
  location?: string
  propertyId?: string
  contactPreference?: string
  attachments?: AttachmentInput[]
}

export const residentCommunityApi = {
  // GET /v1/resident/community/notifications/unread-count
  getUnreadNotificationCount: (api: ApiClient) =>
    api.get<{ count: number }>('/v1/resident/community/notifications/unread-count'),

  acknowledgeUpdate: (api: ApiClient, updateId: string) =>
    api.post<{ acknowledged: true }>(
      `/v1/resident/community/updates/${updateId}/acknowledge`,
    ),

  acknowledgeBroadcast: (api: ApiClient, broadcastId: string) =>
    api.post<{ acknowledged: true }>(
      `/v1/resident/community/broadcasts/${broadcastId}/acknowledge`,
    ),

  castVote: (api: ApiClient, voteId: string, optionId: string) =>
    api.post<{ cast: true }>(`/v1/resident/community/votes/${voteId}/cast`, { optionId }),

  raiseIssue: (api: ApiClient, input: RaiseIssueInput) =>
    api.post<{ issueId: string }>('/v1/resident/community/issues', input),

  // GET /v1/resident/community/issues/mine — caller's own issues + replies
  listMyIssues: (api: ApiClient) =>
    api.get<
      Array<{
        id: string
        category: string
        message: string
        seriousness: string
        urgency: string
        status: string
        createdAt: string
        replies: Array<{
          id: string
          authorId: string
          message: string
          createdAt: string
        }>
      }>
    >('/v1/resident/community/issues/mine'),

  // GET /v1/resident/community/updates — paginated community feed for caller
  listUpdates: (api: ApiClient, page = 1, pageSize = 20) =>
    api.get<{
      updates: Array<{
        id: string
        category: string
        headline: string
        message: string
        photoUrl: string | null
        publishedAt: string
        acknowledgements: Array<{ id: string }>
      }>
      total: number
    }>('/v1/resident/community/updates', {
      query: { page, pageSize },
    }),

  // GET /v1/resident/community/votes — votes with caller's submission status
  listVotes: (api: ApiClient) =>
    api.get<
      Array<{
        id: string
        headline: string
        description: string
        isOpen: boolean
        options: Array<{
          id: string
          label: string
          description: string
          _count: { submissions: number }
        }>
        _count: { submissions: number }
        submissions: Array<{ optionId: string }>
      }>
    >('/v1/resident/community/votes'),

  // GET /v1/resident/community/notifications — caller's notifications
  listNotifications: (api: ApiClient, limit = 50) =>
    api.get<
      Array<{
        id: string
        type: string
        title: string
        body: string
        link: string | null
        readAt: string | null
        createdAt: string
      }>
    >('/v1/resident/community/notifications', {
      query: { limit },
    }),
}

// ─── wallet ──────────────────────────────────────────────────────────────────

// Wallet summary + recent transactions response shapes.
export interface WalletSummaryResponse {
  walletId: string
  balance: MoneyString
  totalDeposited: MoneyString
  totalEarned: MoneyString
  totalEligibleForConversion: MoneyString
}

// Ledger-entry-with-transaction shape. Backend serializes Decimal as string
// and Date as ISO string. Consumers wrap with `new Prisma.Decimal()` /
// `new Date()` at the boundary.
export interface WalletTransactionEntry {
  id: string
  walletId: string
  amount: MoneyString
  description: string
  createdAt: string
  transaction: {
    id: string
    type:
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
    description: string
    reference: string | null
    initiatedBy: string | null
    metadata: unknown
    createdAt: string
    feeScheduleId: string | null
  }
}

export interface WalletTransactionPage {
  entries: WalletTransactionEntry[]
  nextCursor: string | null
}

export const residentWalletApi = {
  // GET /v1/resident/wallet/me — basic wallet identity (id + userId)
  getMe: (api: ApiClient) =>
    api.get<{ id: string; userId: string } | null>('/v1/resident/wallet/me'),

  // GET /v1/resident/wallet/summary — balance + aggregates
  getSummary: (api: ApiClient) =>
    api.get<WalletSummaryResponse>('/v1/resident/wallet/summary'),

  // GET /v1/resident/wallet/transactions/recent?limit=
  getRecentTransactions: (api: ApiClient, limit = 10) =>
    api.get<{ entries: WalletTransactionEntry[] }>(
      '/v1/resident/wallet/transactions/recent',
      { query: { limit } },
    ),

  // GET /v1/resident/wallet/transactions/:id — single transaction
  getTransaction: (api: ApiClient, id: string) =>
    api.get<{
      id: string
      type: string
      description: string
      reference: string | null
      createdAt: string
      entryAmount: MoneyString
    }>(`/v1/resident/wallet/transactions/${id}`),

  requestSettlement: (api: ApiClient, amount: MoneyString, purpose?: string) =>
    api.post<SettlementCreatedResponse>('/v1/resident/wallet/settlements', {
      amount,
      purpose,
    }),

  cancelSettlement: (api: ApiClient, settlementId: string) =>
    api.post<{ cancelled: true }>(
      `/v1/resident/wallet/settlements/${settlementId}/cancel`,
    ),

  loadTransactions: (api: ApiClient, walletId: string, cursor?: string) =>
    api.get<WalletTransactionPage>('/v1/resident/wallet/transactions', {
      query: { walletId, cursor },
    }),

  // GET /v1/resident/wallet/settlements — caller's settlement request history
  listSettlements: (api: ApiClient) =>
    api.get<SettlementRequestRow[]>('/v1/resident/wallet/settlements'),
}

// ─── property ────────────────────────────────────────────────────────────────

export interface RequestExtensionInput {
  tenancyId: string
  requestedNewEndDate: string
  reason?: string
}

// D.4: response shape of GET /v1/resident/property/current. Decimal fields
// arrive as MoneyString; all dates as ISO strings. The discriminated union
// matches the backend's `result.kind` switch.
export interface ResidentPropertyResponseProperty {
  id: string
  code: string
  type: 'OWNERSHIP' | 'RENTAL' | 'ADMIN'
  address: string | null
  photos: string[]
  specifications: unknown
  documents: unknown
  totalPrice: MoneyString | null
  currentValuationKcrd: MoneyString | null
  sizeSqm: string | null
}

interface ResidentPropertyInstallmentPayment {
  amount: MoneyString
  proofUrl: string | null
  paidAt: string
}

interface ResidentPropertyInstallment {
  id: string
  number: number
  dueDate: string
  amount: MoneyString
  progressNote: string | null
  payments: ResidentPropertyInstallmentPayment[]
}

interface ResidentPropertyOwnership {
  id: string
  contractDate: string
  contractUrl: string | null
}

interface ResidentPropertyCyclePayment {
  id: string
  cycleNumber: number
  amount: MoneyString
  paidAt: string
}

interface ResidentPropertyExtensionRequest {
  id: string
  requestedNewEndDate: string
  status: 'PENDING' | 'APPROVED' | 'DECLINED'
  reason: string | null
  decisionNote: string | null
  createdAt: string
}

interface ResidentPropertyTenancy {
  id: string
  cycle: string
  cycleUnit: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ANNUAL'
  cyclePayment: MoneyString
  contractDate: string
  contractUrl: string | null
  startDate: string | null
  endDate: string | null
  nextPaymentDue: string | null
  leaseStatus: 'ACTIVE' | 'ENDING_SOON' | 'EXPIRED' | 'CANCELLED'
  cyclePayments: ResidentPropertyCyclePayment[]
  rentalExtensionRequests: ResidentPropertyExtensionRequest[]
}

export type ResidentPropertyResponse =
  | {
      kind: 'ownership'
      ownership: ResidentPropertyOwnership
      property: ResidentPropertyResponseProperty & {
        installments: ResidentPropertyInstallment[]
      }
      paidPct: MoneyString
      paidAmount: MoneyString
      totalPrice: MoneyString
      outstanding: MoneyString
      nextInstallment: { number: number; dueDate: string; amount: MoneyString } | null
    }
  | {
      kind: 'tenancy'
      tenancy: ResidentPropertyTenancy
      property: ResidentPropertyResponseProperty
    }

export const residentPropertyApi = {
  // GET /v1/resident/property/current — caller's current property
  getCurrent: (api: ApiClient) =>
    api.get<ResidentPropertyResponse | null>('/v1/resident/property/current'),

  // GET /v1/resident/property/installments/:id/payment — caller-owned
  // installment payment for receipt rendering.
  getInstallmentPayment: (api: ApiClient, installmentId: string) =>
    api.get<{
      amount: MoneyString
      paidAt: string
      installment: { number: number; dueDate: string }
      property: { code: string }
      member: { fullName: string; memberId: string }
    }>(`/v1/resident/property/installments/${installmentId}/payment`),

  requestExtension: (api: ApiClient, input: RequestExtensionInput) =>
    api.post<{ requestId: string }>('/v1/resident/property/extension-request', input),
}
