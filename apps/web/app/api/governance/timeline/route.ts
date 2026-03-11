import { NextResponse } from 'next/server'

export async function GET() {
  // Timeline entries are composed from governance audit events.
  // In production, these would be sourced from a persistent store.
  // This endpoint returns the canonical shape for governance timeline queries.
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
}
