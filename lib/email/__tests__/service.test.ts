import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mock functions (must use vi.hoisted for Vitest's mock hoisting) ──

const {
  mockEmailLogFindUnique,
  mockEmailLogCreate,
  mockEmailLogUpdate,
  mockEmailLogFindUniqueOrThrow,
  mockResendSend,
} = vi.hoisted(() => ({
  mockEmailLogFindUnique: vi.fn(),
  mockEmailLogCreate: vi.fn(),
  mockEmailLogUpdate: vi.fn(),
  mockEmailLogFindUniqueOrThrow: vi.fn(),
  mockResendSend: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    emailLog: {
      findUnique: mockEmailLogFindUnique,
      create: mockEmailLogCreate,
      update: mockEmailLogUpdate,
      findUniqueOrThrow: mockEmailLogFindUniqueOrThrow,
    },
  },
}))

vi.mock('resend', () => ({
   
  Resend: vi.fn().mockImplementation(function (this: any) {
    this.emails = { send: mockResendSend }
  }),
}))

vi.mock('@/lib/env', () => ({
  env: {
    RESEND_API_KEY: 're_test_key',
    RESEND_FROM_EMAIL: 'noreply@cityofkaris.com',
    RESEND_FROM_NAME: 'City of Karis',
  },
}))

import { sendEmail, resendEmailById } from '../service'

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('sendEmail', () => {
  it('returns ok:false for invalid email address', async () => {
    const result = await sendEmail({
      to: 'not-an-email',
      subject: 'Test',
      template: 'welcome',
      data: { fullName: 'Test', memberId: 'K-001', role: 'RESIDENT', loginUrl: 'http://localhost' },
      idempotencyKey: 'test:1',
    })
    expect(result.ok).toBe(false)
  })

  it('skips send and returns ok:true if idempotency key already SENT', async () => {
    mockEmailLogFindUnique.mockResolvedValue({ status: 'SENT', providerMessageId: 'msg-existing' })

    const result = await sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      template: 'welcome',
      data: { fullName: 'Test', memberId: 'K-001', role: 'RESIDENT', loginUrl: 'http://localhost' },
      idempotencyKey: 'welcome:already-sent',
    })

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.skipped).toBe(true)
    expect(mockResendSend).not.toHaveBeenCalled()
  })

  it('creates EmailLog row and returns ok:true on successful send', async () => {
    mockEmailLogFindUnique.mockResolvedValue(null)
    mockEmailLogCreate.mockResolvedValue({ id: 'log-1', status: 'QUEUED', html: '<html/>' })
    mockEmailLogUpdate.mockResolvedValue({ id: 'log-1', status: 'SENT', providerMessageId: 'msg-123' })
    mockResendSend.mockResolvedValue({ data: { id: 'msg-123' }, error: null })

    const result = await sendEmail({
      to: 'user@example.com',
      subject: 'Welcome',
      template: 'welcome',
      data: { fullName: 'Alice', memberId: 'K-002', role: 'RESIDENT', loginUrl: 'http://localhost' },
      idempotencyKey: 'welcome:user-new',
    })

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.messageId).toBe('msg-123')

    expect(mockEmailLogCreate).toHaveBeenCalledOnce()
    expect(mockEmailLogUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'SENT', providerMessageId: 'msg-123' }),
      }),
    )
  })

  it('creates EmailLog row with status FAILED when Resend returns an error', async () => {
    mockEmailLogFindUnique.mockResolvedValue(null)
    mockEmailLogCreate.mockResolvedValue({ id: 'log-2', status: 'QUEUED', html: '<html/>' })
    mockEmailLogUpdate.mockResolvedValue({ id: 'log-2', status: 'FAILED' })
    mockResendSend.mockResolvedValue({ data: null, error: { message: 'Invalid API key' } })

    const result = await sendEmail({
      to: 'user@example.com',
      subject: 'Welcome',
      template: 'welcome',
      data: { fullName: 'Bob', memberId: 'K-003', role: 'RESIDENT', loginUrl: 'http://localhost' },
      idempotencyKey: 'welcome:user-fail',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('Invalid API key')

    expect(mockEmailLogUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'FAILED', providerError: 'Invalid API key' }),
      }),
    )
  })

  it('does not send duplicate when called twice with same idempotency key', async () => {
    mockEmailLogFindUnique.mockResolvedValueOnce(null)
    mockEmailLogCreate.mockResolvedValue({ id: 'log-3', status: 'QUEUED', html: '<html/>' })
    mockEmailLogUpdate.mockResolvedValue({ id: 'log-3', status: 'SENT', providerMessageId: 'msg-dup' })
    mockResendSend.mockResolvedValue({ data: { id: 'msg-dup' }, error: null })

    await sendEmail({
      to: 'dup@example.com',
      subject: 'Hello',
      template: 'welcome',
      data: { fullName: 'Carol', memberId: 'K-004', role: 'RESIDENT', loginUrl: 'http://localhost' },
      idempotencyKey: 'welcome:dup-key',
    })

    mockEmailLogFindUnique.mockResolvedValueOnce({ status: 'SENT', providerMessageId: 'msg-dup' })

    const result = await sendEmail({
      to: 'dup@example.com',
      subject: 'Hello',
      template: 'welcome',
      data: { fullName: 'Carol', memberId: 'K-004', role: 'RESIDENT', loginUrl: 'http://localhost' },
      idempotencyKey: 'welcome:dup-key',
    })

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.skipped).toBe(true)
    expect(mockResendSend).toHaveBeenCalledTimes(1)
  })
})

describe('resendEmailById', () => {
  it('skips and returns ok:true if log is already SENT', async () => {
    mockEmailLogFindUniqueOrThrow.mockResolvedValue({
      id: 'log-10',
      status: 'SENT',
      providerMessageId: 'msg-x',
      html: '<html/>',
      recipient: 'a@b.com',
      subject: 'Hi',
    })

    const result = await resendEmailById('log-10')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.skipped).toBe(true)
    expect(mockResendSend).not.toHaveBeenCalled()
  })

  it('dispatches email for FAILED log and returns ok:true on success', async () => {
    mockEmailLogFindUniqueOrThrow.mockResolvedValue({
      id: 'log-11',
      status: 'FAILED',
      recipient: 'retry@example.com',
      subject: 'Welcome',
      html: '<html><body>Hello</body></html>',
      providerMessageId: null,
    })
    mockEmailLogUpdate
      .mockResolvedValueOnce({ id: 'log-11', status: 'QUEUED' })
      .mockResolvedValueOnce({ id: 'log-11', status: 'SENT' })
    mockResendSend.mockResolvedValue({ data: { id: 'msg-retry' }, error: null })

    const result = await resendEmailById('log-11')
    expect(result.ok).toBe(true)
    expect(mockResendSend).toHaveBeenCalledOnce()
  })
})
