/**
 * CFO — Create Task Form (Client Component).
 */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { createTask, type Task } from '@/lib/actions/misc-actions'

const priorities: Task['priority'][] = ['low', 'medium', 'high', 'urgent']

export function CreateTaskForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const fd = new FormData(e.currentTarget)
    const title = fd.get('title') as string
    const priority = fd.get('priority') as Task['priority']
    const dueDate = fd.get('dueDate') as string

    if (!title.trim()) {
      setError('Task title is required.')
      return
    }

    startTransition(async () => {
      const result = await createTask({
        title: title.trim(),
        priority: priority || 'medium',
        dueDate: dueDate || undefined,
      })

      if (result.success) {
        setSuccess(true)
        setTimeout(() => router.push('../tasks'), 1200)
      } else {
        setError('Failed to create task.')
      }
    })
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 py-12 text-center">
        <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500" />
        <p className="font-poppins text-lg font-semibold text-foreground">Task created</p>
        <p className="mt-1 text-sm text-muted-foreground">Redirecting to tasks list…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-foreground">
          Task Title *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="e.g. Reconcile Q3 bank statements"
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="priority" className="mb-1.5 block text-sm font-medium text-foreground">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue="medium"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
          >
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dueDate" className="mb-1.5 block text-sm font-medium text-foreground">
            Due Date
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-electric px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-electric/90 disabled:opacity-50"
      >
        {isPending ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating…
          </span>
        ) : (
          'Create Task'
        )}
      </button>
    </form>
  )
}
