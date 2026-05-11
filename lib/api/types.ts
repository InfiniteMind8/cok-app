// Shared TypeScript types for API request/response shapes.
//
// These deliberately mirror Prisma enums + a curated set of DTOs from the
// backend so the website can stay decoupled from the @prisma/client
// runtime. Keep in sync with `backend/prisma/schema.prisma`.

// ─── Enums (mirror Prisma) ───────────────────────────────────────────────────

export type Role = 'MASTER_ADMIN' | 'ADMIN' | 'VENDOR' | 'RESIDENT' | 'VISITOR'

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_KYC'

export type DisplayCurrency = 'KCRD' | 'USD' | 'GYD'

export type IssueLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED'
export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export type AnnouncementSeverity = 'INFO' | 'URGENT' | 'CRITICAL'
export type AnnouncementTargetType =
  | 'COMMUNITY_WIDE'
  | 'ROLE'
  | 'VISITOR_GROUP'
  | 'SPECIFIC_USERS'

export type PromotionDirection = 'FIAT_TO_KCRD' | 'KCRD_TO_FIAT'
export type PromotionEligibility =
  | 'ALL'
  | 'FOUNDING_MEMBERS'
  | 'RESIDENTS_ONLY'
  | 'SPECIFIC_USERS'

export type PropertyType = 'OWNERSHIP' | 'RENTAL' | 'ADMIN'
export type PropertyCategory = 'RESIDENTIAL' | 'COMMERCIAL' | 'MIXED'
export type PropertyStatus = 'VACANT' | 'OCCUPIED' | 'UNDER_CONSTRUCTION'

export type AttachmentEntityType =
  | 'USER'
  | 'PROPERTY'
  | 'ISSUE'
  | 'LEASE'
  | 'VOUCHER_REQUEST'

export type LeaseStatus = 'ACTIVE' | 'ENDING_SOON' | 'EXPIRED'

export type SettlementStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'DECLINED'
  | 'SETTLED'
  | 'CANCELLED'

export type TransferStatus = 'PENDING' | 'APPROVED' | 'DECLINED'

// ─── Common shapes ───────────────────────────────────────────────────────────

/**
 * Decimal values are serialised as strings over the wire. Use `decimal.js`
 * (already a dep) for arithmetic on the frontend, or coerce to Number for
 * display only.
 */
export type MoneyString = string

export interface AttachmentInput {
  storageKey: string
  mimeType: string
  sizeBytes: number
  name: string
  fieldName: string
}

// ─── Me / profile shapes ─────────────────────────────────────────────────────

export interface MeResponse {
  id: string
  clerkId: string | null
  email: string
  fullName: string
  role: Role
  memberId: string
  profilePhotoUrl: string | null
  displayCurrency: DisplayCurrency
  foundingMember: boolean
  onboardingTourCompletedAt: string | null
  onboardingTourDismissedAt: string | null
  createdAt: string
}

// ─── Wallet shapes ───────────────────────────────────────────────────────────

export interface TransactionPage {
  entries: unknown[] // shape mirrors backend lib/queries/wallet.ts; refine when Phase 6 needs it
  nextCursor: string | null
}

// ─── Settlement shapes ───────────────────────────────────────────────────────

export interface SettlementCreatedResponse {
  settlementId: string
}

// ─── Dashboard shape ─────────────────────────────────────────────────────────

export interface DashboardSystemWalletRow {
  walletId: string
  key: string
  balance: MoneyString
  floor: MoneyString | null
  headroom: MoneyString | null
}

export interface DashboardFlowRow {
  role: Role
  totalDeposits: MoneyString
  totalSettlements: MoneyString
}

export interface DashboardCreditsByRoleRow {
  role: Role
  totalBalance: MoneyString
  memberCount: number
}

export interface AdminDashboardResponse {
  treasuryReserve: MoneyString
  communityFund: MoneyString
  systemWallets: DashboardSystemWalletRow[]
  totalCirculating: MoneyString
  activeMembers: number
  pendingApprovals: number
  openIssues: number
  flowByRole: DashboardFlowRow[]
  creditsByRole: DashboardCreditsByRoleRow[]
}

// ─── Voucher shapes ──────────────────────────────────────────────────────────

export interface VoucherApprovedResponse {
  requestId: string
  voucherCode: string
}

// ─── Reconciliation shapes ───────────────────────────────────────────────────

export interface ReconciliationRunResponse {
  reportId: string
  status: 'OK' | 'MISMATCH' | 'WARNING'
  discrepancy: MoneyString
}

// ─── Import shapes ───────────────────────────────────────────────────────────

export interface ImportSessionParseResponse {
  sessionId: string
  totalRows: number
  validCount: number
  warningCount: number
  errorCount: number
}

export interface ImportSessionCommitResponse {
  sessionId: string
  committedCount: number
  skippedCount: number
}

// ─── Broadcast shapes ────────────────────────────────────────────────────────

export interface BroadcastSendResponse {
  broadcastId: string
  sent: number
  failed: number
}

// ─── Email log shapes ────────────────────────────────────────────────────────

export interface EmailResendResponse {
  logId: string
  messageId: string
  skipped: boolean
}

export type EmailStatus = 'SENT' | 'FAILED' | 'QUEUED'

export interface EmailLogEntry {
  id: string
  recipient: string
  subject: string
  template: string
  status: EmailStatus
  sentAt: string | null
  createdAt: string
  providerError: string | null
}

export interface EmailLogListResponse {
  logs: EmailLogEntry[]
  total: number
  page: number
  pageSize: number
  counts: Partial<Record<EmailStatus, number>>
}

// ─── Approvals shapes ────────────────────────────────────────────────────────

export interface ApprovalsCounts {
  settlements: number
  transfers: number
  vouchers: number
  extensions: number
}

export interface SettlementApprovalRow {
  id: string
  userId: string
  amount: MoneyString
  purpose: string | null
  createdAt: string
  userName: string
  memberId: string
  eligibleBalance: MoneyString
}

export interface TransferApprovalRow {
  id: string
  propertyCode: string
  propertyAddress: string | null
  fromUser: { fullName: string; memberId: string }
  toUser: { fullName: string; memberId: string }
  createdAt: string
}

export interface VoucherApprovalRow {
  id: string
  amount: MoneyString
  description: string | null
  expiresAt: string | null
  createdAt: string
  recipient: { fullName: string; memberId: string }
}

export interface RentalExtensionApprovalRow {
  id: string
  requesterName: string
  requesterMemberId: string
  propertyCode: string
  propertyAddress: string | null
  currentEnd: string | null
  requestedEnd: string
  deltaDays: number
  reason: string | null
  createdAt: string
}

// ─── Treasury shapes ─────────────────────────────────────────────────────────

export interface TreasurySystemWalletRow {
  walletId: string
  key: string
  balance: MoneyString
  floor: MoneyString | null
  headroom: MoneyString | null
}

export interface TreasuryDepositRow {
  id: string
  createdAt: string
  userId: string
  userName: string
  memberId: string
  fiatAmount: MoneyString
  currency: string
  paymentMethod: string
  proofUrl: string | null
  kIssued: MoneyString
}

export interface TreasuryApprovedSettlementRow {
  id: string
  userId: string
  amount: MoneyString
  userName: string
  memberId: string
  approvedAt: string | null
}

export interface TreasuryUserOption {
  id: string
  fullName: string
  email: string
  memberId: string
}

export interface TreasuryOverviewResponse {
  reserveBalance: MoneyString
  systemWallets: TreasurySystemWalletRow[]
  allUsers: TreasuryUserOption[]
  deposits: TreasuryDepositRow[]
  depositTotal: number
  approvedSettlements: TreasuryApprovedSettlementRow[]
}

// ─── Reconciliation shapes ───────────────────────────────────────────────────

export type ReconciliationStatus = 'OK' | 'WARNING' | 'MISMATCH'

export interface ReconciliationReportRow {
  id: string
  runAt: string
  status: ReconciliationStatus
  details: unknown
  acknowledgedAt: string | null
  acknowledgedBy: { fullName: string } | null
}

export interface ReconciliationListResponse {
  reports: ReconciliationReportRow[]
  total: number
  page: number
  pageSize: number
}

export interface ReconciliationReportDetail {
  id: string
  runAt: string
  status: ReconciliationStatus
  details: unknown
  acknowledgedAt: string | null
  acknowledgedBy: { fullName: string; email: string } | null
}

// ─── Promotions shapes ───────────────────────────────────────────────────────

export interface PromotionRow {
  id: string
  name: string
  description: string
  bonusPercent: MoneyString
  direction: PromotionDirection
  eligibility: PromotionEligibility
  eligibleUserIds: string[]
  startsAt: string
  endsAt: string
  active: boolean
  createdAt: string
}

// ─── Imports session shape ───────────────────────────────────────────────────

export interface ImportSessionRow {
  id: string
  rowNumber: number
  rowData: Record<string, string>
  status: 'VALID' | 'WARNING' | 'ERROR'
  messages: string[]
}

export interface ImportSessionDetail {
  id: string
  type: string
  fileName: string
  status: 'UPLOADED' | 'COMMITTED' | 'CANCELLED'
  totalRows: number
  validCount: number
  warningCount: number
  errorCount: number
  committedCount: number
  skippedCount: number
  createdAt: string
  rows: ImportSessionRow[]
}

// ─── Audit log ───────────────────────────────────────────────────────────────

export interface AuditLogRow {
  id: string
  action: string
  entity: string
  entityId: string | null
  actorId: string
  before: unknown
  after: unknown
  createdAt: string
}

export interface AuditLogListResponse {
  logs: AuditLogRow[]
  total: number
}

export interface AuditLogFilter {
  actorId?: string
  action?: string
  entity?: string
  entityId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

// ─── Broadcast page bundle ───────────────────────────────────────────────────

export interface BroadcastRecentRow {
  id: string
  headline: string
  message: string
  severity: AnnouncementSeverity
  publishedAt: string
  _count: { acknowledgements: number }
}

export interface BroadcastOverviewResponse {
  activeCount: number
  recent: BroadcastRecentRow[]
}

// ─── Settings page bundle ────────────────────────────────────────────────────

export interface SettingsRecentActivityRow {
  id: string
  type: string
  description: string
  total: MoneyString
  createdAt: string
  initiatedByName: string
}

export interface SettingsOverviewResponse {
  feeSchedule: {
    id: string
    effectiveAt: string
    rules: Record<string, unknown>
  } | null
  systemWallets: TreasurySystemWalletRow[]
  recentActivity: SettingsRecentActivityRow[]
}

// Schedule history rows come back from the backend with ISO date strings.
export interface FeeScheduleHistoryRow {
  id: string
  effectiveAt: string
  effectiveTo: string | null
  rules: Record<string, unknown>
  createdBy: string
  createdAt: string
  isActive: boolean
}
