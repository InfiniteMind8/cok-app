'use client'

import { useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { UploadCloud, AlertCircle, ChevronDown } from 'lucide-react'

interface UploadFormProps {
  action: (formData: FormData) => Promise<void>
  maxRows: number
}

export function UploadForm({ action, maxRows }: UploadFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [zipFileName, setZipFileName] = useState<string | null>(null)
  const [showZip, setShowZip] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const zipRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setFileName(file?.name ?? null)
    setError(null)
  }

  function handleZipChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setZipFileName(file?.name ?? null)
    setError(null)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const data = new FormData(form)
    const file = data.get('file') as File | null
    if (!file || file.size === 0) {
      setError('Please select an .xlsx file.')
      return
    }
    if (!file.name.endsWith('.xlsx')) {
      setError('Only .xlsx files are accepted.')
      return
    }

    const zipFile = data.get('zipFile') as File | null
    if (showZip && zipFile && zipFile.size > 0 && !zipFile.name.endsWith('.zip')) {
      setError('Companion file must be a .zip archive.')
      return
    }

    startTransition(async () => {
      try {
        await action(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 space-y-5">
      <div className="space-y-1">
        <p className="text-sm font-medium">Upload spreadsheet</p>
        <p className="text-xs text-muted-foreground">Max {maxRows.toLocaleString()} rows · .xlsx only</p>
      </div>

      <label
        htmlFor="prop-file-upload"
        className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-8 cursor-pointer hover:border-primary/60 transition-colors"
      >
        <UploadCloud className="h-8 w-8 text-muted-foreground" />
        {fileName ? (
          <span className="text-sm font-medium">{fileName}</span>
        ) : (
          <span className="text-sm text-muted-foreground">Click to choose file or drag & drop</span>
        )}
        <input
          ref={inputRef}
          id="prop-file-upload"
          name="file"
          type="file"
          accept=".xlsx"
          className="sr-only"
          onChange={handleFileChange}
        />
      </label>

      {/* Companion zip toggle */}
      <div>
        <button
          type="button"
          onClick={() => {
            setShowZip((v) => !v)
            setZipFileName(null)
            if (zipRef.current) zipRef.current.value = ''
          }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showZip ? 'rotate-180' : ''}`}
          />
          Include attachments zip (optional)
        </button>

        {showZip && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              Zip top-level folders must match the <code>external_ref</code> column.
              Subfolders: <code>photos/</code>, <code>title-deed/</code>,{' '}
              <code>occupancy-permit/</code>, <code>utility/</code>. Max 50 MB.
            </p>
            <label
              htmlFor="prop-zip-upload"
              className="flex items-center gap-3 rounded-lg border-2 border-dashed border-border p-4 cursor-pointer hover:border-primary/60 transition-colors"
            >
              <UploadCloud className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">
                {zipFileName ?? 'Choose .zip file'}
              </span>
              <input
                ref={zipRef}
                id="prop-zip-upload"
                name="zipFile"
                type="file"
                accept=".zip"
                className="sr-only"
                onChange={handleZipChange}
              />
            </label>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" disabled={isPending || !fileName} className="w-full">
        {isPending ? 'Parsing…' : 'Upload & Preview'}
      </Button>
    </form>
  )
}
