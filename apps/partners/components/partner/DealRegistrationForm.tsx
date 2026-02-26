'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { createDeal } from '@/lib/actions/deal-actions'

const verticals = [
  'Financial Services',
  'Healthcare',
  'Education',
  'Government',
  'Technology',
  'Energy',
  'Real Estate',
  'Retail',
  'Transportation',
  'Other',
]

export function DealRegistrationForm() {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      setError('')
      const result = await createDeal({
        accountName: fd.get('accountName') as string,
        contactName: fd.get('contactName') as string,
        contactEmail: fd.get('contactEmail') as string,
        vertical: fd.get('vertical') as string,
        estimatedArr: Number(fd.get('estimatedArr') ?? 0),
        expectedCloseDate: fd.get('expectedClose') as string,
        notes: (fd.get('notes') as string) || undefined,
      })

      if (result.success) {
        setSuccess(true)
      } else {
        setError('Failed to register deal. Please try again.')
      }
    })
  }

  if (success) {
    return (
      <div className="max-w-2xl text-center py-16">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-slate-900">Deal Submitted!</h2>
        <p className="text-sm text-slate-500 mt-2">
          Your deal has been submitted for review. You&apos;ll receive 90-day pipeline protection once approved.
        </p>
        <Link
          href="/portal/deals"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          View Pipeline
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/portal/deals"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Deals
      </Link>

      <h1 className="text-2xl font-bold text-slate-900">Register a New Deal</h1>
      <p className="mt-1 text-sm text-slate-500 mb-8">
        Submit deal details for Nzila team review. Approved deals are protected for 90 days.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Name</label>
          <input name="accountName" type="text" required placeholder="e.g. Acme Corporation"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Primary Contact</label>
          <input name="contactName" type="text" required placeholder="Full name"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Email</label>
          <input name="contactEmail" type="email" required placeholder="contact@company.com"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Vertical</label>
          <select name="vertical" required
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            aria-label="Select vertical">
            <option value="">Select a vertical…</option>
            {verticals.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Estimated Annual Revenue (ARR)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
            <input name="estimatedArr" type="number" required min={0} placeholder="0"
              className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Expected Close Date</label>
          <input name="expectedClose" type="date" required aria-label="Expected close date"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
          <textarea name="notes" rows={4} placeholder="Additional context about this opportunity…"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={isPending}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm disabled:opacity-50">
            {isPending ? 'Submitting…' : 'Submit for Review'}
          </button>
          <Link href="/portal/deals"
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
