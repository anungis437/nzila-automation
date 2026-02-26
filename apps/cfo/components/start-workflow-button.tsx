/**
 * CFO — Start Workflow Button (Client Component).
 */
'use client'

import { useTransition } from 'react'
import { Loader2, Play } from 'lucide-react'
import { startWorkflowInstance } from '@/lib/actions/workflow-actions'

export function StartWorkflowButton({ templateId }: { templateId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      onClick={() => startTransition(async () => { await startWorkflowInstance(templateId) })}
      disabled={isPending}
      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50"
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
      Run
    </button>
  )
}
