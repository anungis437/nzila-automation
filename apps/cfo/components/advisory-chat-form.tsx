/**
 * CFO — Advisory AI Chat Form (Client Component).
 *
 * Calls `askAdvisor` server action instead of POSTing to /api/advisory.
 */
'use client'

import { useState, useTransition } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { askAdvisor } from '@/lib/actions/advisory-actions'

export function AdvisoryChatForm() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) return

    setError(null)
    startTransition(async () => {
      try {
        const result = await askAdvisor(question)
        setAnswer(result.answer ?? 'No response generated.')
      } catch {
        setError('Failed to get AI response. Please try again.')
      }
    })
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          name="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What's our projected cash runway for the next 6 months?"
          className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={isPending || !question.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-electric px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-electric/90 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Ask
        </button>
      </form>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {answer && (
        <div className="mt-4 rounded-lg border border-electric/20 bg-electric/5 p-4">
          <p className="mb-1 text-xs font-medium text-electric">LedgerIQ</p>
          <p className="whitespace-pre-wrap text-sm text-foreground">{answer}</p>
        </div>
      )}
    </div>
  )
}
