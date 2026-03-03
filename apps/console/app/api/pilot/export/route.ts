/**
 * Nzila OS — Pilot Summary Export API
 *
 * GET /api/pilot/export — returns the pilot summary bundle as JSON.
 * Platform admin / ops only.
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  generatePilotSummary,
  createDefaultPilotPorts,
} from '@nzila/platform-ops'
import { createLogger } from '@nzila/os-core'

const logger = createLogger('pilot-export')

export const dynamic = 'force-dynamic'

export async function GET() {
  const { sessionClaims } = await auth()
  const meta = sessionClaims?.publicMetadata as Record<string, unknown> | undefined
  const role = meta?.nzilaRole as string | undefined
  const allowedRoles = ['platform_admin', 'studio_admin', 'ops']

  if (!role || !allowedRoles.includes(role)) {
    logger.warn('pilot-export forbidden', { role })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const ports = createDefaultPilotPorts()
  const bundle = await generatePilotSummary(ports)

  logger.info('pilot-export generated', { version: bundle.release.version })

  return NextResponse.json(bundle, {
    headers: {
      'Content-Disposition': `attachment; filename="nzila-pilot-summary-${bundle.release.version}.json"`,
    },
  })
}
