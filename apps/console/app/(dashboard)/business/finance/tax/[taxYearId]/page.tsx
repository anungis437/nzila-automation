'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
  DocumentArrowUpIcon,
  BanknotesIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

interface TaxYearDetail {
  taxYear: {
    id: string
    entityId: string
    fiscalYearLabel: string
    startDate: string
    endDate: string
    federalFilingDeadline: string
    federalPaymentDeadline: string
    provincialFilingDeadline: string | null
    provincialPaymentDeadline: string | null
    status: string
  }
  filings: Array<{
    id: string
    filingType: string
    filedDate: string | null
    preparedBy: string
    reviewedBy: string | null
    sha256: string | null
  }>
  installments: Array<{
    id: string
    dueDate: string
    requiredAmount: string
    paidAmount: string | null
    status: string
  }>
  notices: Array<{
    id: string
    authority: string
    noticeType: string
    receivedDate: string
    sha256: string | null
  }>
  closeGate: {
    canClose: boolean
    blockers: string[]
    warnings: string[]
    artifacts: {
      t2Filed: boolean
      co17Filed: boolean
      co17Required: boolean
      allIndirectPeriodsFiled: boolean
      noaUploaded: boolean
    }
  }
  deadlines: Array<{
    label: string
    dueDate: string
    daysRemaining: number
    urgency: 'green' | 'yellow' | 'red'
    type: string
  }>
  profile: {
    provinceOfRegistration: string | null
  } | null
}

function urgencyIcon(urgency: 'green' | 'yellow' | 'red') {
  switch (urgency) {
    case 'red': return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
    case 'yellow': return <ClockIcon className="h-4 w-4 text-amber-500" />
    case 'green': return <CheckCircleIcon className="h-4 w-4 text-green-500" />
  }
}

function GateItem({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <CheckCircleIcon className="h-4 w-4 text-green-500" />
      ) : (
        <XCircleIcon className="h-4 w-4 text-red-400" />
      )}
      <span className={met ? 'text-gray-700' : 'text-red-600 font-medium'}>{label}</span>
    </div>
  )
}

export default function TaxYearDetailPage({
  params,
}: {
  params: Promise<{ taxYearId: string }>
}) {
  const { taxYearId } = use(params)
  const [data, setData] = useState<TaxYearDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/finance/tax/years/${taxYearId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [taxYearId])

  if (loading) {
    return <div className="p-8"><p className="text-gray-400 text-sm">Loading tax year...</p></div>
  }
  if (!data) {
    return <div className="p-8"><p className="text-red-500">Tax year not found.</p></div>
  }

  const { taxYear, filings, installments, notices, closeGate, deadlines, profile } = data
  const province = profile?.provinceOfRegistration

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-1">
          <Link href="/business" className="hover:underline">Business OS</Link>
          {' / '}
          <Link href="/business/finance" className="hover:underline">Finance</Link>
          {' / '}
          <Link href="/business/finance/tax" className="hover:underline">Tax</Link>
          {` / ${taxYear.fiscalYearLabel}`}
        </p>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{taxYear.fiscalYearLabel}</h1>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            taxYear.status === 'closed' ? 'bg-green-100 text-green-700' :
            taxYear.status === 'assessed' ? 'bg-purple-100 text-purple-700' :
            taxYear.status === 'filed' ? 'bg-yellow-100 text-yellow-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {taxYear.status}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {taxYear.startDate} → {taxYear.endDate}
          {province ? ` · ${province}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Close Gate + Deadlines */}
        <div className="space-y-6">
          {/* Close Gate */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheckIcon className="h-5 w-5 text-gray-600" />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Close Gate</h2>
            </div>
            <div className={`px-3 py-2 rounded-lg text-sm font-medium mb-3 ${
              closeGate.canClose
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {closeGate.canClose ? 'All gates cleared — ready to close' : 'Blockers remain'}
            </div>
            <div className="space-y-2">
              <GateItem label="T2 filed" met={closeGate.artifacts.t2Filed} />
              {closeGate.artifacts.co17Required && (
                <GateItem label="CO-17 filed" met={closeGate.artifacts.co17Filed} />
              )}
              <GateItem label="All indirect periods filed" met={closeGate.artifacts.allIndirectPeriodsFiled} />
              <GateItem label="NOA uploaded" met={closeGate.artifacts.noaUploaded} />
            </div>
            {closeGate.blockers.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-red-600 mb-1">Blockers:</p>
                <ul className="text-xs text-red-600 list-disc pl-4 space-y-0.5">
                  {closeGate.blockers.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            )}
            {closeGate.warnings.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-amber-600 mb-1">Warnings:</p>
                <ul className="text-xs text-amber-600 list-disc pl-4 space-y-0.5">
                  {closeGate.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Deadlines */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Deadlines</h2>
            <div className="space-y-2">
              {(deadlines ?? []).map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {urgencyIcon(d.urgency)}
                  <div>
                    <span className="font-medium">{d.label}</span>
                    <span className="text-gray-500 ml-1">
                      {new Date(d.dueDate).toLocaleDateString('en-CA')}
                      {d.daysRemaining < 0
                        ? ` (${Math.abs(d.daysRemaining)}d overdue)`
                        : ` (${d.daysRemaining}d)`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Filings, Installments, Notices */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filings */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <DocumentArrowUpIcon className="h-5 w-5 text-gray-600" />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Filings</h2>
            </div>
            {filings.length === 0 ? (
              <p className="text-sm text-gray-400">No filings recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Filed Date</th>
                      <th className="pb-2">Prepared By</th>
                      <th className="pb-2">Reviewed By</th>
                      <th className="pb-2">Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filings.map((f) => (
                      <tr key={f.id} className="border-b border-gray-50">
                        <td className="py-2 font-medium">{f.filingType}</td>
                        <td className="py-2">{f.filedDate ?? '—'}</td>
                        <td className="py-2 text-xs text-gray-500 font-mono">{f.preparedBy.slice(0, 12)}…</td>
                        <td className="py-2 text-xs text-gray-500 font-mono">
                          {f.reviewedBy ? `${f.reviewedBy.slice(0, 12)}…` : '—'}
                        </td>
                        <td className="py-2">
                          {f.sha256 ? (
                            <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                              {f.sha256.slice(0, 12)}…
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Installments */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <BanknotesIcon className="h-5 w-5 text-gray-600" />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Installments</h2>
            </div>
            {installments.length === 0 ? (
              <p className="text-sm text-gray-400">No installments tracked.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
                      <th className="pb-2">Due Date</th>
                      <th className="pb-2">Required</th>
                      <th className="pb-2">Paid</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installments.map((inst) => (
                      <tr key={inst.id} className="border-b border-gray-50">
                        <td className="py-2">{inst.dueDate}</td>
                        <td className="py-2">${Number(inst.requiredAmount).toLocaleString()}</td>
                        <td className="py-2">{inst.paidAmount ? `$${Number(inst.paidAmount).toLocaleString()}` : '—'}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            inst.status === 'paid' ? 'bg-green-100 text-green-700' :
                            inst.status === 'late' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {inst.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Notices */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-600" />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">CRA / RQ Notices</h2>
            </div>
            {notices.length === 0 ? (
              <p className="text-sm text-gray-400">No notices tracked.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
                      <th className="pb-2">Authority</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Received</th>
                      <th className="pb-2">Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notices.map((n) => (
                      <tr key={n.id} className="border-b border-gray-50">
                        <td className="py-2 font-medium">{n.authority}</td>
                        <td className="py-2">{n.noticeType}</td>
                        <td className="py-2">{n.receivedDate}</td>
                        <td className="py-2">
                          {n.sha256 ? (
                            <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                              {n.sha256.slice(0, 12)}…
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
