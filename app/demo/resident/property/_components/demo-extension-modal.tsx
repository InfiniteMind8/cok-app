'use client'

import { useState } from 'react'
import { CalendarClock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DemoLockedFormShell } from '@/app/demo/_components/demo-locked'

interface DemoExtensionModalProps {
  open: boolean
  onClose: () => void
}

export function DemoExtensionModal({ open, onClose }: DemoExtensionModalProps) {
  const [requestedEndDate, setRequestedEndDate] = useState('2027-04-30')
  const [reason, setReason] = useState('')

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-labelledby="demo-extension-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-20 sm:pb-0"
    >
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-karis-green-900/40 backdrop-blur-sm"
      />
      <div className="relative w-full sm:max-w-md bg-white border border-karis-stone-100 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-start justify-between px-6 pt-6 pb-3">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-9 h-9 rounded-full bg-karis-gold-100 flex items-center justify-center">
              <CalendarClock size={16} className="text-karis-gold-700" aria-hidden="true" />
            </div>
            <div>
              <h2 id="demo-extension-title" className="font-heading text-lg text-karis-green-900 leading-tight">
                Request tenancy extension
              </h2>
              <p className="font-body text-xs text-karis-stone-500 mt-0.5">
                Subject to Admin approval. Current end date: 31 Jan 2027.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-karis-stone-500 hover:text-karis-green-900 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <DemoLockedFormShell className="px-6 pb-6 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="demo-new-end-date" className="text-xs font-body text-karis-stone-500">
              Requested new end date
            </Label>
            <Input
              id="demo-new-end-date"
              type="date"
              value={requestedEndDate}
              onChange={(e) => setRequestedEndDate(e.target.value)}
              className="font-body text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="demo-extension-reason" className="text-xs font-body text-karis-stone-500">
              Reason (optional)
            </Label>
            <Textarea
              id="demo-extension-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Construction on the family property is running 3 months late…"
              className="font-body text-sm resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 font-body text-sm min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-karis-green-900 text-white font-body text-sm min-h-[44px]"
            >
              Submit request
            </Button>
          </div>
        </DemoLockedFormShell>
      </div>
    </div>
  )
}
