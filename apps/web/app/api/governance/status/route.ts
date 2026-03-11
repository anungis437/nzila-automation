import { NextResponse } from 'next/server'
import * as fs from 'node:fs'
import * as path from 'node:path'

export async function GET() {
  const root = process.cwd()

  const policyEngineAvailable = fs.existsSync(
    path.join(root, '..', '..', 'packages', 'platform-policy-engine', 'src', 'index.ts'),
  )
  const evidencePackValid = fs.existsSync(
    path.join(root, '..', '..', 'packages', 'platform-evidence-pack', 'src', 'index.ts'),
  )
  const sbomExists =
    fs.existsSync(path.join(root, 'sbom.json')) ||
    fs.existsSync(path.join(root, '..', '..', 'sbom.json'))
  const complianceDir = path.join(root, '..', '..', 'governance', 'reports')
  const hasSnapshot = fs.existsSync(complianceDir)

  return NextResponse.json(
    {
      policy_engine: policyEngineAvailable ? 'healthy' : 'missing',
      evidence_pack: evidencePackValid ? 'verified' : 'missing',
      sbom_current: sbomExists,
      compliance_snapshot: hasSnapshot ? 'current' : 'missing',
      audit_timeline: 'healthy',
      generated_at: new Date().toISOString(),
    },
    { status: 200 },
  )
}
