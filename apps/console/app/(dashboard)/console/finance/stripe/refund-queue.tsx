'use client'

import { useState } from 'react'

interface PendingRefund {
  id: string
  refundId: string | null
  amountCents: bigint | string | number
  createdAt: Date
}

export function RefundQueue({
  refunds,
  entityId,
}: {
  refunds: PendingRefund[]
  entityId: string
}) {
  const [processing, setProcessing] = useState<string | null>(null)

  if (refunds.length === 0) {
    return <p className="text-gray-400">No refunds pending approval.</p>
  }

  async function handleAction(refundId: string, action: 'approve' | 'deny') {
    setProcessing(refundId)
    try {
      const res = await fetch('/api/stripe/refunds/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId, refundId, action }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(`Error: ${err.error ?? 'Unknown error'}`)
      } else {
        // Reload to refresh server data
        window.location.reload()
      }
    } finally {
      setProcessing(null)
    }
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-500 border-b">
          <th className="pb-2">Stripe Refund ID</th>
          <th className="pb-2 text-right">Amount</th>
          <th className="pb-2">Requested</th>
          <th className="pb-2 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {refunds.map((r) => (
          <tr key={r.id} className="border-b last:border-0">
            <td className="py-2 font-mono text-xs">{r.refundId ? r.refundId.slice(0, 24) + '...' : '—'}</td>
            <td className="py-2 text-right font-mono">
              {(Number(r.amountCents) / 100).toFixed(2)}
            </td>
            <td className="py-2">
              {new Date(r.createdAt).toLocaleDateString()}
            </td>
            <td className="py-2 text-right space-x-2">
              <button
                disabled={processing === r.id}
                onClick={() => handleAction(r.id, 'approve')}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                disabled={processing === r.id}
                onClick={() => handleAction(r.id, 'deny')}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Deny
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
