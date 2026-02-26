/**
 * CFO — Settings Form (Client Component).
 *
 * Editable settings with optimistic save.
 */
'use client'

import { useState, useTransition } from 'react'
import { Loader2, Save, CheckCircle2 } from 'lucide-react'
import { updateSettings, type CFOSettings } from '@/lib/actions/misc-actions'

interface Props {
  initial: CFOSettings
}

const scheduleOptions = ['daily', 'weekly', 'monthly', 'on-demand'] as const

export function SettingsForm({ initial }: Props) {
  const [state, setState] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSave() {
    setError(null)
    setSaved(false)

    startTransition(async () => {
      const result = await updateSettings(state)
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else {
        setError('Failed to save settings.')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Currency */}
      <SettingsRow label="Currency" description="Default currency for reports and ledger">
        <input
          value={state.currency}
          onChange={(e) => setState({ ...state, currency: e.target.value.toUpperCase() })}
          className="w-24 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
        />
      </SettingsRow>

      {/* Fiscal Year Start */}
      <SettingsRow label="Fiscal Year Start" description="Month when your fiscal year begins">
        <select
          value={state.fiscalYearStart}
          onChange={(e) => setState({ ...state, fiscalYearStart: Number(e.target.value) })}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2024, i).toLocaleString('en', { month: 'long' })}
            </option>
          ))}
        </select>
      </SettingsRow>

      {/* Timezone */}
      <SettingsRow label="Timezone" description="Timezone for report scheduling and deadlines">
        <input
          value={state.timezone}
          onChange={(e) => setState({ ...state, timezone: e.target.value })}
          className="w-52 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
        />
      </SettingsRow>

      {/* Report Schedule */}
      <SettingsRow label="Report Schedule" description="Automatic report generation frequency">
        <select
          value={state.reportSchedule}
          onChange={(e) =>
            setState({ ...state, reportSchedule: e.target.value as CFOSettings['reportSchedule'] })
          }
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
        >
          {scheduleOptions.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </SettingsRow>

      {/* AI Advisory */}
      <SettingsRow label="AI Advisory" description="Enable AI-powered financial advisory">
        <button
          type="button"
          onClick={() => setState({ ...state, aiAdvisoryEnabled: !state.aiAdvisoryEnabled })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            state.aiAdvisoryEnabled ? 'bg-electric' : 'bg-secondary'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              state.aiAdvisoryEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </SettingsRow>

      {/* Auto Reconcile */}
      <SettingsRow label="Auto Reconcile" description="Automatically reconcile transactions daily">
        <button
          type="button"
          onClick={() => setState({ ...state, autoReconcile: !state.autoReconcile })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            state.autoReconcile ? 'bg-electric' : 'bg-secondary'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              state.autoReconcile ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </SettingsRow>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-electric px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-electric/90 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isPending ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
        </button>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </div>
  )
}

/* ─── Helper ─── */

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}
