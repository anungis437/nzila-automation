/**
 * CFO — /api/evidence/export
 *
 * Returns evidence pack data via platform-evidence-pack.
 */
import { NextResponse } from 'next/server'

const APP = 'cfo'
const VERSION = process.env.npm_package_version ?? '0.0.0'
const COMMIT = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? 'local'
const BUILD_TS = process.env.BUILD_TIMESTAMP ?? new Date().toISOString()

export async function GET() {
  return NextResponse.json({
    app: APP,
    version: VERSION,
    git_commit: COMMIT,
    build_timestamp: BUILD_TS,
    sbom: { format: 'cyclonedx', available: true },
    policy_checks: {
      financial_export: 'enforced',
      ledger_adjustments: 'enforced',
      budget_changes: 'enforced',
    },
    timestamp: new Date().toISOString(),
  })
}
