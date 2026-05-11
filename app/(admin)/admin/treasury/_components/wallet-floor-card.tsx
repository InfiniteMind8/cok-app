'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Prisma } from '@/lib/prisma-shim'
import { AlertTriangle, ShieldAlert, Shield } from 'lucide-react'
import { adminTreasuryApi, getBrowserApi, type MoneyString } from '@/lib/api'

const SYSTEM_KEY_LABELS: Record<string, string> = {
  treasury_reserve: 'Treasury Reserve',
  community_fund: 'Community Fund',
  operations_fund: 'Operations Fund',
  developer_share: 'Developer Share',
  settlement_burn: 'Settlement Burn',
  fiat_settlement: 'Fiat Settlement',
  promotions: 'Promotions',
}

function fmt(d: MoneyString): string {
  return `K ${new Prisma.Decimal(d).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

type FloorStatus = 'at-floor' | 'near-floor' | 'healthy' | 'unlimited'

function getFloorStatus(
  balance: MoneyString,
  floor: MoneyString | null,
  headroom: MoneyString | null,
): FloorStatus {
  if (floor === null || headroom === null) return 'unlimited'
  const b = new Prisma.Decimal(balance)
  const h = new Prisma.Decimal(headroom)
  if (h.lte(0)) return 'at-floor'
  if (b.gt(0) && h.div(b).lt(0.10)) return 'near-floor'
  return 'healthy'
}

interface Props {
  walletId: string
  walletKey: string
  balance: MoneyString
  floor: MoneyString | null
  headroom: MoneyString | null
}

export function WalletFloorCard({ walletId, walletKey, balance, floor, headroom }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [floorInput, setFloorInput] = useState(floor !== null ? new Prisma.Decimal(floor).toFixed(2) : '')
  const [unlimited, setUnlimited] = useState(floor === null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const status = getFloorStatus(balance, floor, headroom)
  const label = SYSTEM_KEY_LABELS[walletKey] ?? walletKey

  function handleSave() {
    setError(null)
    startTransition(async () => {
      try {
        await adminTreasuryApi.setWalletFloor(
          getBrowserApi(),
          walletId,
          unlimited ? null : floorInput || '0',
        )
        setEditing(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update floor.')
      }
    })
  }

  return (
    <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm p-5 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-heading text-sm text-karis-green-900">{label}</p>
          <p className="font-mono text-xs text-karis-stone-400 mt-0.5">{walletKey}</p>
        </div>
        {status === 'at-floor' && (
          <ShieldAlert size={18} className="text-red-500 shrink-0" />
        )}
        {status === 'near-floor' && (
          <AlertTriangle size={18} className="text-amber-500 shrink-0" />
        )}
        {(status === 'healthy' || status === 'unlimited') && (
          <Shield size={18} className="text-karis-green-400 shrink-0" />
        )}
      </div>

      {/* Balance / floor / headroom stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="font-body text-xs text-karis-stone-400 uppercase tracking-wider mb-0.5">Balance</p>
          <p className="font-body text-sm font-medium text-karis-stone-900 tabular-nums">{fmt(balance)}</p>
        </div>
        <div>
          <p className="font-body text-xs text-karis-stone-400 uppercase tracking-wider mb-0.5">Floor</p>
          <p className="font-body text-sm font-medium text-karis-stone-900 tabular-nums">
            {floor !== null ? fmt(floor) : <span className="text-karis-stone-400 italic">None</span>}
          </p>
        </div>
        <div>
          <p className="font-body text-xs text-karis-stone-400 uppercase tracking-wider mb-0.5">Headroom</p>
          <p className={`font-body text-sm font-medium tabular-nums ${
            headroom === null ? 'text-karis-stone-400' :
            new Prisma.Decimal(headroom).lte(0) ? 'text-red-600' : 'text-karis-stone-900'
          }`}>
            {headroom !== null ? fmt(headroom) : <span className="italic">—</span>}
          </p>
        </div>
      </div>

      {/* Status banner */}
      {status === 'at-floor' && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 flex items-start gap-2">
          <ShieldAlert size={14} className="text-red-500 mt-0.5 shrink-0" />
          <p className="font-body text-xs text-red-700">
            This wallet is at its floor. New transfers from it are blocked until topped up or the floor is adjusted.
          </p>
        </div>
      )}
      {status === 'near-floor' && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 flex items-start gap-2">
          <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="font-body text-xs text-amber-700">
            Low headroom — within 10% of the configured floor. Top up or adjust the floor before it runs out.
          </p>
        </div>
      )}

      {/* Inline floor editor */}
      {!editing ? (
        <button
          onClick={() => setEditing(true)}
          className="self-start text-xs font-body text-karis-green-700 hover:text-karis-green-900 underline underline-offset-2"
        >
          Adjust floor
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 font-body text-xs text-karis-stone-600">
            <input
              type="checkbox"
              checked={unlimited}
              onChange={(e) => setUnlimited(e.target.checked)}
              className="rounded border-karis-stone-300"
            />
            Unlimited (no floor)
          </label>
          {!unlimited && (
            <input
              type="number"
              min="0"
              step="0.01"
              value={floorInput}
              onChange={(e) => setFloorInput(e.target.value)}
              placeholder="Floor amount in KCRD"
              className="w-full rounded-lg border border-karis-stone-200 px-3 py-1.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-karis-green-300"
            />
          )}
          {error && <p className="font-body text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-3 py-1.5 bg-karis-green-700 text-white font-body text-xs rounded-lg hover:bg-karis-green-800 disabled:opacity-50"
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => { setEditing(false); setError(null) }}
              disabled={isPending}
              className="px-3 py-1.5 border border-karis-stone-200 font-body text-xs rounded-lg hover:bg-karis-stone-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
