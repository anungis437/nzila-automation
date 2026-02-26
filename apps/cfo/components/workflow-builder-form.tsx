/**
 * CFO — Workflow Builder Form (Client Component).
 *
 * Create workflow templates with steps, triggers, and roles.
 */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, CheckCircle2, GripVertical } from 'lucide-react'
import { createWorkflowTemplate, type WorkflowStep } from '@/lib/actions/workflow-actions'

const triggers = [
  { value: 'report_created', label: 'Report Created' },
  { value: 'alert_triggered', label: 'Alert Triggered' },
  { value: 'document_uploaded', label: 'Document Uploaded' },
  { value: 'client_onboarded', label: 'Client Onboarded' },
  { value: 'manual', label: 'Manual' },
] as const

const roles = ['accountant', 'manager', 'partner', 'client'] as const
const actionTypes = ['review', 'approve', 'edit', 'sign', 'notify'] as const

const emptyStep: WorkflowStep = {
  name: '',
  assigneeRole: 'accountant',
  actionType: 'review',
  dueHours: 24,
}

export function WorkflowBuilderForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [trigger, setTrigger] = useState<(typeof triggers)[number]['value']>('manual')
  const [steps, setSteps] = useState<WorkflowStep[]>([{ ...emptyStep }])

  function addStep() {
    setSteps((s) => [...s, { ...emptyStep }])
  }

  function removeStep(i: number) {
    setSteps((s) => s.filter((_, idx) => idx !== i))
  }

  function updateStep(i: number, patch: Partial<WorkflowStep>) {
    setSteps((s) => s.map((step, idx) => (idx === i ? { ...step, ...patch } : step)))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) { setError('Workflow name is required.'); return }
    if (steps.length === 0) { setError('At least one step is required.'); return }
    if (steps.some((s) => !s.name.trim())) { setError('All steps must have a name.'); return }

    startTransition(async () => {
      const result = await createWorkflowTemplate({ name: name.trim(), description, trigger, steps })
      if (result.success) {
        setSuccess(true)
        setTimeout(() => router.push('../workflows'), 1200)
      } else {
        setError('Failed to create workflow.')
      }
    })
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 py-12 text-center">
        <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500" />
        <p className="font-poppins text-lg font-semibold text-foreground">Workflow created</p>
        <p className="mt-1 text-sm text-muted-foreground">Redirecting to workflows list…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
        <div>
          <label htmlFor="wf-name" className="mb-1.5 block text-sm font-medium text-foreground">Workflow Name *</label>
          <input
            id="wf-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Financial Report Approval"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
          />
        </div>

        <div>
          <label htmlFor="wf-desc" className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
          <textarea
            id="wf-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
          />
        </div>

        <div>
          <label htmlFor="wf-trigger" className="mb-1.5 block text-sm font-medium text-foreground">Trigger</label>
          <select
            id="wf-trigger"
            value={trigger}
            onChange={(e) => setTrigger(e.target.value as typeof trigger)}
            className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
          >
            {triggers.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-poppins text-sm font-semibold text-foreground">Steps</h3>
          <button
            type="button"
            onClick={addStep}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
          >
            <Plus className="h-3 w-3" /> Add Step
          </button>
        </div>

        {steps.map((step, i) => (
          <div key={i} className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            <GripVertical className="mt-2 h-4 w-4 shrink-0 text-muted-foreground/40" />
            <div className="flex-1 grid gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Step Name *</label>
                <input
                  value={step.name}
                  onChange={(e) => updateStep(i, { name: e.target.value })}
                  placeholder={`Step ${i + 1}`}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Role</label>
                <select
                  value={step.assigneeRole}
                  onChange={(e) => updateStep(i, { assigneeRole: e.target.value as WorkflowStep['assigneeRole'] })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
                >
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Action</label>
                <select
                  value={step.actionType}
                  onChange={(e) => updateStep(i, { actionType: e.target.value as WorkflowStep['actionType'] })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
                >
                  {actionTypes.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Due (hours)</label>
                <input
                  type="number"
                  min={1}
                  value={step.dueHours}
                  onChange={(e) => updateStep(i, { dueHours: Number(e.target.value) })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
                />
              </div>
            </div>
            {steps.length > 1 && (
              <button
                type="button"
                onClick={() => removeStep(i)}
                className="mt-5 shrink-0 rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-electric px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-electric/90 disabled:opacity-50"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? 'Creating…' : 'Create Workflow'}
      </button>
    </form>
  )
}
