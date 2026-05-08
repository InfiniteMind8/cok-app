import { type NextRequest } from 'next/server'

const ALLOWED_USER_IDS = new Set([
  'user_3CtmfDZfRg9T21vmoAEMqwKj5co', // Karis Munroe — Master Admin
  'user_3CtmfI4l73YuvWDzzAT1H9I3g91', // Naomi Wells — Admin
  'user_3CtmfMWnpFibGSGws37JEW7FFwH', // Devon McKenzie — Resident
  'user_3CtmfKH80kXydPxKBsxVjFfgZLP', // Anjali Pereira — Resident
  'user_3CtmfWRMtnrt8gecUHkqyQ0CMZk', // Aaliyah Singh — Vendor
  'user_3CtmfSIS8UizzHXbLQQfbyC5o5w', // Marcus Bowen — Visitor
])

export async function POST(req: NextRequest) {
  const { userId } = await req.json()

  if (!userId || !ALLOWED_USER_IDS.has(userId)) {
    return Response.json({ error: 'Not a demo account' }, { status: 403 })
  }

  const key = process.env.CLERK_SECRET_KEY
  if (!key) return Response.json({ error: 'Server misconfiguration' }, { status: 500 })

  const res = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, expires_in_seconds: 300 }),
  })
  const data = await res.json()

  if (!data.token) {
    return Response.json({ error: 'Token generation failed' }, { status: 500 })
  }

  return Response.json({ token: data.token })
}
