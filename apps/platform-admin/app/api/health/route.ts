/**
 * Platform Admin Health & Readiness Route
 *
 * Production-grade liveness probe:
 * - Returns 200 if healthy
 * - Public route (no auth required)
 */
import { NextResponse } from 'next/server'

const APP = 'platform-admin'
const VERSION = process.env.npm_package_version ?? '0.0.0'
const COMMIT = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? 'local'

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      app: `@nzila/${APP}`,
      buildInfo: { version: VERSION, commit: COMMIT },
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  )
}
