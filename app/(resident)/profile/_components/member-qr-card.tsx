'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X } from 'lucide-react'

interface MemberQrCardProps {
  memberId: string
}

export function MemberQrCard({ memberId }: MemberQrCardProps) {
  const [fullscreen, setFullscreen] = useState(false)

  return (
    <>
      <button
        onClick={() => setFullscreen(true)}
        className="w-full bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-6 flex flex-col items-center gap-4 hover:shadow-md transition-shadow duration-150 min-h-[44px]"
      >
        <div className="p-3 bg-white border border-karis-stone-100 rounded-xl">
          <QRCodeSVG
            value={memberId}
            size={160}
            bgColor="#ffffff"
            fgColor="#1E2E23"
            level="M"
          />
        </div>
        <div className="text-center">
          <p className="font-body text-xs text-karis-stone-500 tabular-nums tracking-widest">
            {memberId}
          </p>
          <p className="font-body text-xs text-karis-stone-400 mt-1">
            Show this code at the gate or to vendors.
          </p>
          <p className="font-body text-[10px] text-karis-green-700 mt-2">Tap to expand</p>
        </div>
      </button>

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center"
          onClick={() => setFullscreen(false)}
        >
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-6 right-6 text-karis-stone-500 hover:text-karis-stone-900 transition-colors duration-150 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={24} />
          </button>

          <div className="p-6 bg-white border border-karis-stone-100 rounded-2xl shadow-md">
            <QRCodeSVG
              value={memberId}
              size={260}
              bgColor="#ffffff"
              fgColor="#1E2E23"
              level="M"
            />
          </div>

          <div className="mt-6 text-center">
            <p className="font-heading text-xl text-karis-green-900">{memberId}</p>
            <p className="font-body text-sm text-karis-stone-500 mt-1">
              Show this code at the gate or to vendors.
            </p>
          </div>

          <p className="font-body text-xs text-karis-stone-400 mt-8">Tap anywhere to dismiss</p>
        </div>
      )}
    </>
  )
}
