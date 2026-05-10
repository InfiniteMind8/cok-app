'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { adminSettlementsApi, getBrowserApi } from '@/lib/api'
import { Prisma } from '@prisma/client'

interface ApprovedSettlement {
  id: string
  amount: Prisma.Decimal
  userId: string
  userName: string
  memberId: string
  approvedAt: Date | null
}

interface ExecuteSettlementSheetProps {
  settlements: ApprovedSettlement[]
}

export function ExecuteSettlementSheet({ settlements }: ExecuteSettlementSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string>('')
  const [proofUrl, setProofUrl] = useState('')
  const [isPending, startTransition] = useTransition()

  const selected = settlements.find((s) => s.id === selectedId)

  function handleExecute() {
    if (!selectedId) {
      toast.error('Select a settlement to execute')
      return
    }
    startTransition(async () => {
      try {
        await adminSettlementsApi.execute(getBrowserApi(), selectedId, proofUrl || undefined)
        toast.success('Settlement executed — wallet debited')
        setSelectedId('')
        setProofUrl('')
        setOpen(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to execute settlement')
      }
    })
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={settlements.length === 0}
        className="font-body text-sm gap-2"
      >
        <CheckSquare size={16} />
        Execute settlement
        {settlements.length > 0 && (
          <span className="ml-1 bg-karis-gold-500/20 text-karis-green-900 text-xs rounded px-1.5 py-0.5 tabular-nums">
            {settlements.length}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-heading text-karis-green-900">Execute settlement</SheetTitle>
            <SheetDescription className="font-body text-sm text-karis-stone-500">
              Select an approved settlement, confirm fiat was paid out, then record execution.
              The member&apos;s wallet will be debited automatically.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5">
            {/* Settlement selector */}
            <div className="space-y-2">
              <Label className="text-xs font-body text-karis-stone-500">Approved settlements</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {settlements.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                    className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                      selectedId === s.id
                        ? 'border-karis-green-500 bg-karis-green-50'
                        : 'border-karis-stone-100 bg-white hover:border-karis-stone-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-body text-karis-stone-900">{s.userName}</p>
                        <p className="text-xs font-body text-karis-stone-500">{s.memberId}</p>
                      </div>
                      <p className="text-sm font-body text-karis-gold-700 tabular-nums font-medium">
                        K {new Prisma.Decimal(s.amount).toFixed(2)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selected && (
              <div className="bg-karis-stone-50 rounded-lg px-4 py-3 text-sm font-body space-y-1">
                <p className="text-karis-stone-500 text-xs uppercase tracking-wider">Selected</p>
                <p className="text-karis-stone-900">
                  {selected.userName} —{' '}
                  <span className="text-karis-gold-700 tabular-nums font-medium">
                    K {new Prisma.Decimal(selected.amount).toFixed(2)}
                  </span>
                </p>
              </div>
            )}

            {/* Proof URL */}
            <div className="space-y-1.5">
              <Label className="text-xs font-body text-karis-stone-500">
                Proof of fiat payout URL (optional)
              </Label>
              <Input
                type="url"
                placeholder="https://…"
                className="font-body text-sm"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 font-body text-sm"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 font-body text-sm"
                onClick={handleExecute}
                disabled={isPending || !selectedId}
              >
                {isPending ? 'Executing…' : 'Execute & debit wallet'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
