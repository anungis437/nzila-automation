/**
 * API — /api/candidates
 * GET  → list candidates
 * POST → register a new candidate
 */
import { NextResponse } from 'next/server'
import { authenticateUser, withRequestContext } from '@/lib/api-guards'
import { withSpan } from '@nzila/os-core/telemetry'
import { listCandidates, registerCandidate } from '@/lib/actions/candidate-actions'

export async function GET(request: Request) {
  return withRequestContext(request, () =>
    withSpan('api.candidates.list', { 'http.method': 'GET' }, async () => {
      const auth = await authenticateUser()
      if (!auth.ok) return auth.response

      const url = new URL(request.url)
      const status = url.searchParams.get('status') ?? undefined
      const search = url.searchParams.get('search') ?? undefined

      const data = await listCandidates({ status, search })
      return NextResponse.json({ ok: true, data })
    }),
  )
}

export async function POST(request: Request) {
  return withRequestContext(request, () =>
    withSpan('api.candidates.register', { 'http.method': 'POST' }, async () => {
      const auth = await authenticateUser()
      if (!auth.ok) return auth.response

      try {
        const body = await request.json()
        const result = await registerCandidate(body)

        if (!result.success) {
          return NextResponse.json(
            { ok: false, error: result.error ?? 'Validation failed' },
            { status: 400 },
          )
        }

        return NextResponse.json({ ok: true, data: result }, { status: 201 })
      } catch (err) {
        return NextResponse.json(
          { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
          { status: 500 },
        )
      }
    }),
  )
}
