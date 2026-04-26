'use client'

import { useState } from 'react'
import Image from 'next/image'
import { User, Camera } from 'lucide-react'
import { UploadButton } from '@/lib/uploadthing'
import { toast } from 'sonner'
import { updateProfilePhotoAction } from '@/app/(resident)/_actions/profile'

interface ProfilePhotoUploadProps {
  currentUrl: string | null
  fullName: string
}

export function ProfilePhotoUpload({ currentUrl, fullName }: ProfilePhotoUploadProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentUrl)

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
          <Camera size={13} className="text-white" />
        </div>
      </div>

      <UploadButton
        endpoint="proofOfPayment"
        onClientUploadComplete={(res) => {
          const url = res[0]?.ufsUrl ?? res[0]?.url
          if (url) {
            setPhotoUrl(url)
            updateProfilePhotoAction(url).catch(() => {
              toast.error('Failed to save photo')
            })
            toast.success('Profile photo updated')
          }
        }}
        onUploadError={(error) => {
          toast.error(`Upload failed: ${error.message}`)
        }}
        appearance={{
          button: 'font-body text-xs bg-transparent text-karis-green-700 hover:text-karis-green-900 underline underline-offset-2 ut-readying:opacity-50',
          allowedContent: 'hidden',
        }}
      />
    </div>
  )
}
