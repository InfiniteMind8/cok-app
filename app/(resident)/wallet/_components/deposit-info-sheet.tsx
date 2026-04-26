'use client'

import { Info, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

interface DepositInfoSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DepositInfoSheet({ open, onOpenChange }: DepositInfoSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-heading text-karis-green-900">Add K Credits</SheetTitle>
          <SheetDescription className="font-body text-sm text-karis-stone-500">
            How to fund your wallet
          </SheetDescription>
        </SheetHeader>

        <div className="flex gap-3 bg-karis-green-900/5 border border-karis-green-900/10 rounded-xl p-4 mb-6">
          <Info size={18} className="text-karis-green-700 shrink-0 mt-0.5" />
          <p className="font-body text-sm text-karis-stone-900 leading-relaxed">
            To add K Credits, visit the Treasury Office or contact your Admin. Your deposit will
            appear here once recorded.
          </p>
        </div>

        <div className="space-y-3">
          <p className="font-body text-xs text-karis-stone-500 uppercase tracking-widest">
            Contact
          </p>
          <a href="mailto:admin@cityofkaris.com">
            <Button className="w-full bg-karis-green-900 text-white font-body text-sm gap-2 min-h-[44px]">
              <Mail size={16} />
              Contact Admin
            </Button>
          </a>
        </div>

        <p className="font-body text-xs text-karis-stone-400 mt-8 text-center">
          K Credits are issued 1:1 against verified fiat deposits.
        </p>
      </SheetContent>
    </Sheet>
  )
}
