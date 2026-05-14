'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { UploadCloud, AlertCircle } from 'lucide-react'
import { adminImportsApi, getBrowserApi } from '@/lib/api'

interface UploadFormProps {
  maxRows: number
}

export function UploadForm({ maxRows }: UploadFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setFileName(file?.name ?? null)
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

    startTransition(async () => {
      try {
        const res = await adminImportsApi.parseMembers(getBrowserApi(), file)
        router.push(`/admin/imports/members/${res.sessionId}`)
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
        htmlFor="file-upload"
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
          id="file-upload"
          name="file"
          type="file"
          accept=".xlsx"
          className="sr-only"
          onChange={handleFileChange}
        />
      </label>

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
