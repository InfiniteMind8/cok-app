import { PageHeader } from '@/components/admin/page-header'
import { UploadForm } from './_components/upload-form'
import { parseAndStoreImportAction } from '@/app/(admin)/_actions/imports'

const MAX_IMPORT_ROWS = parseInt(process.env.IMPORT_MAX_ROWS ?? '1000', 10)

export default function MemberImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Members"
        subtitle="Upload an .xlsx file to bulk-create resident accounts."
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <UploadForm action={parseAndStoreImportAction} maxRows={MAX_IMPORT_ROWS} />
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Before you start</p>
          <ul className="space-y-2 list-disc list-inside">
            <li>Download the template and fill it in exactly as formatted.</li>
            <li>
              File limit: <strong>{MAX_IMPORT_ROWS.toLocaleString()} rows</strong> per upload.
            </li>
            <li>Dates: YYYY-MM-DD, MM/DD/YYYY, or DD-MM-YYYY.</li>
            <li>
              Phone: E.164 format preferred (e.g. <code>+1 868 555 0100</code>).
            </li>
            <li>
              <code>vehicle_plates</code>: comma-separated if multiple.
            </li>
            <li>Gender: MALE · FEMALE · OTHER · PREFER_NOT_TO_SAY</li>
          </ul>
          <a
            href="/admin/imports/members/template"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            download
          >
            ↓ Download template
          </a>
        </div>
      </div>
    </div>
  )
}
