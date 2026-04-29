'use client'

import { useRef, useState } from 'react'
import { X, FileText, Image, Video, Paperclip, UploadCloud, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface UploadedFile {
  key: string   // storageKey (structured path)
  url: string   // same as key — used by server actions as storageKey
  name: string
  size: number
  type: string
}

export interface UploadEndpointConfig {
  entityType: string   // e.g. 'PROPERTY', 'USER', 'ISSUE', 'LEASE', 'VOUCHER_REQUEST'
  entityId?: string    // optional — omit for new-entity forms
  fieldName: string    // e.g. 'photos', 'titleDeed', 'idScan'
  category?: string    // e.g. 'photo', 'title_deed', 'id_document'
}

interface FileUploadProps {
  endpoint: UploadEndpointConfig
  label: string
  value?: UploadedFile[]
  onComplete: (files: UploadedFile[]) => void
  onRemove?: (key: string) => void
  maxFiles?: number
  accept?: string
  className?: string
}

function fileIcon(type: string) {
  if (type.startsWith('image/')) return <Image size={14} className="shrink-0" />
  if (type.startsWith('video/')) return <Video size={14} className="shrink-0" />
  if (type === 'application/pdf') return <FileText size={14} className="shrink-0" />
  return <Paperclip size={14} className="shrink-0" />
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUpload({
  endpoint,
  label,
  value = [],
  onComplete,
  onRemove,
  maxFiles,
  accept,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  async function uploadFiles(fileList: FileList) {
    if (!fileList.length) return
    setUploadError(null)
    setUploading(true)

    const results: UploadedFile[] = []

    for (const file of Array.from(fileList)) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityType', endpoint.entityType)
      formData.append('entityId', endpoint.entityId ?? '')
      formData.append('fieldName', endpoint.fieldName)
      formData.append('category', endpoint.category ?? '')

      try {
        const res = await fetch('/api/attachments/upload', {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'Upload failed' }))
          setUploadError((body as { error?: string }).error ?? 'Upload failed')
          break
        }
        const data = (await res.json()) as {
          storageKey: string
          name: string
          size: number
          type: string
        }
        results.push({
          key: data.storageKey,
          url: data.storageKey,
          name: data.name,
          size: data.size,
          type: data.type,
        })
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Upload failed')
        break
      }
    }

    setUploading(false)
    if (results.length > 0) {
      onComplete(results)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) void uploadFiles(e.target.files)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) void uploadFiles(e.dataTransfer.files)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs font-body text-karis-stone-500">{label}</p>

      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((f) => (
            <li
              key={f.key}
              className="flex items-center gap-2 bg-karis-stone-50 border border-karis-stone-100 rounded-md px-3 py-2"
            >
              <span className="text-karis-stone-400">{fileIcon(f.type)}</span>
              <span className="flex-1 truncate font-body text-xs text-karis-stone-900">{f.name}</span>
              <span className="font-body text-xs text-karis-stone-400 shrink-0">{formatBytes(f.size)}</span>
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(f.key)}
                  className="ml-1 text-karis-stone-400 hover:text-status-red transition-colors"
                  aria-label={`Remove ${f.name}`}
                >
                  <X size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        aria-label={label}
        accept={accept}
        multiple={!maxFiles || maxFiles > 1}
        onChange={handleInputChange}
        disabled={uploading}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'w-full flex flex-col items-center justify-center gap-2 px-4 py-5',
          'border border-dashed rounded-lg transition-colors cursor-pointer',
          dragOver
            ? 'border-karis-green-900 bg-karis-green-900/5'
            : 'border-karis-stone-200 bg-karis-stone-50 hover:bg-karis-stone-100',
          uploading && 'pointer-events-none opacity-60',
        )}
      >
        {uploading ? (
          <Loader2 size={20} className="text-karis-stone-400 animate-spin" />
        ) : (
          <UploadCloud size={20} className="text-karis-stone-300" />
        )}
        <span className="font-body text-xs text-karis-stone-500">
          {uploading ? 'Uploading…' : 'Drop files here or click to browse'}
        </span>
      </button>

      {uploadError && (
        <p className="text-xs font-body text-status-red">{uploadError}</p>
      )}
    </div>
  )
}
