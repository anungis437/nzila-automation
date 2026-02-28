'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
  LockClosedIcon,
  LockOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  ShieldCheckIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline'

interface CloseTask {
  id: string
  taskName: string
  description: string | null
  assignedTo: string | null
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked'
  dueDate: string | null
  sortOrder: number
}

interface CloseException {
  id: string
  title: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'acknowledged' | 'resolved' | 'waived'
  raisedBy: string
  resolvedBy: string | null
  waiverDocumentId: string | null
}

interface CloseApproval {
  id: string
  approverClerkUserId: string
  approverRole: string
  status: 'pending' | 'approved' | 'rejected'
  comments: string | null
}

interface ClosePeriodDetail {
  period: {
    id: string
    orgId: string
    periodLabel: string
    periodType: string
    startDate: string
    endDate: string
    status: 'open' | 'in_progress' | 'pending_approval' | 'closed'
    openedBy: string
    closedBy: string | null
    closedAt: string | null
  }
  tasks: CloseTask[]
  exceptions: CloseException[]
  approvals: CloseApproval[]
}

function taskStatusBadge(s: CloseTask['status']) {
  const m: Record<string, { bg: string; label: string }> = {
    not_started: { bg: 'bg-gray-100 text-gray-600', label: 'Not Started' },
    in_progress: { bg: 'bg-blue-100 text-blue-700', label: 'In Progress' },
    completed: { bg: 'bg-green-100 text-green-700', label: 'Completed' },
    blocked: { bg: 'bg-red-100 text-red-700', label: 'Blocked' },
  }
  const v = m[s] ?? { bg: 'bg-gray-100 text-gray-500', label: s }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.bg}`}>{v.label}</span>
}

function severityBadge(s: CloseException['severity']) {
  const m: Record<string, { bg: string }> = {
    low: { bg: 'bg-gray-100 text-gray-600' },
    medium: { bg: 'bg-yellow-100 text-yellow-700' },
    high: { bg: 'bg-orange-100 text-orange-700' },
    critical: { bg: 'bg-red-100 text-red-700' },
  }
  const v = m[s] ?? { bg: 'bg-gray-100 text-gray-600' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${v.bg}`}>{s}</span>
}

function exceptionStatusBadge(s: CloseException['status']) {
  const m: Record<string, { bg: string; label: string }> = {
    open: { bg: 'bg-red-100 text-red-700', label: 'Open' },
    acknowledged: { bg: 'bg-yellow-100 text-yellow-700', label: 'Acknowledged' },
    resolved: { bg: 'bg-green-100 text-green-700', label: 'Resolved' },
    waived: { bg: 'bg-purple-100 text-purple-700', label: 'Waived' },
  }
  const v = m[s] ?? { bg: 'bg-gray-100 text-gray-600', label: s }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.bg}`}>{v.label}</span>
}

function approvalStatusIcon(s: CloseApproval['status']) {
  switch (s) {
    case 'approved': return <CheckCircleIcon className="h-5 w-5 text-green-500" />
    case 'rejected': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
    case 'pending': return <ClockIcon className="h-5 w-5 text-amber-500" />
  }
}

function periodStatusInfo(status: string) {
  const m: Record<string, { bg: string; label: string; icon: typeof LockOpenIcon }> = {
    open: { bg: 'bg-blue-100 text-blue-700', label: 'Open', icon: LockOpenIcon },
    in_progress: { bg: 'bg-yellow-100 text-yellow-700', label: 'In Progress', icon: ClockIcon },
    pending_approval: { bg: 'bg-purple-100 text-purple-700', label: 'Pending Approval', icon: ShieldCheckIcon },
    closed: { bg: 'bg-green-100 text-green-700', label: 'Closed', icon: LockClosedIcon },
  }
  return m[status] ?? { bg: 'bg-gray-100 text-gray-600', label: status, icon: ClockIcon }
}

export default function ClosePeriodDetailPage({
  params,
}: {
  params: Promise<{ periodId: string }>
}) {
  const { periodId } = use(params)
  const [data, setData] = useState<ClosePeriodDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/finance/close/${periodId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [periodId])

  if (loading) {
    return <div className="p-8"><p className="text-gray-400 text-sm">Loading close period...</p></div>
  }
  if (!data) {
    return <div className="p-8"><p className="text-red-500">Close period not found.</p></div>
  }

  const { period, tasks, exceptions, approvals } = data
  const statusInfo = periodStatusInfo(period.status)
  const StatusIcon = statusInfo.icon

  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const totalTasks = tasks.length
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const openExceptions = exceptions.filter((e) => e.status === 'open' || e.status === 'acknowledged')
  const criticalExceptions = exceptions.filter((e) => e.severity === 'critical' && e.status === 'open')

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-1">
          <Link href="/business" className="hover:underline">Business OS</Link>
          {' / '}
          <Link href="/business/finance" className="hover:underline">Finance</Link>
          {' / '}
          <Link href="/business/finance/close" className="hover:underline">Close Management</Link>
          {` / ${period.periodLabel}`}
        </p>
        <div className="flex items-center gap-3">
          <StatusIcon className="h-6 w-6 text-gray-500" />
          <h1 className="text-2xl font-bold text-gray-900">{period.periodLabel}</h1>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg}`}>
            {statusInfo.label}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {period.periodType === 'month' ? 'Monthly' : period.periodType === 'quarter' ? 'Quarterly' : 'Annual'} close
          {' · '}
          {period.startDate} → {period.endDate}
        </p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500 uppercase mb-1">Task Progress</p>
          <p className="text-2xl font-bold text-gray-900">{taskProgress}%</p>
          <p className="text-xs text-gray-400">{completedTasks}/{totalTasks} complete</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500 uppercase mb-1">Open Exceptions</p>
          <p className={`text-2xl font-bold ${openExceptions.length > 0 ? 'text-amber-600' : 'text-green-600'}`}>
            {openExceptions.length}
          </p>
          {criticalExceptions.length > 0 && (
            <p className="text-xs text-red-500">{criticalExceptions.length} critical</p>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500 uppercase mb-1">Approvals</p>
          <p className="text-2xl font-bold text-gray-900">{approvals.length}</p>
          <p className="text-xs text-gray-400">
            {approvals.filter((a) => a.status === 'approved').length} approved
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500 uppercase mb-1">Closed</p>
          {period.closedAt ? (
            <>
              <p className="text-lg font-bold text-green-600">{new Date(period.closedAt).toLocaleDateString('en-CA')}</p>
              <p className="text-xs text-gray-400">by {period.closedBy?.slice(0, 12)}…</p>
            </>
          ) : (
            <p className="text-lg font-medium text-gray-300">—</p>
          )}
        </div>
      </div>

      {/* Tasks */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <ListBulletIcon className="h-5 w-5 text-gray-600" />
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Close Checklist</h2>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-400 text-sm">
            No tasks defined for this close period.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Task</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Assigned</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Due</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((t) => (
                    <tr key={t.id} className={t.status === 'completed' ? 'opacity-60' : ''}>
                      <td className="px-4 py-3 text-gray-400">{t.sortOrder}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{t.taskName}</p>
                        {t.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {t.assignedTo?.slice(0, 12) ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-CA') : '—'}
                      </td>
                      <td className="px-4 py-3">{taskStatusBadge(t.status)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Progress bar */}
        {totalTasks > 0 && (
          <div className="mt-2">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${taskProgress}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Exceptions */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <FlagIcon className="h-5 w-5 text-gray-600" />
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Exceptions</h2>
        </div>

        {exceptions.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-400 text-sm">
            No exceptions raised for this period.
          </div>
        ) : (
          <div className="space-y-2">
            {exceptions.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {e.severity === 'critical' ? (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                  ) : (
                    <FlagIcon className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{e.title}</p>
                    <p className="text-xs text-gray-500">
                      Raised by {e.raisedBy.slice(0, 12)}…
                      {e.resolvedBy && ` · Resolved by ${e.resolvedBy.slice(0, 12)}…`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {severityBadge(e.severity)}
                  {exceptionStatusBadge(e.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Approvals */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheckIcon className="h-5 w-5 text-gray-600" />
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Approvals</h2>
        </div>

        {approvals.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-400 text-sm">
            No approvals recorded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {approvals.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {approvalStatusIcon(a.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {a.approverRole}
                      <span className="text-gray-400 font-mono text-xs ml-2">{a.approverClerkUserId.slice(0, 12)}…</span>
                    </p>
                    {a.comments && <p className="text-xs text-gray-500 mt-0.5">{a.comments}</p>}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  a.status === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : a.status === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                }`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
