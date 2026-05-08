import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  update: vi.fn(),
  sendEmail: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    propertyTenancy: {
      findMany: mocks.findMany,
      update: mocks.update,
    },
  },
}))

// Dynamic import in route.ts — vi.mock still intercepts it
vi.mock('@/lib/email/service', () => ({ sendEmail: mocks.sendEmail }))

// ─── Helpers ──────────────────────────────────────────────────────────────────

import { GET } from '../route'

function makeRequest(secret: string | null) {
  const headers: Record<string, string> = {}
  if (secret !== null) headers['authorization'] = `Bearer ${secret}`
  return new Request('http://localhost/api/cron/leases', { headers }) as Parameters<typeof GET>[0]
}

const BASE_TENANCY = {
  id: 'ten-1',
  propertyId: 'prop-1',
  userId: 'user-1',
  cycle: 'monthly',
  cycleUnit: 'MONTHLY' as const,
  cyclePayment: '500.00',
  contractDate: new Date('2024-01-01'),
  contractUrl: null,
  startDate: new Date('2024-01-01'),
  endDate: null,
  depositAmount: null,
  leaseStatus: 'ACTIVE' as const,
  nextPaymentDue: null,
  user: { id: 'user-1', email: 'jane@test.com', fullName: 'Jane Doe' },
  property: { code: 'PROP-001' },
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/cron/leases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CRON_SECRET', 'test-secret')
    mocks.sendEmail.mockResolvedValue({ ok: true, messageId: 'x' })
    mocks.update.mockResolvedValue({})
  })

  it('returns 500 when CRON_SECRET env var is absent', async () => {
    vi.stubEnv('CRON_SECRET', '')
    const res = await GET(makeRequest('test-secret'))
    expect(res.status).toBe(500)
  })

  it('returns 401 when authorization header is missing', async () => {
    const res = await GET(makeRequest(null) as Parameters<typeof GET>[0])
    expect(res.status).toBe(401)
  })

  it('returns 401 when authorization secret is wrong', async () => {
    const res = await GET(makeRequest('wrong') as Parameters<typeof GET>[0])
    expect(res.status).toBe(401)
  })

  it('returns 200 with no tenancies processed when DB is empty', async () => {
    mocks.findMany.mockResolvedValue([])
    const res = await GET(makeRequest('test-secret'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.processed).toBe(0)
  })

  it('advances nextPaymentDue when current due is in the past', async () => {
    const pastDue = new Date('2026-03-01')
    mocks.findMany.mockResolvedValue([
      { ...BASE_TENANCY, nextPaymentDue: pastDue, leaseStatus: 'ACTIVE' },
    ])
    await GET(makeRequest('test-secret'))
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ nextPaymentDue: expect.any(Date) }),
      }),
    )
  })

  it('flips ACTIVE → ENDING_SOON when endDate is within 14 days', async () => {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 10)
    mocks.findMany.mockResolvedValue([
      { ...BASE_TENANCY, endDate, leaseStatus: 'ACTIVE' },
    ])
    await GET(makeRequest('test-secret'))
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ leaseStatus: 'ENDING_SOON' }),
      }),
    )
  })

  it('emails resident when lease enters ENDING_SOON', async () => {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 10)
    mocks.findMany.mockResolvedValue([
      { ...BASE_TENANCY, endDate, leaseStatus: 'ACTIVE' },
    ])
    const res = await GET(makeRequest('test-secret'))
    const body = await res.json()
    expect(body.endingSoonEmailed).toBe(1)
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'jane@test.com' }),
    )
  })

  it('flips ENDING_SOON → EXPIRED when endDate is today or past; does not send email', async () => {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 1) // yesterday → EXPIRED
    mocks.findMany.mockResolvedValue([
      { ...BASE_TENANCY, endDate, leaseStatus: 'ENDING_SOON' },
    ])
    await GET(makeRequest('test-secret'))
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ leaseStatus: 'EXPIRED' }),
      }),
    )
    expect(mocks.sendEmail).not.toHaveBeenCalled()
  })
})
