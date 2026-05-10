// Shared TypeScript types for API request/response shapes.
//
// These deliberately mirror Prisma enums + a curated set of DTOs from the
// backend so the website can drop its `@prisma/client` runtime dependency
// in Phase 7. Keep in sync with `backend/prisma/schema.prisma`.

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
