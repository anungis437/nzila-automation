/**
 * CFO — Generate Report Form (Client Component).
 */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import { generateReport } from '@/lib/actions/report-actions'

interface Props {
  reportType: string
}

const currentYear = new Date().getFullYear()
const quarterOptions = [
  `Q1 ${currentYear}`,
  `Q2 ${currentYear}`,
  `Q3 ${currentYear}`,
  `Q4 ${currentYear}`,
  `FY ${currentYear}`,
  `FY ${currentYear - 1}`,
]

export function GenerateReportForm({ reportType }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [period, setPeriod] = useState(quarterOptions[0])
  const [includeNarrative, setIncludeNarrative] = useState(true)
  const [narrative, setNarrative] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await generateReport({
        type: reportType as 'pnl',
        period,
        includeNarrative,
      })

      if (result.success) {
        setSuccess(true)
        if (result.narrative) setNarrative(result.narrative)
        setTimeout(() => router.push('../reports'), 3000)
      } else {
        setError('Failed to generate report. Please try again.')
      }
    })
  }

  if (success) {
    return (
      <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <p className="font-poppins font-semibold text-foreground">Report Generated</p>
        </div>
        {narrative && (
          <div className="rounded-lg border border-border bg-white p-4 text-sm text-foreground">
            <p className="mb-2 flex items-center gap-1 text-xs font-medium text-electric">
              <Sparkles className="h-3 w-3" /> AI Narrative
            </p>
            {narrative}
          </div>
        )}
        <p className="text-sm text-muted-foreground">Redirecting to reports…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div>
        <label htmlFor="period" className="mb-1.5 block text-sm font-medium text-foreground">
          Reporting Period
        </label>
        <select
          id="period"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
        >
          {quarterOptions.map((q) => (
            <option key={q} value={q}>{q}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIncludeNarrative(!includeNarrative)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            includeNarrative ? 'bg-electric' : 'bg-secondary'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              includeNarrative ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <div>
          <p className="text-sm font-medium text-foreground">Include AI Narrative</p>
          <p className="text-xs text-muted-foreground">
            Generate an executive summary powered by LedgerIQ
          </p>
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
            Generating…
          </span>
        ) : (
          'Generate Report'
        )}
      </button>
    </form>
  )
}
