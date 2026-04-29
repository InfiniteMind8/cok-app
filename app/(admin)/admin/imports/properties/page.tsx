import { PageHeader } from '@/components/admin/page-header'
import { UploadForm } from './_components/upload-form'
import { parseAndStorePropertyImportAction } from '@/app/(admin)/_actions/imports'

export const dynamic = 'force-dynamic'

const MAX_IMPORT_ROWS = parseInt(process.env.IMPORT_MAX_ROWS ?? '1000', 10)

export default function PropertyImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Properties"
        subtitle="Upload an .xlsx file to bulk-create property records."
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <UploadForm action={parseAndStorePropertyImportAction} maxRows={MAX_IMPORT_ROWS} />
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Before you start</p>
          <ul className="space-y-2 list-disc list-inside">
            <li>Download the template and fill it in exactly as formatted.</li>
            <li>
              File limit: <strong>{MAX_IMPORT_ROWS.toLocaleString()} rows</strong> per upload.
            </li>
            <li>
              <code>type</code>: OWNERSHIP · RENTAL · ADMIN
            </li>
            <li>
              <code>status</code>: VACANT · OCCUPIED · UNDER_CONSTRUCTION (default: VACANT)
            </li>
            <li>
              <code>size_sqm</code>, prices: decimal numbers (e.g. 120.5).
            </li>
            <li>
              <code>bedrooms</code>, <code>bathrooms</code>, <code>parking_spots</code>: whole numbers.
            </li>
            <li>
              Companion zip: folder names must match <code>external_ref</code>; subfolders{' '}
              <code>photos/</code>, <code>title-deed/</code>, <code>occupancy-permit/</code>,{' '}
              <code>utility/</code>.
            </li>
          </ul>
          <a
            href="/admin/imports/properties/template"
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
