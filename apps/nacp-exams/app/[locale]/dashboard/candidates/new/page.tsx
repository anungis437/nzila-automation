'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@nzila/ui'
import { registerCandidate } from '@/lib/actions/candidate-actions'

export default function NewCandidatePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ candidateNumber: string } | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await registerCandidate({
        firstName: fd.get('firstName') as string,
        lastName: fd.get('lastName') as string,
        email: fd.get('email') as string,
        dateOfBirth: fd.get('dateOfBirth') as string,
        sessionId: fd.get('sessionId') as string,
      })

      if (!res.success) {
        setError('Failed to register candidate. Check all fields.')
        return
      }
      setResult({ candidateNumber: res.candidateNumber! })
    })
  }

  if (result) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-navy">Candidate Registered</h2>
        <p className="text-gray-500 mt-2">
          Candidate number: <span className="font-mono font-bold text-navy">{result.candidateNumber}</span>
        </p>
        <button
          onClick={() => router.push('../candidates')}
          className="mt-4 bg-electric text-white px-4 py-2 rounded-lg text-sm hover:bg-electric/90 transition"
        >
          View All Candidates
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-navy mb-6">Register Candidate</h1>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                name="firstName"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-electric focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                name="lastName"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-electric focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-electric focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                name="dateOfBirth"
                type="date"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-electric focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session ID</label>
              <input
                name="sessionId"
                required
                placeholder="e.g. session-uuid"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-electric focus:border-transparent"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="bg-electric text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-electric/90 transition disabled:opacity-50"
            >
              {isPending ? 'Registering…' : 'Register Candidate'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
