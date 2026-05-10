/**
 * DEMO ONLY — never import from production code paths.
 *
 * Hardcoded fixtures for the public /demo showcase. All names, IDs, and
 * amounts are obviously synthetic. No real customer or community data.
 *
 * Phase 1 ships the Resident slice. Subsequent phases extend per persona.
 */

export type DemoCurrencyCode = 'KCRD' | 'USD' | 'GYD'

export interface DemoUser {
  id: string
  fullName: string
  memberId: string
  role: 'MASTER_ADMIN' | 'ADMIN' | 'RESIDENT' | 'VENDOR' | 'VISITOR'
  email: string
}

export const DEMO_USERS: Record<string, DemoUser> = {
  masterAdmin: {
    id: 'demo-user-master-admin',
    fullName: 'Alex Rivers (Demo Master Admin)',
    memberId: 'KARIS-DEMO-0001',
    role: 'MASTER_ADMIN',
    email: 'alex.rivers@demo.cityofkaris.example',
  },
  admin: {
    id: 'demo-user-admin',
    fullName: 'Jordan Hayes (Demo Admin)',
    memberId: 'KARIS-DEMO-0002',
    role: 'ADMIN',
    email: 'jordan.hayes@demo.cityofkaris.example',
  },
  resident: {
    id: 'demo-user-resident',
    fullName: 'Devon Mercer (Demo Resident)',
    memberId: 'KARIS-DEMO-0003',
    role: 'RESIDENT',
    email: 'devon.mercer@demo.cityofkaris.example',
  },
  vendor: {
    id: 'demo-user-vendor',
    fullName: 'Aaliyah Stone (Demo Vendor)',
    memberId: 'KARIS-DEMO-0004',
    role: 'VENDOR',
    email: 'aaliyah.stone@demo.cityofkaris.example',
  },
  visitor: {
    id: 'demo-user-visitor',
    fullName: 'Marcus Bowen (Demo Visitor)',
    memberId: 'KARIS-DEMO-0005',
    role: 'VISITOR',
    email: 'marcus.bowen@demo.cityofkaris.example',
  },
}

// ─── Currency rates ─────────────────────────────────────────────────────────

export const DEMO_RATES: Record<string, string> = {
  KCRD_USD: '1.00',
  KCRD_GYD: '209.50',
  USD_KCRD: '1.00',
  GYD_KCRD: '0.0048',
}

// ─── Wallet ─────────────────────────────────────────────────────────────────

export interface DemoWalletSummary {
  balance: string
  totalDeposited: string
  totalEarned: string
  totalEligibleForConversion: string
}

export const DEMO_RESIDENT_WALLET: DemoWalletSummary = {
  balance: '12480.50',
  totalDeposited: '15000.00',
  totalEarned: '2480.50',
  totalEligibleForConversion: '8200.00',
}

export interface DemoTransaction {
  id: string
  type:
    | 'DEPOSIT'
    | 'PURCHASE'
    | 'TRANSFER'
    | 'PAYROLL'
    | 'BARTER'
    | 'RESIDENT_SETTLEMENT'
    | 'FEE_SPLIT'
    | 'CONVERSION_BONUS'
  description: string
  amount: string // signed: positive = incoming, negative = outgoing
  createdAt: string // ISO date
}

export const DEMO_RESIDENT_TRANSACTIONS: DemoTransaction[] = [
  {
    id: 'demo-tx-001',
    type: 'DEPOSIT',
    description: 'Founding member deposit · Treasury Office',
    amount: '5000.00',
    createdAt: '2026-05-06T09:14:00.000Z',
  },
  {
    id: 'demo-tx-002',
    type: 'PURCHASE',
    description: 'Karis Market — weekly groceries',
    amount: '-184.20',
    createdAt: '2026-05-05T17:42:00.000Z',
  },
  {
    id: 'demo-tx-003',
    type: 'PAYROLL',
    description: 'Community work — Saturday volunteer',
    amount: '420.00',
    createdAt: '2026-05-04T19:00:00.000Z',
  },
  {
    id: 'demo-tx-004',
    type: 'TRANSFER',
    description: 'Sent to Anjali Pereira',
    amount: '-75.00',
    createdAt: '2026-05-03T12:18:00.000Z',
  },
  {
    id: 'demo-tx-005',
    type: 'BARTER',
    description: 'Wellness session — credit barter',
    amount: '60.00',
    createdAt: '2026-05-02T08:30:00.000Z',
  },
  {
    id: 'demo-tx-006',
    type: 'PURCHASE',
    description: 'Telemedicine consult — 15 min',
    amount: '-90.00',
    createdAt: '2026-05-01T11:05:00.000Z',
  },
  {
    id: 'demo-tx-007',
    type: 'CONVERSION_BONUS',
    description: 'Founding cohort conversion bonus',
    amount: '120.00',
    createdAt: '2026-04-29T10:00:00.000Z',
  },
  {
    id: 'demo-tx-008',
    type: 'FEE_SPLIT',
    description: 'Settlement fee — 1%',
    amount: '-12.50',
    createdAt: '2026-04-28T14:22:00.000Z',
  },
  {
    id: 'demo-tx-009',
    type: 'DEPOSIT',
    description: 'Treasury top-up — verified fiat',
    amount: '2500.00',
    createdAt: '2026-04-25T08:00:00.000Z',
  },
  {
    id: 'demo-tx-010',
    type: 'PURCHASE',
    description: 'Karis Cafe — coffee + pastry',
    amount: '-9.50',
    createdAt: '2026-04-24T07:48:00.000Z',
  },
]

// ─── Property / Tenancy ─────────────────────────────────────────────────────

export interface DemoTenancy {
  propertyAddress: string
  propertyCode: string
  cycleLabel: string // e.g. "Monthly · 12 months"
  cyclePayment: string
  contractDate: string
  startDate: string
  endDate: string
  nextPaymentDue: string
  paidCycles: number
  totalCycles: number
  specifications: { label: string; value: string }[]
}

export const DEMO_RESIDENT_TENANCY: DemoTenancy = {
  propertyAddress: 'Lot 1 — Demo Avenue, City of Karis',
  propertyCode: 'COK-DEMO-L1',
  cycleLabel: 'Monthly · 12 months',
  cyclePayment: '450.00',
  contractDate: '2026-01-15T00:00:00.000Z',
  startDate: '2026-02-01T00:00:00.000Z',
  endDate: '2027-01-31T00:00:00.000Z',
  nextPaymentDue: '2026-06-01T00:00:00.000Z',
  paidCycles: 4,
  totalCycles: 12,
  specifications: [
    { label: 'Bedrooms', value: '2' },
    { label: 'Bathrooms', value: '1.5' },
    { label: 'Floor area', value: '92 m²' },
    { label: 'Lot size', value: '300 m²' },
    { label: 'Solar', value: '6 kWp + 14 kWh battery' },
    { label: 'Water', value: 'Rainwater + treated greywater' },
  ],
}

// ─── Community / Announcements / Voting ─────────────────────────────────────

export interface DemoAnnouncement {
  id: string
  title: string
  body: string
  severity: 'INFO' | 'URGENT' | 'CRITICAL'
  publishedAt: string
  authorName: string
}

export const DEMO_ANNOUNCEMENTS: DemoAnnouncement[] = [
  {
    id: 'demo-ann-001',
    title: 'Saturday community workday — solar canopy raise',
    body: 'Join us this Saturday at 7am to raise the solar canopy over the central plaza. Tools provided; bring water and sunscreen. Volunteer hours earn K Credits at the standard payroll rate.',
    severity: 'INFO',
    publishedAt: '2026-05-07T08:00:00.000Z',
    authorName: 'Alex Rivers',
  },
  {
    id: 'demo-ann-002',
    title: 'Treasury rates updated — KCRD/GYD',
    body: 'Following this week’s central bank rate move, the KCRD/GYD reference rate has been adjusted from 207.40 to 209.50. Settlement requests submitted before 17:00 today are honoured at the prior rate.',
    severity: 'INFO',
    publishedAt: '2026-05-06T10:30:00.000Z',
    authorName: 'Jordan Hayes',
  },
  {
    id: 'demo-ann-003',
    title: 'Water test scheduled — Wednesday 06:00–08:00',
    body: 'Quarterly water-quality testing will run Wednesday morning. Tap water may briefly cloud during flush; bottled water will be available at the community office. Normal service resumes by 09:00.',
    severity: 'URGENT',
    publishedAt: '2026-05-05T16:14:00.000Z',
    authorName: 'Jordan Hayes',
  },
]

export interface DemoProposal {
  id: string
  title: string
  question: string
  description: string
  closesAt: string
  yesCount: number
  noCount: number
  abstainCount: number
  hasVoted: false
}

export const DEMO_RESIDENT_PROPOSAL: DemoProposal = {
  id: 'demo-prop-001',
  title: 'Adopt a community electric-vehicle charging tariff',
  question: 'Should the community fund underwrite a flat KCRD-denominated tariff for EV charging stations?',
  description:
    'A flat tariff smooths variability in fiat electricity costs and rewards residents for adopting EVs. Treasury impact: estimated K 1,200 / month subsidy in year one, declining as adoption grows.',
  closesAt: '2026-05-15T23:59:00.000Z',
  yesCount: 38,
  noCount: 9,
  abstainCount: 4,
  hasVoted: false,
}
