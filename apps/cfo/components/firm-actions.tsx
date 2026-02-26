/**
 * CFO — Firm Actions (Client Component).
 *
 * Suspend/reactivate firms and change subscription tier.
 */
'use client'

import { useTransition } from 'react'
import { Loader2, Ban, CheckCircle2 } from 'lucide-react'
import { suspendFirm, reactivateFirm, updateFirmSubscription } from '@/lib/actions/platform-admin-actions'

interface Props {
  firmId: string
  status: string
  tier: string
}

const tiers = ['starter', 'professional', 'enterprise'] as const

export function FirmActions({ firmId, status, tier }: Props) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-2">
      {status === 'active' ? (
        <button
          type="button"
          onClick={() => startTransition(async () => { await suspendFirm(firmId) })}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />}
          Suspend
        </button>
      ) : (
        <button
          type="button"
          onClick={() => startTransition(async () => { await reactivateFirm(firmId) })}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
          Reactivate
        </button>
      )}
      <select
        value={tier}
        onChange={(e) => startTransition(async () => { await updateFirmSubscription(firmId, e.target.value as typeof tiers[number]) })}
        disabled={isPending}
        className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground disabled:opacity-50"
      >
        {tiers.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
    </div>
  )
}
