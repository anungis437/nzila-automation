'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[nacp-exams] dashboard error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-navy mb-2">Something went wrong</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-md">
        An error occurred loading the dashboard. This has been logged automatically.
      </p>
      <button
        onClick={reset}
        className="bg-electric text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-electric/90 transition"
      >
        Try Again
      </button>
    </div>
  )
}
