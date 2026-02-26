/**
 * CFO — Document Upload Form (Client Component).
 */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, Upload } from 'lucide-react'
import { uploadDocument, type Document } from '@/lib/actions/misc-actions'

const documentTypes: Document['type'][] = ['invoice', 'receipt', 'contract', 'report', 'statement', 'other']

export function DocumentUploadForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const fd = new FormData(e.currentTarget)
    const name = fd.get('name') as string
    const type = fd.get('type') as Document['type']

    if (!name.trim()) {
      setError('Document name is required.')
      return
    }

    startTransition(async () => {
      const result = await uploadDocument({
        name: name.trim(),
        type: type || 'other',
      })

      if (result.success) {
        setSuccess(true)
        setTimeout(() => router.push('../documents'), 1200)
      } else {
        setError('Failed to upload document.')
      }
    })
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 py-12 text-center">
        <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500" />
        <p className="font-poppins text-lg font-semibold text-foreground">Document uploaded</p>
        <p className="mt-1 text-sm text-muted-foreground">Redirecting to documents…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground">Document Name *</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. Q3 Bank Statement"
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
        />
      </div>

      <div>
        <label htmlFor="type" className="mb-1.5 block text-sm font-medium text-foreground">Document Type</label>
        <select
          id="type"
          name="type"
          className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
        >
          {documentTypes.map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Drop zone placeholder */}
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-12 text-center">
        <Upload className="mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Drag & drop files here, or click to browse</p>
        <p className="mt-1 text-xs text-muted-foreground">Direct file upload coming soon — metadata saved to audit log</p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-electric px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-electric/90 disabled:opacity-50"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? 'Uploading…' : 'Upload Document'}
      </button>
    </form>
  )
}
