/**
 * API — Procurement Pack Export
 * POST /api/proof-center/export — export signed pack as downloadable JSON
 */
import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/api-guards'
import { recordAuditEvent } from '@/lib/audit-db'
import { createLogger } from '@nzila/os-core'

const logger = createLogger('api:proof-center:export')

export async function POST(_req: NextRequest) {
  try {
    const auth = await authenticateUser()
    if (!auth.ok) return auth.response

    // In production: exportAsBundle(pack, signature)
    const bundle = {
      format: 'nzila-procurement-pack-v1',
      exportedAt: new Date().toISOString(),
      exportedBy: auth.userId,
      sections: [
        { name: 'security', checksum: 'sha256:placeholder' },
        { name: 'dataLifecycle', checksum: 'sha256:placeholder' },
        { name: 'operational', checksum: 'sha256:placeholder' },
        { name: 'governance', checksum: 'sha256:placeholder' },
        { name: 'sovereignty', checksum: 'sha256:placeholder' },
      ],
      integrity: 'sha256:placeholder',
    }

    await recordAuditEvent({
      orgId: auth.userId,
      targetType: 'org',
      targetId: auth.userId,
      action: 'procurement_pack_exported',
      actorClerkUserId: auth.userId,
      afterJson: { format: 'json', sectionCount: 5 },
    })

    logger.info('Procurement pack exported', { userId: auth.userId })

    return new NextResponse(JSON.stringify(bundle, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="Nzila-Procurement-Pack-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  } catch (err) {
    logger.error('[Proof Center Export Error]', err instanceof Error ? err : { detail: err })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
