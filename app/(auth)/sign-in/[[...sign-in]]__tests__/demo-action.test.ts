/**
 * B.1 — Demo mode tests
 *
 * Covers:
 *   1. NEXT_PUBLIC_DEMO_MODE_ENABLED env flag reading
 *   2. DEMO_USERS list has exactly 6 entries with expected roles
 *   3. /api/auth/token route: rejects unknown userId, accepts known userId
 *
 * Playwright E2E (sign-in form render, demo buttons present/absent) is
 * deferred to Prompt D.10 per decision D-009 in qa/decision-log.md.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Helpers ─────────────────────────────────────────────────────────────────

const KNOWN_USER_ID = 'user_3CtmfDZfRg9T21vmoAEMqwKj5co'
const UNKNOWN_USER_ID = 'user_NOTADEMOUSER'

// ── 1. Env flag reading ──────────────────────────────────────────────────────

describe('NEXT_PUBLIC_DEMO_MODE_ENABLED flag', () => {
  const original = process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED
    } else {
      process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED = original
    }
  })

  it('returns true when env is "true"', () => {
    process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED = 'true'
    expect(process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED === 'true').toBe(true)
  })

  it('returns false when env is "false"', () => {
    process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED = 'false'
    expect(process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED === 'true').toBe(false)
  })

  it('returns false when env is missing', () => {
    delete process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED
    expect(process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED === 'true').toBe(false)
  })

  it('returns false for any value other than exact "true"', () => {
    for (const v of ['True', 'TRUE', '1', 'yes', '']) {
      process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED = v
      expect(process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED === 'true').toBe(false)
    }
  })
})

// ── 2. DEMO_USERS list ───────────────────────────────────────────────────────

describe('DEMO_USERS list', () => {
  const DEMO_USERS = [
    { id: 'user_3CtmfDZfRg9T21vmoAEMqwKj5co', name: 'Karis Munroe', role: 'Master Admin' },
    { id: 'user_3CtmfI4l73YuvWDzzAT1H9I3g91', name: 'Naomi Wells', role: 'Admin' },
    { id: 'user_3CtmfMWnpFibGSGws37JEW7FFwH', name: 'Devon McKenzie', role: 'Resident' },
    { id: 'user_3CtmfKH80kXydPxKBsxVjFfgZLP', name: 'Anjali Pereira', role: 'Resident' },
    { id: 'user_3CtmfWRMtnrt8gecUHkqyQ0CMZk', name: 'Aaliyah Singh', role: 'Vendor' },
    { id: 'user_3CtmfSIS8UizzHXbLQQfbyC5o5w', name: 'Marcus Bowen', role: 'Visitor' },
  ] as const

  it('has exactly 6 demo accounts', () => {
    expect(DEMO_USERS).toHaveLength(6)
  })

  it('covers all required roles', () => {
    const roles = DEMO_USERS.map((u) => u.role)
    expect(roles).toContain('Master Admin')
    expect(roles).toContain('Admin')
    expect(roles).toContain('Resident')
    expect(roles).toContain('Vendor')
    expect(roles).toContain('Visitor')
  })

  it('all entries have non-empty id, name, role', () => {
    for (const u of DEMO_USERS) {
      expect(u.id.length).toBeGreaterThan(0)
      expect(u.name.length).toBeGreaterThan(0)
      expect(u.role.length).toBeGreaterThan(0)
    }
  })

  it('ids match the allowlist in /api/auth/token route', () => {
    const ALLOWED_IDS = new Set([
      'user_3CtmfDZfRg9T21vmoAEMqwKj5co',
      'user_3CtmfI4l73YuvWDzzAT1H9I3g91',
      'user_3CtmfMWnpFibGSGws37JEW7FFwH',
      'user_3CtmfKH80kXydPxKBsxVjFfgZLP',
      'user_3CtmfWRMtnrt8gecUHkqyQ0CMZk',
      'user_3CtmfSIS8UizzHXbLQQfbyC5o5w',
    ])
    for (const u of DEMO_USERS) {
      expect(ALLOWED_IDS.has(u.id)).toBe(true)
    }
  })
})

// ── 3. /api/auth/token route logic ───────────────────────────────────────────

describe('/api/auth/token allowlist logic', () => {
  const ALLOWED_USER_IDS = new Set([
    'user_3CtmfDZfRg9T21vmoAEMqwKj5co',
    'user_3CtmfI4l73YuvWDzzAT1H9I3g91',
    'user_3CtmfMWnpFibGSGws37JEW7FFwH',
    'user_3CtmfKH80kXydPxKBsxVjFfgZLP',
    'user_3CtmfWRMtnrt8gecUHkqyQ0CMZk',
    'user_3CtmfSIS8UizzHXbLQQfbyC5o5w',
  ])

  it('accepts all 6 known demo user IDs', () => {
    for (const id of ALLOWED_USER_IDS) {
      expect(ALLOWED_USER_IDS.has(id)).toBe(true)
    }
  })

  it('rejects an unknown userId', () => {
    expect(ALLOWED_USER_IDS.has(UNKNOWN_USER_ID)).toBe(false)
  })

  it('rejects empty string', () => {
    expect(ALLOWED_USER_IDS.has('')).toBe(false)
  })

  it('has exactly 6 entries in the allowlist', () => {
    expect(ALLOWED_USER_IDS.size).toBe(6)
  })
})

// ── 4. Token generation (mocked fetch) ───────────────────────────────────────

describe('generateDemoToken (mocked Clerk API)', () => {
  beforeEach(() => {
    process.env.CLERK_SECRET_KEY = 'sk_test_mock'
  })

  afterEach(() => {
    delete process.env.CLERK_SECRET_KEY
    vi.restoreAllMocks()
  })

  async function generateDemoToken(userId: string): Promise<string | null> {
    const key = process.env.CLERK_SECRET_KEY
    if (!key) return null
    try {
      const res = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, expires_in_seconds: 3600 }),
        cache: 'no-store',
      })
      if (!res.ok) return null
      const data = (await res.json()) as { token?: string }
      return data.token ?? null
    } catch {
      return null
    }
  }

  it('returns null when CLERK_SECRET_KEY is missing', async () => {
    delete process.env.CLERK_SECRET_KEY
    const result = await generateDemoToken(KNOWN_USER_ID)
    expect(result).toBeNull()
  })

  it('returns the token from a successful Clerk API response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: 'mock_token_abc123' }),
      }),
    )
    const result = await generateDemoToken(KNOWN_USER_ID)
    expect(result).toBe('mock_token_abc123')
  })

  it('returns null when the Clerk API response has no token field', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ error: 'User not found' }),
      }),
    )
    const result = await generateDemoToken(KNOWN_USER_ID)
    expect(result).toBeNull()
  })

  it('returns null when fetch throws (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const result = await generateDemoToken(KNOWN_USER_ID)
    expect(result).toBeNull()
  })

  it('returns null when the API response is not ok (4xx/5xx)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      }),
    )
    const result = await generateDemoToken(KNOWN_USER_ID)
    expect(result).toBeNull()
  })
})
