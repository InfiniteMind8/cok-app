import type { ApiClient } from './client'
import type {
  AdminDashboardResponse,
  AnnouncementSeverity,
  AnnouncementTargetType,
  ApprovalsCounts,
  AttachmentInput,
  AuditLogFilter,
  AuditLogListResponse,
  BroadcastOverviewResponse,
  BroadcastSendResponse,
  EmailLogListResponse,
  EmailResendResponse,
  EmailStatus,
  ImportSessionCommitResponse,
  ImportSessionDetail,
  ImportSessionParseResponse,
  IssueStatus,
  MoneyString,
  PromotionDirection,
  PromotionEligibility,
  PromotionRow,
  PropertyCategory,
  PropertyStatus,
  PropertyType,
  ReconciliationListResponse,
  ReconciliationReportDetail,
  ReconciliationRunResponse,
  RentalExtensionApprovalRow,
  Role,
  SettingsOverviewResponse,
  SettlementApprovalRow,
  TransferApprovalRow,
  TreasuryOverviewResponse,
  VoucherApprovalRow,
  VoucherApprovedResponse,
} from './types'

// All admin endpoints. Mirrors the backend route layout under
// `/v1/admin/*`. Every call requires MASTER_ADMIN per Phase 1+ D-D4-01;
// the backend enforces it via the parent admin router gate.

// ─── dashboard ───────────────────────────────────────────────────────────────

export const adminDashboardApi = {
  // GET /v1/admin/dashboard — full page payload (treasury balances, KPIs,
  // flow-by-role, credits-by-role, system wallet summary). One round-trip.
  get: (api: ApiClient) => api.get<AdminDashboardResponse>('/v1/admin/dashboard'),
}

// ─── audit-log ───────────────────────────────────────────────────────────────

export const adminAuditLogApi = {
  // GET /v1/admin/audit-log — paginated list with filters
  list: (api: ApiClient, filters: AuditLogFilter = {}) =>
    api.get<AuditLogListResponse>('/v1/admin/audit-log', {
      query: {
        actorId: filters.actorId,
        action: filters.action,
        entity: filters.entity,
        entityId: filters.entityId,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        page: filters.page,
        pageSize: filters.pageSize,
      },
    }),

  // GET /v1/admin/audit-log/export — returns a CSV. Use raw to keep the
  // raw Response so the caller can stream/download.
  export: (
    api: ApiClient,
    filters: {
      actorId?: string
      action?: string
      entity?: string
      entityId?: string
      dateFrom?: string
      dateTo?: string
    } = {},
  ) =>
    api.request<Response>('/v1/admin/audit-log/export', {
      method: 'GET',
      query: filters,
      raw: true,
    }),
}

// ─── data-directory ──────────────────────────────────────────────────────────

export const adminDataDirectoryApi = {
  // GET /v1/admin/data-directory/export/:userId — ZIP download
  exportUser: (api: ApiClient, userId: string) =>
    api.request<Response>(`/v1/admin/data-directory/export/${userId}`, {
      method: 'GET',
      raw: true,
    }),

  // POST /v1/admin/data-directory/users/:userId/reset-mfa
  resetMfa: (api: ApiClient, userId: string) =>
    api.post<{ userId: string; resetAt: string }>(
      `/v1/admin/data-directory/users/${userId}/reset-mfa`,
    ),
}

// ─── settlements ─────────────────────────────────────────────────────────────

export const adminSettlementsApi = {
  approve: (api: ApiClient, id: string) =>
    api.post<{ settlementId: string }>(`/v1/admin/settlements/${id}/approve`),
  decline: (api: ApiClient, id: string, reason: string) =>
    api.post<{ settlementId: string }>(`/v1/admin/settlements/${id}/decline`, { reason }),
  execute: (api: ApiClient, id: string, proofUrl?: string) =>
    api.post<{ settlementId: string }>(`/v1/admin/settlements/${id}/execute`, { proofUrl }),
}

// ─── voucher-requests ────────────────────────────────────────────────────────

export const adminVoucherRequestsApi = {
  approve: (api: ApiClient, id: string) =>
    api.post<VoucherApprovedResponse>(`/v1/admin/voucher-requests/${id}/approve`),
  decline: (api: ApiClient, id: string, reason: string) =>
    api.post<{ requestId: string }>(`/v1/admin/voucher-requests/${id}/decline`, { reason }),
}

// ─── property-transfers ──────────────────────────────────────────────────────

export const adminPropertyTransfersApi = {
  approve: (api: ApiClient, id: string) =>
    api.post<{ requestId: string }>(`/v1/admin/property-transfers/${id}/approve`),
  decline: (api: ApiClient, id: string, reason: string) =>
    api.post<{ requestId: string }>(`/v1/admin/property-transfers/${id}/decline`, { reason }),
}

// ─── rental-extensions (admin pieces) ────────────────────────────────────────

export const adminRentalExtensionsApi = {
  approve: (api: ApiClient, id: string, note?: string) =>
    api.post<{ requestId: string }>(`/v1/admin/rental-extensions/${id}/approve`, { note }),
  decline: (api: ApiClient, id: string, note: string) =>
    api.post<{ requestId: string }>(`/v1/admin/rental-extensions/${id}/decline`, { note }),
}

// ─── deposits ────────────────────────────────────────────────────────────────

export interface RecordDepositInput {
  userId: string
  fiatAmount: MoneyString
  currency?: string
  paymentMethod: string
  proofUrl?: string
  notes?: string
}

export const adminDepositsApi = {
  record: (api: ApiClient, input: RecordDepositInput) =>
    api.post<{ transactionId: string; kcrdAmount: MoneyString }>(
      '/v1/admin/deposits',
      input,
    ),
}

// ─── treasury ────────────────────────────────────────────────────────────────

export const adminTreasuryApi = {
  // GET /v1/admin/treasury — page bundle for the treasury dashboard
  getOverview: (api: ApiClient, depositsPage = 1) =>
    api.get<TreasuryOverviewResponse>('/v1/admin/treasury', {
      query: { depositsPage },
    }),

  recordAdjustment: (
    api: ApiClient,
    input: { amount: MoneyString; currency: string; reason: string },
  ) => api.post<{ adjustmentId: string }>('/v1/admin/treasury/adjustments', input),

  setWalletFloor: (api: ApiClient, walletId: string, floor: MoneyString | null) =>
    api.post<{ walletId: string; floor: string | null }>(
      `/v1/admin/treasury/wallets/${walletId}/floor`,
      { floor },
    ),
}

// ─── vouchers ────────────────────────────────────────────────────────────────

export interface CreateVoucherInput {
  recipientId: string
  amountKcrd: MoneyString
  message?: string
  expiresAt?: string
  attachmentKey?: string
  attachmentName?: string
  attachmentSize?: number
  attachmentMime?: string
}

export const adminVouchersApi = {
  create: (api: ApiClient, input: CreateVoucherInput) =>
    api.post<{ requestId: string }>('/v1/admin/vouchers', input),
}

// ─── reconciliation ──────────────────────────────────────────────────────────

export const adminReconciliationApi = {
  list: (
    api: ApiClient,
    params: { page?: number; from?: string; to?: string } = {},
  ) =>
    api.get<ReconciliationListResponse>('/v1/admin/reconciliation/reports', {
      query: params,
    }),

  get: (api: ApiClient, reportId: string) =>
    api.get<ReconciliationReportDetail>(
      `/v1/admin/reconciliation/reports/${reportId}`,
    ),

  runNow: (api: ApiClient) =>
    api.post<ReconciliationRunResponse>('/v1/admin/reconciliation/run-now'),

  acknowledge: (api: ApiClient, reportId: string) =>
    api.post<{ reportId: string; acknowledgedAt: string }>(
      `/v1/admin/reconciliation/${reportId}/acknowledge`,
    ),
}

// ─── accounts ────────────────────────────────────────────────────────────────

export interface CreateAccountInput {
  fullName: string
  email: string
  role: Role
  preferredName?: string
  phone?: string
  gender?: string
  dob?: string
  govId?: string
  country?: string
  residentFields?: {
    preferredName?: string
    gender?: string
    nationalIdType?: string
    nationalIdNumber?: string
    emergencyContactName?: string
    emergencyContactPhone?: string
    householdSize?: number
    vehiclePlates?: string[]
    notes?: string
  }
  visitorFields?: {
    nationalIdType?: string
    nationalIdNumber?: string
    visitPurpose?: string
    expectedArrival?: string
    expectedDeparture?: string
    hostId?: string
  }
  vendorFields?: {
    businessName?: string
    businessCategory?: string
    payoutMethod?: string
    kcrdWalletPreference?: boolean
    notes?: string
  }
  attachments?: AttachmentInput[]
  groupIds?: string[]
}

export const adminAccountsApi = {
  // GET /v1/admin/accounts — paginated list (filter by role/status)
  list: (
    api: ApiClient,
    params: { role?: Role; status?: string; page?: number; pageSize?: number; search?: string } = {},
  ) =>
    api.get<{ users: unknown[]; total: number }>('/v1/admin/accounts', {
      query: {
        role: params.role,
        status: params.status,
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
      },
    }),

  // GET /v1/admin/accounts/select — minimal {id, fullName, memberId, email}
  // for select inputs across the admin UI (deposit, voucher, owner, tenant…)
  listForSelect: (api: ApiClient) =>
    api.get<{ id: string; fullName: string; memberId: string; email: string; role: Role }[]>(
      '/v1/admin/accounts/select',
    ),

  // GET /v1/admin/accounts/:id — single user detail
  get: (api: ApiClient, userId: string) =>
    api.get<unknown>(`/v1/admin/accounts/${userId}`),

  create: (api: ApiClient, input: CreateAccountInput) =>
    api.post<{ userId: string; memberId: string }>('/v1/admin/accounts', input),
  suspend: (api: ApiClient, userId: string, reason: string) =>
    api.post<{ userId: string; status: 'SUSPENDED' }>(
      `/v1/admin/accounts/${userId}/suspend`,
      { reason },
    ),
  restore: (api: ApiClient, userId: string) =>
    api.post<{ userId: string; status: 'ACTIVE' }>(`/v1/admin/accounts/${userId}/restore`),
  setRole: (api: ApiClient, userId: string, role: Role) =>
    api.post<{ userId: string; role: Role }>(`/v1/admin/accounts/${userId}/role`, { role }),
}

// ─── attachments (admin) ─────────────────────────────────────────────────────

export const adminAttachmentsApi = {
  delete: (api: ApiClient, attachmentId: string) =>
    api.post<{ attachmentId: string }>(`/v1/admin/attachments/${attachmentId}/delete`),
}

// ─── community ───────────────────────────────────────────────────────────────

export interface PublishUpdateInput {
  headline: string
  category: string
  message: string
  photoUrl?: string
  targetType?: AnnouncementTargetType
  targetRole?: Role
  targetGroupId?: string
  targetUserIds?: string[]
}

export interface CreateVoteInput {
  headline: string
  description: string
  options: { label: string; description: string }[]
}

// Issues filter shape — kept narrow because the page already passes optional
// IssueLevel / IssueStatus / Role values from the typed API.
export interface AdminIssuesFilter {
  role?: Role
  seriousness?: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED'
  urgency?: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED'
  status?: IssueStatus
  page?: number
  pageSize?: number
}

export const adminCommunityApi = {
  // GET /v1/admin/community/updates — paginated published updates
  listUpdates: (api: ApiClient, page = 1, pageSize = 20) =>
    api.get<{ updates: unknown[]; total: number }>(
      '/v1/admin/community/updates',
      { query: { page, pageSize } },
    ),

  // GET /v1/admin/community/votes/admin — votes with submission breakdowns
  listAdminVotes: (api: ApiClient) =>
    api.get<unknown[]>('/v1/admin/community/votes/admin'),

  // GET /v1/admin/community/issues — paginated issues with filters
  listIssues: (api: ApiClient, filters: AdminIssuesFilter = {}) =>
    api.get<{ issues: unknown[]; total: number }>(
      '/v1/admin/community/issues',
      {
        query: {
          role: filters.role,
          seriousness: filters.seriousness,
          urgency: filters.urgency,
          status: filters.status,
          page: filters.page,
          pageSize: filters.pageSize,
        },
      },
    ),

  publishUpdate: (api: ApiClient, input: PublishUpdateInput) =>
    api.post<{ updateId: string }>('/v1/admin/community/updates', input),

  createVote: (api: ApiClient, input: CreateVoteInput) =>
    api.post<{ voteId: string }>('/v1/admin/community/votes', input),
  closeVote: (api: ApiClient, voteId: string) =>
    api.post<{ voteId: string }>(`/v1/admin/community/votes/${voteId}/close`),

  replyToIssue: (api: ApiClient, issueId: string, message: string) =>
    api.post<{ issueId: string }>(`/v1/admin/community/issues/${issueId}/reply`, { message }),
  setIssueStatus: (api: ApiClient, issueId: string, status: IssueStatus) =>
    api.post<{ issueId: string; status: IssueStatus }>(
      `/v1/admin/community/issues/${issueId}/status`,
      { status },
    ),
  assignIssue: (api: ApiClient, issueId: string) =>
    api.post<{ issueId: string; assigneeId: string }>(
      `/v1/admin/community/issues/${issueId}/assign`,
    ),
}

// ─── broadcasts ──────────────────────────────────────────────────────────────

export const adminBroadcastsApi = {
  // GET /v1/admin/broadcasts — page bundle (active count + recent broadcasts)
  getOverview: (api: ApiClient, limit = 5) =>
    api.get<BroadcastOverviewResponse>('/v1/admin/broadcasts', {
      query: { limit },
    }),

  send: (api: ApiClient, input: { title: string; body: string; severity: AnnouncementSeverity }) =>
    api.post<BroadcastSendResponse>('/v1/admin/broadcasts/send', input),
}

// ─── emails ──────────────────────────────────────────────────────────────────

export const adminEmailsApi = {
  list: (
    api: ApiClient,
    params: { page?: number; status?: EmailStatus } = {},
  ) =>
    api.get<EmailLogListResponse>('/v1/admin/emails', {
      query: params,
    }),

  resend: (api: ApiClient, logId: string) =>
    api.post<EmailResendResponse>(`/v1/admin/emails/${logId}/resend`),
}

// ─── approvals ───────────────────────────────────────────────────────────────

export const adminApprovalsApi = {
  // GET /v1/admin/approvals — counts only (cheap, used for tab badges)
  counts: (api: ApiClient) =>
    api.get<{ counts: ApprovalsCounts }>('/v1/admin/approvals'),

  listSettlements: (api: ApiClient) =>
    api.get<SettlementApprovalRow[]>('/v1/admin/approvals/settlements'),

  listPropertyTransfers: (api: ApiClient) =>
    api.get<TransferApprovalRow[]>('/v1/admin/approvals/property-transfers'),

  listVoucherRequests: (api: ApiClient) =>
    api.get<VoucherApprovalRow[]>('/v1/admin/approvals/voucher-requests'),

  listRentalExtensions: (api: ApiClient) =>
    api.get<RentalExtensionApprovalRow[]>('/v1/admin/approvals/rental-extensions'),
}

// ─── imports ─────────────────────────────────────────────────────────────────

export const adminImportsApi = {
  // GET /v1/admin/imports/sessions/:sessionId — preview a parsed session
  getSession: (api: ApiClient, sessionId: string) =>
    api.get<ImportSessionDetail>(`/v1/admin/imports/sessions/${sessionId}`),

  parseMembers: (api: ApiClient, file: File) => {
    const fd = new FormData()
    fd.set('file', file)
    return api.upload<ImportSessionParseResponse>('/v1/admin/imports/members/parse', fd)
  },
  commitMembers: (api: ApiClient, sessionId: string, confirmedRowIds: string[]) =>
    api.post<ImportSessionCommitResponse>(
      `/v1/admin/imports/members/${sessionId}/commit`,
      { confirmedRowIds },
    ),
  cancelMembers: (api: ApiClient, sessionId: string) =>
    api.post<{ sessionId: string }>(`/v1/admin/imports/members/${sessionId}/cancel`),

  parseProperties: (api: ApiClient, file: File, zipFile?: File) => {
    const fd = new FormData()
    fd.set('file', file)
    if (zipFile) fd.set('zipFile', zipFile)
    return api.upload<ImportSessionParseResponse>('/v1/admin/imports/properties/parse', fd)
  },
  commitProperties: (api: ApiClient, sessionId: string, confirmedRowIds: string[]) =>
    api.post<ImportSessionCommitResponse>(
      `/v1/admin/imports/properties/${sessionId}/commit`,
      { confirmedRowIds },
    ),
  cancelProperties: (api: ApiClient, sessionId: string) =>
    api.post<{ sessionId: string }>(`/v1/admin/imports/properties/${sessionId}/cancel`),
}

// ─── properties ──────────────────────────────────────────────────────────────

export interface CreatePropertyInput {
  code: string
  type: PropertyType
  category: PropertyCategory
  address?: string
  addressLine2?: string
  lotNumber?: string
  totalPrice?: MoneyString
  currentValuationKcrd?: MoneyString
  sizeSqm?: string
  bedrooms?: string
  bathrooms?: string
  parkingSpots?: string
  yearBuilt?: string
  propertyStatus?: PropertyStatus
  notes?: string
  specifications?: Record<string, string>
  photos?: string[]
  attachments?: AttachmentInput[]
}

export const adminPropertiesApi = {
  // GET /v1/admin/properties — paginated list (with primary owner/tenant)
  list: (api: ApiClient, page = 1, pageSize = 20) =>
    api.get<{ properties: unknown[]; total: number }>(
      '/v1/admin/properties',
      { query: { page, pageSize } },
    ),

  // GET /v1/admin/properties/:propertyId — full detail (installments,
  // ownerships, tenancies, photos, specifications)
  get: (api: ApiClient, propertyId: string) =>
    api.get<unknown>(`/v1/admin/properties/${propertyId}`),

  create: (api: ApiClient, input: CreatePropertyInput) =>
    api.post<{ propertyId: string }>('/v1/admin/properties', input),

  addInstallment: (
    api: ApiClient,
    propertyId: string,
    input: { number: number; dueDate: string; amount: MoneyString; progressNote?: string },
  ) =>
    api.post<{ installmentId: string }>(
      `/v1/admin/properties/${propertyId}/installments`,
      input,
    ),

  assignOwner: (
    api: ApiClient,
    propertyId: string,
    input: { userId: string; ownershipPct: number; contractDate: string; contractUrl?: string },
  ) => api.post<{ ownershipId: string }>(`/v1/admin/properties/${propertyId}/owner`, input),

  assignTenant: (
    api: ApiClient,
    propertyId: string,
    input: {
      userId: string
      cycle: string
      cyclePayment: MoneyString
      contractDate: string
      contractUrl?: string
      startDate?: string
      endDate?: string
      depositAmount?: MoneyString
      leaseAgreementKey?: string
      leaseAgreementName?: string
      leaseAgreementSize?: number
      leaseAgreementMime?: string
    },
  ) => api.post<{ tenancyId: string }>(`/v1/admin/properties/${propertyId}/tenant`, input),

  recordPayment: (
    api: ApiClient,
    input: {
      installmentId: string
      ownershipId: string
      amount: MoneyString
      paidAt: string
      proofUrl?: string
    },
  ) => api.post<{ paymentId: string }>('/v1/admin/properties/payments', input),
}

// ─── settings ────────────────────────────────────────────────────────────────

export interface FeeRule {
  totalPct: number
  communityFundPct: number
  operationsFundPct: number
  developerSharePct: number
}

export const adminSettingsApi = {
  // GET /v1/admin/settings — settings page bundle
  getOverview: (api: ApiClient) =>
    api.get<SettingsOverviewResponse>('/v1/admin/settings'),

  applyFeeSchedule: (
    api: ApiClient,
    input: { rules: Record<string, FeeRule>; effectiveFrom: string },
  ) => api.post<{ scheduleId: string }>('/v1/admin/settings/fee-schedule', input),

  feeScheduleHistory: (api: ApiClient) =>
    api.get<unknown[]>('/v1/admin/settings/fee-schedule/history'),
}

// ─── rates ───────────────────────────────────────────────────────────────────

export const adminRatesApi = {
  set: (
    api: ApiClient,
    input: { baseCurrency: string; quoteCurrency: string; rate: MoneyString },
  ) =>
    api.post<{ baseCurrency: string; quoteCurrency: string; rate: MoneyString }>(
      '/v1/admin/rates',
      input,
    ),

  history: (api: ApiClient, base: string, quote: string) =>
    api.get<unknown[]>('/v1/admin/rates/history', { query: { base, quote } }),

  active: (api: ApiClient) => api.get<unknown[]>('/v1/admin/rates/active'),
}

// ─── promotions ──────────────────────────────────────────────────────────────

export interface CreatePromotionInput {
  name: string
  description: string
  bonusPercent: MoneyString
  direction: PromotionDirection
  eligibility: PromotionEligibility
  eligibleUserIds?: string
  startsAt: string
  endsAt: string
}

export const adminPromotionsApi = {
  list: (api: ApiClient) =>
    api.get<PromotionRow[]>('/v1/admin/promotions'),

  create: (api: ApiClient, input: CreatePromotionInput) =>
    api.post<{ promotionId: string }>('/v1/admin/promotions', input),

  archive: (api: ApiClient, id: string) =>
    api.post<{ promotionId: string }>(`/v1/admin/promotions/${id}/archive`),
}

// ─── visitor-groups ──────────────────────────────────────────────────────────

export const adminVisitorGroupsApi = {
  // GET /v1/admin/visitor-groups — list (optionally including archived)
  list: (api: ApiClient, includeArchived = false) =>
    api.get<unknown[]>('/v1/admin/visitor-groups', {
      query: { includeArchived: includeArchived ? 'true' : undefined },
    }),

  // GET /v1/admin/visitor-groups/:id — single group detail with memberships
  get: (api: ApiClient, id: string) =>
    api.get<unknown>(`/v1/admin/visitor-groups/${id}`),

  create: (api: ApiClient, input: { name: string; theme?: string; description: string }) =>
    api.post<{ groupId: string }>('/v1/admin/visitor-groups', input),

  edit: (
    api: ApiClient,
    id: string,
    input: { name: string; theme?: string; description: string },
  ) => api.patch<{ groupId: string }>(`/v1/admin/visitor-groups/${id}`, input),

  archive: (api: ApiClient, id: string) =>
    api.post<{ groupId: string; archived: true }>(`/v1/admin/visitor-groups/${id}/archive`),
  unarchive: (api: ApiClient, id: string) =>
    api.post<{ groupId: string; archived: false }>(
      `/v1/admin/visitor-groups/${id}/unarchive`,
    ),

  assignMember: (api: ApiClient, groupId: string, userId: string) =>
    api.post<{ membershipId: string }>(`/v1/admin/visitor-groups/${groupId}/members`, {
      userId,
    }),

  removeMember: (api: ApiClient, membershipId: string) =>
    api.delete<{ membershipId: string; removedAt: string }>(
      `/v1/admin/visitor-groups/memberships/${membershipId}`,
    ),
}
