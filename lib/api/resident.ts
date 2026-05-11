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

export const residentPropertyApi = {
  requestExtension: (api: ApiClient, input: RequestExtensionInput) =>
    api.post<{ requestId: string }>('/v1/resident/property/extension-request', input),
}
