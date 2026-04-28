'use client'

import { useState } from 'react'
import { UploadDropzone } from '@/lib/uploadthing'
import type { OurFileRouter } from '@/app/api/uploadthing/core'
import { X, FileText, Image, Video, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface UploadedFile {
  key: string
  url: string
  name: string
  size: number
  type: string
}

interface FileUploadProps {
  endpoint: keyof OurFileRouter
  label: string
  value?: UploadedFile[]
  onComplete: (files: UploadedFile[]) => void
  onRemove?: (key: string) => void
  maxFiles?: number
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
  className,
}: FileUploadProps) {
  const [uploadError, setUploadError] = useState<string | null>(null)

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs font-body text-karis-stone-500">{label}</p>

      {/* Existing file list */}
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

      {/* Dropzone */}
      <UploadDropzone
        endpoint={endpoint}
        onClientUploadComplete={(res) => {
          setUploadError(null)
          const files: UploadedFile[] = res.map((r) => ({
            key: r.key,
            url: r.ufsUrl ?? r.url,
            name: r.name,
            size: r.size,
            type: r.type ?? '',
          }))
          onComplete(files)
        }}
        onUploadError={(error) => {
          setUploadError(error.message)
        }}
        appearance={{
          container:
            'border border-dashed border-karis-stone-200 rounded-lg bg-karis-stone-50 hover:bg-karis-stone-100 transition-colors cursor-pointer ut-uploading:pointer-events-none',
          label: 'font-body text-xs text-karis-stone-500',
          allowedContent: 'font-body text-xs text-karis-stone-400',
          uploadIcon: 'text-karis-stone-300',
          button:
            'font-body text-xs bg-karis-green-900 text-white rounded-md px-3 py-1.5 ut-readying:opacity-50 ut-uploading:opacity-75',
        }}
      />

      {uploadError && (
        <p className="text-xs font-body text-status-red">{uploadError}</p>
      )}
    </div>
  )
}
