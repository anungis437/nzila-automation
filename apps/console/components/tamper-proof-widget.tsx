/**
 * TamperProofWidget — Small proof verification status card
 *
 * Displays:
 *  - Last verification timestamp
 *  - Status (pass / fail)
 *
 * Fetches from /api/audit/tamper-status on mount.
 */
'use client'

import { useEffect, useState } from 'react'
import { ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface TamperStatus {
  status: 'pass' | 'fail'
  verifiedAt: string
  entryCount: number
  chainValid: boolean
  error?: string
}

export function TamperProofWidget() {
  const [data, setData] = useState<TamperStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/audit/tamper-status')
      .then((r) => r.json())
      .then((d) => setData(d as TamperStatus))
      .catch(() =>
        setData({ status: 'fail', verifiedAt: new Date().toISOString(), entryCount: 0, chainValid: false, error: 'Fetch failed' }),
      )
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    )
  }

  if (!data) return null

  const isPassing = data.status === 'pass'

  return (
    <div
      className={`border rounded-xl p-5 ${
        isPassing
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        {isPassing ? (
          <ShieldCheckIcon className="h-5 w-5 text-green-600" />
        ) : (
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
        )}
        <p className="text-sm font-semibold text-gray-900">Tamper Verification</p>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            isPassing ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span
          className={`text-sm font-medium ${
            isPassing ? 'text-green-700' : 'text-red-700'
          }`}
        >
          {isPassing ? 'PASS' : 'FAIL'}
        </span>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Last verified:{' '}
        <time dateTime={data.verifiedAt} className="font-mono">
          {new Date(data.verifiedAt).toLocaleString()}
        </time>
      </p>

      {data.error && (
        <p className="text-xs text-red-600 mt-1">{data.error}</p>
      )}
    </div>
  )
}
