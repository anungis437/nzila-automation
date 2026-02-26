/**
 * CFO — Workflow Step Actions (Client Component).
 *
 * Approve or reject the current workflow step with optional comment.
 */
'use client'

import { useState, useTransition } from 'react'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { approveWorkflowStep, rejectWorkflowStep } from '@/lib/actions/workflow-actions'

export function WorkflowStepActions({ instanceId }: { instanceId: string }) {
  const [isPending, startTransition] = useTransition()
  const [comment, setComment] = useState('')
  const [done, setDone] = useState(false)

  function handleApprove() {
    startTransition(async () => {
      const result = await approveWorkflowStep(instanceId, comment || undefined)
      if (result.success) setDone(true)
    })
  }

  function handleReject() {
    if (!comment.trim()) return
    startTransition(async () => {
      const result = await rejectWorkflowStep(instanceId, comment)
      if (result.success) setDone(true)
    })
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600">
        <CheckCircle2 className="h-4 w-4" /> Action recorded. Refreshing…
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment (required for rejection)…"
        rows={2}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleApprove}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Approve
        </button>
        <button
          type="button"
          onClick={handleReject}
          disabled={isPending || !comment.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          Reject
        </button>
      </div>
    </div>
  )
}
