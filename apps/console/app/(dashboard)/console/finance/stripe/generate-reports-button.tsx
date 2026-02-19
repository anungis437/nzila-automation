'use client'

import { useState } from 'react'

export function GenerateReportsButton({ entityId }: { entityId: string }) {
  const [loading, setLoading] = useState(false)
  const [month, setMonth] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  async function handleGenerate() {
    setLoading(true)
    try {
      const [year, mon] = month.split('-').map(Number)
      const startDate = new Date(Date.UTC(year, mon - 1, 1)).toISOString()
      const endDate = new Date(Date.UTC(year, mon, 0, 23, 59, 59)).toISOString()

      const res = await fetch('/api/stripe/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId, startDate, endDate }),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(`Error: ${err.error ?? 'Unknown error'}`)
      } else {
        const data = await res.json()
        alert(`Generated ${data.count} reports successfully.`)
        window.location.reload()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <input
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="border rounded px-3 py-1.5 text-sm"
      />
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate Reports'}
      </button>
    </div>
  )
}
