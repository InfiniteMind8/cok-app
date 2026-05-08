import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  userUpdateMany: vi.fn(),
  userCreate: vi.fn(),
  walletCreate: vi.fn(),
  webhookEventFindUnique: vi.fn(),
  webhookEventCreate: vi.fn(),
  webhookEventDelete: vi.fn(),
  transaction: vi.fn(),
  generateUniqueMemberId: vi.fn(),
  verify: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
      updateMany: mocks.userUpdateMany,
      create: mocks.userCreate,
    },
    wallet: {
      create: mocks.walletCreate,
    },
    webhookEvent: {
      findUnique: mocks.webhookEventFindUnique,
      create: mocks.webhookEventCreate,
      delete: mocks.webhookEventDelete,
    },
    $transaction: mocks.transaction,
  },
}))

vi.mock('@/lib/member-id', () => ({
  generateUniqueMemberId: mocks.generateUniqueMemberId,
}))

vi.mock('svix', () => ({
  // Regular function so `new Webhook(...)` works in the route
  Webhook: vi.fn(function () {
    return { verify: mocks.verify }
  }),
}))

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

import { POST } from '../route'

function makeHeaders(overrides: Record<string, string | null> = {}) {
  const base: Record<string, string> = {
    'svix-id': 'msg_test123',
    'svix-timestamp': '1234567890',
    'svix-signature': 'v1,abc123',
  }
  const result: Record<string, string> = {}
  for (const [k, v] of Object.entries({ ...base, ...overrides })) {
    if (v !== null) result[k] = v
  }
  return result
}

function makeRequest(
  body: unknown = {},
  headerOverrides: Record<string, string | null> = {},
) {
  const hdrs = makeHeaders(headerOverrides)
  return new Request('http://localhost/api/webhooks/clerk', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: hdrs,
  })
}

const USER_CREATED_EVENT = {
  type: 'user.created',
  data: {
    id: 'user_clerk_abc',
    email_addresses: [{ email_address: 'alice@test.com', id: 'ea_1' }],
    primary_email_address_id: 'ea_1',
    first_name: 'Alice',
    last_name: 'Smith',
    image_url: 'https://img.clerk.com/alice.jpg',
  },
}

const USER_UPDATED_EVENT = {
  type: 'user.updated',
  data: {
    id: 'user_clerk_abc',
    email_addresses: [{ email_address: 'alice.new@test.com', id: 'ea_1' }],
    primary_email_address_id: 'ea_1',
    first_name: 'Alice',
    last_name: 'Updated',
    image_url: null,
  },
}

const USER_DELETED_EVENT = {
  type: 'user.deleted',
  data: { id: 'user_clerk_abc', deleted: true },
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/webhooks/clerk', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_WEBHOOK_SECRET', 'whsec_test')
    mocks.webhookEventFindUnique.mockResolvedValue(null) // not yet processed
    mocks.webhookEventCreate.mockResolvedValue({})
    mocks.webhookEventDelete.mockResolvedValue({})
    mocks.verify.mockReturnValue(USER_CREATED_EVENT)
    mocks.generateUniqueMemberId.mockResolvedValue('KM-0001')
    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        user: { create: mocks.userCreate },
        wallet: { create: mocks.walletCreate },
      }
      return fn(tx)
    })
    mocks.userCreate.mockResolvedValue({ id: 'db_user_1' })
    mocks.walletCreate.mockResolvedValue({})
    mocks.userFindUnique.mockResolvedValue(null) // new user by default
    mocks.userUpdate.mockResolvedValue({})
    mocks.userUpdateMany.mockResolvedValue({ count: 1 })
  })

  it('user.created — new user creates User, Wallet, and WebhookEvent', async () => {
    mocks.verify.mockReturnValue(USER_CREATED_EVENT)
    const res = await POST(makeRequest(USER_CREATED_EVENT))
    expect(res.status).toBe(200)
    expect(mocks.transaction).toHaveBeenCalled()
    expect(mocks.userCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ clerkId: 'user_clerk_abc', email: 'alice@test.com' }),
      }),
    )
    expect(mocks.walletCreate).toHaveBeenCalled()
    expect(mocks.webhookEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id: 'msg_test123',
          source: 'clerk',
          type: 'user.created',
          signatureValid: true,
          processedAt: expect.any(Date),
        }),
      }),
    )
  })

  it('user.created — admin pre-created email upserts clerkId and creates WebhookEvent', async () => {
    mocks.verify.mockReturnValue(USER_CREATED_EVENT)
    mocks.userFindUnique.mockResolvedValue({ id: 'db_user_1', profilePhotoUrl: null })
    const res = await POST(makeRequest(USER_CREATED_EVENT))
    expect(res.status).toBe(200)
    expect(mocks.transaction).not.toHaveBeenCalled()
    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'alice@test.com' },
        data: expect.objectContaining({ clerkId: 'user_clerk_abc' }),
      }),
    )
    expect(mocks.webhookEventCreate).toHaveBeenCalled()
  })

  it('user.updated — syncs email, name, photo and creates WebhookEvent', async () => {
    mocks.verify.mockReturnValue(USER_UPDATED_EVENT)
    const res = await POST(makeRequest(USER_UPDATED_EVENT))
    expect(res.status).toBe(200)
    expect(mocks.userUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clerkId: 'user_clerk_abc' },
        data: expect.objectContaining({
          email: 'alice.new@test.com',
          fullName: 'Alice Updated',
        }),
      }),
    )
    expect(mocks.webhookEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'user.updated', processedAt: expect.any(Date) }),
      }),
    )
  })

  it('user.deleted — soft-deletes User and creates WebhookEvent', async () => {
    mocks.verify.mockReturnValue(USER_DELETED_EVENT)
    const res = await POST(makeRequest(USER_DELETED_EVENT))
    expect(res.status).toBe(200)
    expect(mocks.userUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clerkId: 'user_clerk_abc' },
        data: expect.objectContaining({
          deactivatedAt: expect.any(Date),
          deactivationReason: 'clerk_deleted',
        }),
      }),
    )
    expect(mocks.webhookEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'user.deleted', processedAt: expect.any(Date) }),
      }),
    )
  })

  it('replay of same svix-id returns 200 without touching User table', async () => {
    mocks.webhookEventCreate.mockRejectedValue({ code: 'P2002' })
    mocks.verify.mockReturnValue(USER_CREATED_EVENT)
    const res = await POST(makeRequest(USER_CREATED_EVENT))
    expect(res.status).toBe(200)
    expect(mocks.userFindUnique).not.toHaveBeenCalled()
    expect(mocks.userCreate).not.toHaveBeenCalled()
    expect(mocks.webhookEventCreate).toHaveBeenCalledTimes(1)
  })

  it('concurrent delivery of same svix-id runs side effects once', async () => {
    mocks.verify.mockReturnValue(USER_CREATED_EVENT)
    mocks.webhookEventCreate
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce({ code: 'P2002' })

    const [first, second] = await Promise.all([
      POST(makeRequest(USER_CREATED_EVENT)),
      POST(makeRequest(USER_CREATED_EVENT)),
    ])
    const bodies = await Promise.all([first.text(), second.text()])

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(bodies.sort()).toEqual(['Already processed', 'OK'].sort())
    expect(mocks.webhookEventCreate).toHaveBeenCalledTimes(2)
    expect(mocks.transaction).toHaveBeenCalledTimes(1)
    expect(mocks.userCreate).toHaveBeenCalledTimes(1)
    expect(mocks.walletCreate).toHaveBeenCalledTimes(1)
    expect(mocks.userUpdate).not.toHaveBeenCalled()
    expect(mocks.userUpdateMany).not.toHaveBeenCalled()
  })

  it('bad signature returns 401', async () => {
    mocks.verify.mockImplementation(() => { throw new Error('Signature mismatch') })
    const res = await POST(makeRequest(USER_CREATED_EVENT))
    expect(res.status).toBe(401)
    expect(mocks.webhookEventCreate).not.toHaveBeenCalled()
  })

  it('missing svix headers returns 401', async () => {
    const res = await POST(
      makeRequest(USER_CREATED_EVENT, { 'svix-id': null }),
    )
    expect(res.status).toBe(401)
    expect(mocks.verify).not.toHaveBeenCalled()
  })

  it('missing all svix headers returns 401', async () => {
    const res = await POST(
      makeRequest(USER_CREATED_EVENT, {
        'svix-id': null,
        'svix-timestamp': null,
        'svix-signature': null,
      }),
    )
    expect(res.status).toBe(401)
    expect(mocks.verify).not.toHaveBeenCalled()
  })
})
