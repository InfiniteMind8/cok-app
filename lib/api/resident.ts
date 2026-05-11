import type { ApiClient } from './client'
import type {
  AttachmentInput,
  IssueLevel,
  MoneyString,
  SettlementCreatedResponse,
  SettlementStatus,
  TransactionPage,
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

export const residentWalletApi = {
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
    api.get<TransactionPage>('/v1/resident/wallet/transactions', {
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

  requestExtension: (api: ApiClient, input: RequestExtensionInput) =>
    api.post<{ requestId: string }>('/v1/resident/property/extension-request', input),
}
