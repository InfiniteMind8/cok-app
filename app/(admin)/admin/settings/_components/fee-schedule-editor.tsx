'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { Settings2, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { applyFeeScheduleAction } from '@/app/(admin)/_actions/settings'
import type { FeeScheduleHistoryRow } from '@/app/(admin)/_actions/settings'
import type { FeeScheduleRules } from '@/lib/ledger/types'
import type { FeeRuleEntry } from '@/lib/ledger/types'

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  PURCHASE: 'Purchase',
  TRANSFER: 'Transfer',
  BARTER: 'Barter',
  PAYROLL: 'Payroll',
  DEPOSIT: 'Deposit',
  RESIDENT_SETTLEMENT: 'Resident Settlement',
  VENDOR_SETTLEMENT: 'Vendor Settlement',
  VISITOR_SETTLEMENT: 'Visitor Settlement',
  TREASURY_ADJUSTMENT: 'Treasury Adjustment',
  FEE_SPLIT: 'Fee Split',
  REVERSAL: 'Reversal',
}

interface FeeRowState {
  totalPct: string
  communityFundPct: string
  operationsFundPct: string
  developerSharePct: string
}

function ruleToState(rule: FeeRuleEntry): FeeRowState {
  return {
    totalPct: String(rule.totalPct),
    communityFundPct: String(rule.communityFundPct),
    operationsFundPct: String(rule.operationsFundPct),
    developerSharePct: String(rule.developerSharePct),
  }
}

function stateToRule(state: FeeRowState): FeeRuleEntry {
  return {
    totalPct: parseFloat(state.totalPct) || 0,
    communityFundPct: parseFloat(state.communityFundPct) || 0,
    operationsFundPct: parseFloat(state.operationsFundPct) || 0,
    developerSharePct: parseFloat(state.developerSharePct) || 0,
  }
}

interface Props {
  initialRules: FeeScheduleRules
  history: FeeScheduleHistoryRow[]
}

export function FeeScheduleEditor({ initialRules, history }: Props) {
  const [rows, setRows] = useState<Record<string, FeeRowState>>(() => {
    const result: Record<string, FeeRowState> = {}
    for (const [type, rule] of Object.entries(initialRules)) {
      result[type] = ruleToState(rule as FeeRuleEntry)
    }
    return result
  })

  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)

  function updateField(type: string, field: keyof FeeRowState, value: string) {
    setRows((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }))
    setFeedback(null)
  }

  function handleApply() {
    const rules: FeeScheduleRules = {}
    for (const [type, state] of Object.entries(rows)) {
      rules[type as keyof FeeScheduleRules] = stateToRule(state)
    }

    startTransition(async () => {
      const result = await applyFeeScheduleAction({
        rules,
        effectiveFrom: new Date(),
      })
      if (result.success) {
        setFeedback({ success: true, message: 'Fee schedule updated and active.' })
      } else {
        setFeedback({ success: false, message: result.error })
      }
    })
  }

  const types = Object.keys(rows)

  return (
    <div className="space-y-6">
      {/* ── Editor ── */}
      <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-karis-stone-50 border-b border-karis-stone-100 flex items-center gap-2">
          <Settings2 size={14} className="text-karis-stone-500" />
          <span className="font-body text-xs font-medium text-karis-stone-700">Edit fee schedule</span>
          <span className="ml-auto font-body text-xs text-karis-stone-400">Changes take effect immediately on save</span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-karis-stone-50">
                <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500 min-w-[180px]">Transaction Type</TableHead>
                <TableHead className="px-4 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right w-28">Total %</TableHead>
                <TableHead className="px-4 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right w-36">Community Fund %</TableHead>
                <TableHead className="px-4 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right w-32">Operations %</TableHead>
                <TableHead className="px-4 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right w-32">Developer %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map((type) => {
                const state = rows[type]
                const total = parseFloat(state.totalPct) || 0
                const parts =
                  (parseFloat(state.communityFundPct) || 0) +
                  (parseFloat(state.operationsFundPct) || 0) +
                  (parseFloat(state.developerSharePct) || 0)
                const partsOk = Math.abs(parts - total) <= 0.01
                return (
                  <TableRow key={type} className={partsOk ? undefined : 'bg-red-50/40'}>
                    <TableCell className="px-5 font-body text-sm text-karis-stone-900 whitespace-nowrap">
                      {TRANSACTION_TYPE_LABELS[type] ?? type}
                    </TableCell>
                    {(['totalPct', 'communityFundPct', 'operationsFundPct', 'developerSharePct'] as (keyof FeeRowState)[]).map((field) => (
                      <TableCell key={field} className="px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Label htmlFor={`${type}-${field}`} className="sr-only">
                            {field} for {type}
                          </Label>
                          <Input
                            id={`${type}-${field}`}
                            type="number"
                            min={0}
                            max={100}
                            step={0.01}
                            value={state[field]}
                            onChange={(e) => updateField(type, field, e.target.value)}
                            className="w-20 h-8 text-right font-body text-sm tabular-nums px-2"
                          />
                          <span className="font-body text-xs text-karis-stone-400">%</span>
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div className="px-5 py-3 border-t border-karis-stone-100 bg-karis-stone-50 flex items-center gap-3">
          {feedback && (
            <div className={`flex items-center gap-1.5 font-body text-xs ${feedback.success ? 'text-status-green' : 'text-red-600'}`}>
              {feedback.success
                ? <CheckCircle2 size={13} />
                : <AlertCircle size={13} />}
              {feedback.message}
            </div>
          )}
          <Button
            type="button"
            onClick={handleApply}
            disabled={isPending}
            size="sm"
            className="ml-auto font-body text-xs bg-karis-green-900 text-karis-gold-100 hover:bg-karis-green-800 h-8 px-4"
          >
            {isPending ? 'Applying…' : 'Apply changes'}
          </Button>
        </div>
      </div>

      {/* ── History ── */}
      {history.length > 1 && (
        <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className="w-full px-5 py-3 bg-karis-stone-50 border-b border-karis-stone-100 flex items-center gap-2 text-left hover:bg-karis-stone-100 transition-colors"
          >
            {historyOpen ? <ChevronDown size={14} className="text-karis-stone-500" /> : <ChevronRight size={14} className="text-karis-stone-500" />}
            <Clock size={14} className="text-karis-stone-500" />
            <span className="font-body text-xs font-medium text-karis-stone-700">
              Fee schedule history ({history.length} versions)
            </span>
          </button>

          {historyOpen && (
            <Table>
              <TableHeader>
                <TableRow className="bg-karis-stone-50">
                  <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Effective from</TableHead>
                  <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Effective to</TableHead>
                  <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Set by</TableHead>
                  <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="px-5 font-body text-sm text-karis-stone-700 tabular-nums">
                      {format(row.effectiveAt, 'dd MMM yyyy · HH:mm')}
                    </TableCell>
                    <TableCell className="px-5 font-body text-sm text-karis-stone-500 tabular-nums">
                      {row.effectiveTo
                        ? format(row.effectiveTo, 'dd MMM yyyy · HH:mm')
                        : '—'}
                    </TableCell>
                    <TableCell className="px-5 font-body text-sm text-karis-stone-700">
                      {row.createdBy}
                    </TableCell>
                    <TableCell className="px-5">
                      {row.isActive ? (
                        <Badge variant="secondary" className="font-body text-xs bg-status-green/15 text-status-green">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="font-body text-xs bg-karis-stone-100 text-karis-stone-500">
                          Superseded
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  )
}
