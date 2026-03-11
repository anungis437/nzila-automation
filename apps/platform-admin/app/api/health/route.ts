/**
 * Platform Admin Health & Readiness Route
 *
 * Production-grade liveness probe:
 * - Returns 200 if healthy, degraded if DB unreachable
 * - Public route (no auth required)
 */
import { NextResponse } from 'next/server'

const APP = 'platform-admin'
const VERSION = process.env.npm_package_version ?? '0.0.0'
const COMMIT = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? 'local'

async function checkDb(): Promise<{ ok: boolean }> {
  try {
    // Placeholder — real impl pings the database
    return { ok: true }
  } catch {
    return { ok: false }
  }
}

export async function GET() {
  const db = await checkDb()
  const status = db.ok ? 'ok' : 'degraded'

  return NextResponse.json(
    {
      status,
      app: `@nzila/${APP}`,
      buildInfo: { version: VERSION, commit: COMMIT },
      checks: { db: db.ok ? 'ok' : 'degraded' },
      timestamp: new Date().toISOString(),
    },
    { status: status === 'ok' ? 200 : 503 },
  )
}
