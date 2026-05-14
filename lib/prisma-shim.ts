// D.4: shim that mirrors the slim subset of the Prisma client the website
// still references at runtime, so the @prisma/client dependency can be
// dropped from package.json. All DB access flows through the backend;
// the website only needs Decimal arithmetic + enum literal values for
// display logic and dropdowns.
//
// The namespace-with-const merge below is the established TS pattern for
// exposing `Prisma.Decimal` as BOTH a value (`new Prisma.Decimal(x)`) AND
// a type annotation (`amount: Prisma.Decimal`). The lint rule is
// suppressed only for this file.
/* eslint-disable @typescript-eslint/no-namespace */

import { Decimal } from 'decimal.js'

export const Prisma = { Decimal } as const
export namespace Prisma {
  export type Decimal = InstanceType<typeof Decimal>
}

// ─── Enum literal types (mirror backend prisma/schema.prisma) ────────────────

export const Role = {
  MASTER_ADMIN: 'MASTER_ADMIN',
  ADMIN: 'ADMIN',
  VENDOR: 'VENDOR',
  RESIDENT: 'RESIDENT',
  VISITOR: 'VISITOR',
} as const
export type Role = (typeof Role)[keyof typeof Role]

export const AccountStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING_KYC: 'PENDING_KYC',
} as const
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus]

export const TransactionType = {
  DEPOSIT: 'DEPOSIT',
  PURCHASE: 'PURCHASE',
  TRANSFER: 'TRANSFER',
  BARTER: 'BARTER',
  PAYROLL: 'PAYROLL',
  RESIDENT_SETTLEMENT: 'RESIDENT_SETTLEMENT',
  VENDOR_SETTLEMENT: 'VENDOR_SETTLEMENT',
  VISITOR_SETTLEMENT: 'VISITOR_SETTLEMENT',
  TREASURY_ADJUSTMENT: 'TREASURY_ADJUSTMENT',
  FEE_SPLIT: 'FEE_SPLIT',
  REVERSAL: 'REVERSAL',
  FIAT_CONVERSION: 'FIAT_CONVERSION',
  CONVERSION_BONUS: 'CONVERSION_BONUS',
} as const
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType]

export const DisplayCurrency = {
  KCRD: 'KCRD',
  USD: 'USD',
  GYD: 'GYD',
} as const
export type DisplayCurrency = (typeof DisplayCurrency)[keyof typeof DisplayCurrency]

export const CycleUnit = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  ANNUAL: 'ANNUAL',
} as const
export type CycleUnit = (typeof CycleUnit)[keyof typeof CycleUnit]

export const LeaseStatus = {
  ACTIVE: 'ACTIVE',
  ENDING_SOON: 'ENDING_SOON',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const
export type LeaseStatus = (typeof LeaseStatus)[keyof typeof LeaseStatus]

export const RequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DECLINED: 'DECLINED',
} as const
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus]

export const AnnouncementSeverity = {
  INFO: 'INFO',
  URGENT: 'URGENT',
  CRITICAL: 'CRITICAL',
} as const
export type AnnouncementSeverity =
  (typeof AnnouncementSeverity)[keyof typeof AnnouncementSeverity]

export const AnnouncementTargetType = {
  COMMUNITY_WIDE: 'COMMUNITY_WIDE',
  ROLE: 'ROLE',
  VISITOR_GROUP: 'VISITOR_GROUP',
  SPECIFIC_USERS: 'SPECIFIC_USERS',
} as const
export type AnnouncementTargetType =
  (typeof AnnouncementTargetType)[keyof typeof AnnouncementTargetType]

export const PromotionDirection = {
  FIAT_TO_KCRD: 'FIAT_TO_KCRD',
  KCRD_TO_FIAT: 'KCRD_TO_FIAT',
} as const
export type PromotionDirection =
  (typeof PromotionDirection)[keyof typeof PromotionDirection]

export const AttachmentEntityType = {
  PROPERTY: 'PROPERTY',
  USER: 'USER',
  ISSUE: 'ISSUE',
  LEASE: 'LEASE',
  VOUCHER_REQUEST: 'VOUCHER_REQUEST',
} as const
export type AttachmentEntityType =
  (typeof AttachmentEntityType)[keyof typeof AttachmentEntityType]

export const IssueLevel = {
  GREEN: 'GREEN',
  YELLOW: 'YELLOW',
  ORANGE: 'ORANGE',
  RED: 'RED',
} as const
export type IssueLevel = (typeof IssueLevel)[keyof typeof IssueLevel]
