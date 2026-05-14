'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { User, Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { attachmentsApi, meApi, getBrowserApi } from '@/lib/api'

interface ProfilePhotoUploadProps {
  currentUrl: string | null
  fullName: string
}

export function ProfilePhotoUpload({ currentUrl, fullName }: ProfilePhotoUploadProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentUrl)
  const [uploading, setUploading] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setUploading(true)
    try {
      const api = getBrowserApi()
      const upload = await attachmentsApi.upload(api, file, {
        entityType: 'USER',
        fieldName: 'profilePhoto',
        category: 'profile_photo',
      })
      const result = await meApi.uploadProfilePhoto(api, upload.storageKey)
      setPhotoUrl(result.signedUrl)
      toast.success('Profile photo updated')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-2 border-karis-stone-100 bg-karis-stone-100 overflow-hidden">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={fullName}
              width={96}
              height={96}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={36} strokeWidth={1.25} className="text-karis-stone-400" />
            </div>
          )}
        </div>
        <div className="absolute bottom-0 right-0 w-7 h-7 bg-karis-green-900 rounded-full flex items-center justify-center border-2 border-white">
          {uploading ? (
            <Loader2 size={11} className="text-white animate-spin" />
          ) : (
            <Camera size={13} className="text-white" />
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        aria-label="Upload profile photo"
        className="sr-only"
        accept="image/*"
        onChange={handleChange}
        disabled={uploading}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="font-body text-xs bg-transparent text-karis-green-700 hover:text-karis-green-900 underline underline-offset-2 disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : 'Change photo'}
      </button>
    </div>
  )
}
