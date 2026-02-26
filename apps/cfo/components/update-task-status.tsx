/**
 * CFO — Update Task Status Button (Client Component).
 */
'use client'

import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { updateTaskStatus, type Task } from '@/lib/actions/misc-actions'

const statusOptions: Task['status'][] = ['pending', 'in-progress', 'completed', 'cancelled']

export function UpdateTaskStatusSelect({ taskId, currentStatus }: { taskId: string; currentStatus: string }) {
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as Task['status']
    startTransition(async () => {
      await updateTaskStatus(taskId, newStatus)
    })
  }

  return (
    <div className="flex items-center gap-1">
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-electric/40"
      >
        {statusOptions.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      {isPending && <Loader2 className="h-3 w-3 animate-spin text-electric" />}
    </div>
  )
}
