import { NextRequest, NextResponse } from 'next/server'
import { runAndSaveReconciliation } from '@/lib/ledger/reconciliation-report'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const report = await runAndSaveReconciliation()

  return NextResponse.json({
    ok: true,
    status: report.status,
    reportId: report.id,
    discrepancy: report.details.discrepancy,
  })
}
