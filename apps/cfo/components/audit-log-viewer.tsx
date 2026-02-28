/**
 * CFO — Audit Log Viewer (Client Component).
 *
 * Interactive searchable/filterable table for audit entries.
 */
'use client'

import { useState, useEffect, useTransition } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { listAuditEntries, type AuditEntry } from '@/lib/actions/audit-actions'

export function AuditLogViewer() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [actions, setActions] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const result = await listAuditEntries({
        search: search || undefined,
        action: actionFilter || undefined,
        page,
      })
      setEntries(result.entries)
      setActions(result.actions)
      setTotal(result.total)
    })
  }, [page, search, actionFilter])

  const totalPages = Math.ceil(total / 25)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by action, actor, entity…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
        >
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        {isPending && <Loader2 className="h-4 w-4 animate-spin text-electric" />}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">Action</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Actor</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Entity</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  {isPending ? 'Loading…' : 'No entries found.'}
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-secondary/50">
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-mono">
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground truncate max-w-[160px]">{entry.actorId}</td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.entityType}/{entry.orgId}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleString('en-CA') : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {total} entries
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isPending}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-50 hover:bg-secondary"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isPending}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-50 hover:bg-secondary"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
