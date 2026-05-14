import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { adminImportsApi, ApiClientError } from '@/lib/api'
import { getServerApi } from '@/lib/api/server'
import { PageHeader } from '@/components/admin/page-header'
import { PreviewTable } from './_components/preview-table'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ sessionId: string }>
}

export default async function PropertyImportPreviewPage({ params }: Props) {
  const { sessionId } = await params
  await requireRole(['MASTER_ADMIN'])

  let session
  try {
    session = await adminImportsApi.getSession(getServerApi(), sessionId)
  } catch (err) {
    if (err instanceof ApiClientError && err.code === 'NOT_FOUND') notFound()
    throw err
  }
  if (session.type !== 'properties') notFound()

  const isCompleted = session.status !== 'UPLOADED'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Property Import Preview"
        subtitle={`${session.fileName} · ${session.totalRows} rows · ${session.validCount} valid · ${session.warningCount} warnings · ${session.errorCount} errors`}
      />

      {isCompleted ? (
        <div className="rounded-xl border bg-card p-6 space-y-3">
          <p className="font-medium">
            This import session is <strong>{session.status.toLowerCase()}</strong>.
          </p>
          {session.status === 'COMMITTED' && (
            <p className="text-sm text-muted-foreground">
              {session.committedCount} propert{session.committedCount !== 1 ? 'ies' : 'y'} created ·{' '}
              {session.skippedCount} skipped due to errors.
            </p>
          )}
          <Link href="/admin/imports/properties" className="text-sm text-primary hover:underline">
            ← Start a new import
          </Link>
        </div>
      ) : (
        <PreviewTable
          session={{
            id: session.id,
            fileName: session.fileName,
            totalRows: session.totalRows,
            validCount: session.validCount,
            warningCount: session.warningCount,
            errorCount: session.errorCount,
          }}
          rows={session.rows}
        />
      )}
    </div>
  )
}
