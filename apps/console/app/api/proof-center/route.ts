/**
 * API — Procurement Proof Center
 * GET  /api/proof-center  — fetch proof sections & overall score
 * POST /api/proof-center  — trigger full pack collection + signing
 */
import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/api-guards'
import { recordAuditEvent } from '@/lib/audit-db'
import { createLogger } from '@nzila/os-core'
import { procurementManifestSchema } from '@nzila/platform-procurement-proof'

const logger = createLogger('api:proof-center')

export async function GET(_req: NextRequest) {
  try {
    const auth = await authenticateUser()
    if (!auth.ok) return auth.response

    // In production: collectProcurementPack(ports)
    const pack = {
      orgId: auth.userId,
      generatedAt: new Date().toISOString(),
      sections: {
        security: { score: 92, grade: 'A', items: 4, passRate: 1.0 },
        dataLifecycle: { score: 100, grade: 'A', items: 4, passRate: 1.0 },
        operational: { score: 91, grade: 'A', items: 4, passRate: 1.0 },
        governance: { score: 95, grade: 'A', items: 4, passRate: 1.0 },
        sovereignty: { score: 100, grade: 'A', items: 4, passRate: 1.0 },
      },
      overallScore: 95,
      overallGrade: 'A',
    }

    return NextResponse.json(pack)
  } catch (err) {
    logger.error('[Proof Center GET Error]', err instanceof Error ? err : { detail: err })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(_req: NextRequest) {
  try {
    const auth = await authenticateUser()
    if (!auth.ok) return auth.response

    // TODO(prod): replace with collectProcurementPack → signProcurementPack → exportAsJson
    const manifest = procurementManifestSchema.parse({
      version: '1.0',
      sectionCount: 5,
      artifactCount: 0,
      generatedAt: new Date().toISOString(),
      checksums: {},
    })

    const pack = {
      MANIFEST: manifest,
      pack: {
        orgId: auth.userId,
        security: { score: 92 },
        dataLifecycle: { score: 100 },
        operational: { score: 91 },
        governance: { score: 95 },
        sovereignty: { score: 100 },
      },
      SIGNATURE: {
        digest: 'sha256:placeholder',
        signedBy: auth.userId,
        signedAt: new Date().toISOString(),
      },
    }

    await recordAuditEvent({
      orgId: auth.userId,
      targetType: 'org',
      targetId: auth.userId,
      action: 'procurement_pack_generated',
      actorClerkUserId: auth.userId,
      afterJson: { sectionCount: 5 },
    })

    logger.info('Procurement pack generated', { userId: auth.userId })
    return NextResponse.json(pack, { status: 201 })
  } catch (err) {
    logger.error('[Proof Center POST Error]', err instanceof Error ? err : { detail: err })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
