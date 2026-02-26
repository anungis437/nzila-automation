/**
 * CFO — Acknowledge Alert Button (Client Component).
 */
'use client'

import { useTransition } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { acknowledgeAlert } from '@/lib/actions/misc-actions'

export function AcknowledgeAlertButton({ alertId }: { alertId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      onClick={() => startTransition(async () => { await acknowledgeAlert(alertId) })}
      disabled={isPending}
      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50"
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
      Acknowledge
    </button>
  )
}
