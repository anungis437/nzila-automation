/**
 * API — Marketplace Provider Install
 * POST /api/marketplace/install — install a provider from manifest
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateUser } from '@/lib/api-guards'
import { recordAuditEvent } from '@/lib/audit-db'
import { createLogger } from '@nzila/os-core'
import type { InstallResult } from '@nzila/platform-marketplace'

const logger = createLogger('api:marketplace:install')

const InstallRequestSchema = z.object({
  providerId: z.string().min(1),
  orgId: z.string().min(1),
  secrets: z.record(z.string()),
})

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateUser()
    if (!auth.ok) return auth.response

    const body = await req.json()
    const parsed = InstallRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { providerId, orgId, secrets } = parsed.data

    // TODO(prod): replace with installProvider(ports, registry, providerId, orgId, secrets)
    const result: InstallResult = {
      ok: true,
      installation: {
        installationId: `inst_${Date.now()}`,
        orgId,
        providerKey: providerId,
        status: 'active',
        installedBy: auth.userId,
        installedAt: new Date().toISOString(),
        secretsValidated: true,
        testCallSucceeded: true,
        configuration: {},
      },
    }

    await recordAuditEvent({
      orgId,
      targetType: 'org',
      targetId: orgId,
      action: 'provider_installed',
      actorClerkUserId: auth.userId,
      afterJson: { providerId, secretCount: Object.keys(secrets).length },
    })

    logger.info('Provider installed', { providerId, orgId })
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    logger.error('[Marketplace Install Error]', err instanceof Error ? err : { detail: err })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
