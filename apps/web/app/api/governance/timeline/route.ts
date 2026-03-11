import { NextResponse } from 'next/server'

import { authenticateUser, withRequestContext } from '@/lib/api-guards'
import { withSpan } from '@nzila/os-core/telemetry'

export async function GET(request: Request) {
  return withRequestContext(request, () =>
    withSpan('api.governance.timeline.get', { 'http.method': 'GET' }, async () => {
      const auth = await authenticateUser()
      if (!auth.ok) return auth.response

      // Timeline entries are composed from governance audit events.
      // In production, these would be sourced from a persistent store.
      const timeline: Array<{
        timestamp: string
        event_type: string
        actor: string
        policy_result: string
        commit_hash: string
        source: string
      }> = []

      return NextResponse.json(
        {
          entries: timeline,
          count: timeline.length,
          generated_at: new Date().toISOString(),
        },
        { status: 200 },
      )
    }),
  )
}
