/**
 * API — /api/ledger
 * GET  → ledger entries with pagination + filters
 * POST → trigger month-end reconciliation
 */
import { NextResponse } from 'next/server'
import { authenticateUser, withRequestContext } from '@/lib/api-guards'
import { withSpan } from '@nzila/os-core/telemetry'
import {
  getLedgerEntries,
  runReconciliation,
  getFinancialOverview,
} from '@/lib/actions/ledger-actions'

export async function GET(request: Request) {
  return withRequestContext(request, () =>
    withSpan('api.ledger.list', { 'http.method': 'GET' }, async () => {
      const auth = await authenticateUser()
      if (!auth.ok) return auth.response

      const url = new URL(request.url)
      const view = url.searchParams.get('view')

      if (view === 'overview') {
        const data = await getFinancialOverview()
        return NextResponse.json({ ok: true, data })
      }

      const page = Number(url.searchParams.get('page') ?? '1')
      const pageSize = Number(url.searchParams.get('pageSize') ?? '50')
      const source = url.searchParams.get('source') ?? undefined
      const startDate = url.searchParams.get('startDate') ?? undefined
      const endDate = url.searchParams.get('endDate') ?? undefined

      const data = await getLedgerEntries({ page, pageSize, source, startDate, endDate })
      return NextResponse.json({ ok: true, data })
    }),
  )
}

export async function POST(request: Request) {
  return withRequestContext(request, () =>
    withSpan('api.ledger.reconciliation', { 'http.method': 'POST' }, async () => {
      const auth = await authenticateUser()
      if (!auth.ok) return auth.response

      try {
        const result = await runReconciliation()
        return NextResponse.json({ ok: true, data: result })
      } catch (err) {
        return NextResponse.json(
          { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
          { status: 500 },
        )
      }
    }),
  )
}
