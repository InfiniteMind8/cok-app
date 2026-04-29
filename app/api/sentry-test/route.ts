import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireRole } from '@/lib/auth'

export async function GET() {
  const user = await requireRole('MASTER_ADMIN')

  Sentry.setUser({ role: user.role })

  throw new Error(
    `Sentry integration test — triggered by ${user.role} at ${new Date().toISOString()}`
  )

  return NextResponse.json({ ok: true })
}
