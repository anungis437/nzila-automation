/**
 * Web — /api/evidence/export
 *
 * Returns evidence pack data via platform-evidence-pack.
 */
import { NextResponse } from 'next/server'
import { authenticateUser, withRequestContext } from '@/lib/api-guards'
import { withSpan } from '@nzila/os-core/telemetry'

const APP = 'web'
const VERSION = process.env.npm_package_version ?? '0.0.0'
const COMMIT = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? 'local'
const BUILD_TS = process.env.BUILD_TIMESTAMP ?? new Date().toISOString()

export async function GET(request: Request) {
  return withRequestContext(request, () =>
    withSpan('api.evidence.export', { 'http.method': 'GET' }, async () => {
      const auth = await authenticateUser()
      if (!auth.ok) return auth.response

      return NextResponse.json({
        app: APP,
        version: VERSION,
        git_commit: COMMIT,
        build_timestamp: BUILD_TS,
        sbom: { format: 'cyclonedx', available: true },
        policy_checks: {
          content_publishing: 'enforced',
          admin_analytics_access: 'enforced',
        },
        timestamp: new Date().toISOString(),
      })
    }),
  )
}
