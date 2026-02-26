/**
 * CFO — Create Client Form (Client Component).
 */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/actions/client-actions'

export function CreateClientForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const contactEmail = formData.get('contactEmail') as string

    if (!name.trim()) {
      setError('Client name is required.')
      return
    }

    startTransition(async () => {
      const result = await createClient({
        name: name.trim(),
        contactEmail: contactEmail?.trim() || undefined,
      })

      if (result.ok) {
        setSuccess(true)
        setTimeout(() => router.push('../clients'), 1200)
      } else {
        setError(result.error ?? 'Failed to create client.')
      }
    })
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 py-12 text-center">
        <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500" />
        <p className="font-poppins text-lg font-semibold text-foreground">
          Client created
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Redirecting to clients list…
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground">
          Client Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. Acme Corp"
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
        />
      </div>

      <div>
        <label htmlFor="contactEmail" className="mb-1.5 block text-sm font-medium text-foreground">
          Contact Email
        </label>
        <input
          id="contactEmail"
          name="contactEmail"
          type="email"
          placeholder="contact@example.com"
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
        />
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
          'Create Client'
        )}
      </button>
    </form>
  )
}
