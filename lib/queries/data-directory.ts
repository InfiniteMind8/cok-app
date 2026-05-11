// D.4: pure-type module. Runtime live on backend
// (cok_backend_app: src/lib/queries/data-directory.ts +
//  src/routes/admin/data-directory.ts). The website hits
// `/v1/admin/data-directory/tree` and `/entity/:type/:id` via
// `adminDataDirectoryApi`. The interfaces below describe the JSON shapes
// the backend returns — Decimals come back as strings, Dates as ISO
// strings.

import type { AuditEntry } from './audit-log'

export interface TreeUser {
  id: string
  fullName: string
  email: string
  memberId: string
  role: string
  status: string
}

export interface TreeProperty {
  id: string
  code: string
  type: string
  address: string | null
}

export interface TreeLease {
  id: string
  propertyCode: string
  userName: string
  leaseStatus: string
}

export interface TreeIssue {
  id: string
  title: string | null
  category: string
  status: string
  reporterName: string
}

export interface DirectoryTree {
  users: TreeUser[]
  properties: TreeProperty[]
  leases: TreeLease[]
  issues: TreeIssue[]
}

interface AttachmentRow {
  id: string
  name: string
  mimeType: string
  storageKey: string
}

// ─── User entity detail ──────────────────────────────────────────────────────

interface UserOwnership {
  id: string
  ownershipPct: string
  contractDate: string
  property: { code: string; type: string }
}

interface UserTenancy {
  id: string
  leaseStatus: string
  property: { code: string; type: string }
}

interface UserVisitorProfile {
  visitPurpose: string | null
  expectedArrival: string | null
  expectedDeparture: string | null
}

interface UserVendorProfile {
  businessName: string | null
  businessCategory: string | null
  payoutMethod: string | null
}

interface LedgerEntryWithTransaction {
  id: string
  amount: string
  createdAt: string
  transaction: {
    type: string
    description: string
    createdAt: string
  }
}

export interface UserEntityDetail {
  type: 'User'
  entity: {
    id: string
    fullName: string
    email: string
    memberId: string
    role: string
    status: string
    profilePhotoUrl: string | null
    displayCurrency: string
    foundingMember: boolean
    createdAt: string
    preferredName: string | null
    phone: string | null
    gender: string | null
    nationalIdType: string | null
    nationalIdNumber: string | null
    emergencyContactName: string | null
    emergencyContactPhone: string | null
    householdSize: number | null
    vehiclePlates: string[]
    notes: string | null
    visitorProfile: UserVisitorProfile | null
    vendorProfile: UserVendorProfile | null
    ownedProperties: UserOwnership[]
    rentedProperties: UserTenancy[]
  }
  walletBalance: string | null
  attachments: AttachmentRow[]
  auditEntries: AuditEntry[]
  ledgerEntries: LedgerEntryWithTransaction[]
}

// ─── Property entity detail ──────────────────────────────────────────────────

interface PropertyOwnership {
  id: string
  ownershipPct: string
  user: { fullName: string; email: string }
}

interface PropertyTenancy {
  id: string
  leaseStatus: string
  user: { fullName: string; email: string }
}

interface PropertyIssue {
  id: string
  title: string | null
  status: string
  category: string
}

export interface PropertyEntityDetail {
  type: 'Property'
  entity: {
    id: string
    code: string
    type: string
    category: string
    propertyStatus: string
    address: string | null
    lotNumber: string | null
    sizeSqm: string | null
    bedrooms: string | null
    bathrooms: string | null
    yearBuilt: string | null
    totalPrice: string | null
    currentValuationKcrd: string | null
    ownerships: PropertyOwnership[]
    tenancies: PropertyTenancy[]
    issues: PropertyIssue[]
  }
  attachments: AttachmentRow[]
  auditEntries: AuditEntry[]
}

// ─── Lease entity detail ─────────────────────────────────────────────────────

export interface LeaseEntityDetail {
  type: 'Lease'
  entity: {
    id: string
    leaseStatus: string
    property: { code: string; type: string; address: string | null }
    user: { fullName: string; email: string; memberId: string }
    cyclePayments: Array<{ id: string; cycleNumber: number; amount: string; paidAt: string }>
    rentalExtensionRequests: Array<{
      id: string
      status: string
      reason: string | null
      requestedNewEndDate: string
      createdAt: string
    }>
  }
  attachments: AttachmentRow[]
  auditEntries: AuditEntry[]
}

// ─── Issue entity detail ─────────────────────────────────────────────────────

export interface IssueEntityDetail {
  type: 'Issue'
  entity: {
    id: string
    title: string | null
    category: string
    message: string
    seriousness: string
    urgency: string
    status: string
    createdAt: string
    reporter: { fullName: string; email: string }
    assignee: { fullName: string; email: string } | null
    property: { code: string } | null
    replies: Array<{
      id: string
      authorId: string
      message: string
      createdAt: string
    }>
  }
  attachments: AttachmentRow[]
  auditEntries: AuditEntry[]
}

export type EntityDetail =
  | UserEntityDetail
  | PropertyEntityDetail
  | LeaseEntityDetail
  | IssueEntityDetail
