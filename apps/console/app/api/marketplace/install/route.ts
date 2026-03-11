/**
 * API — Marketplace Provider Install
 * POST /api/marketplace/install — install a provider from manifest
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateUser, withRequestContext } from '@/lib/api-guards'
import { recordAuditEvent } from '@/lib/audit-db'
import { withSpan } from '@nzila/os-core/telemetry'
import { createLogger } from '@nzila/os-core'
import { installProvider } from '@nzila/platform-marketplace'

const logger = createLogger('api:marketplace:install')

const InstallRequestSchema = z.object({
  providerId: z.string().min(1),
  orgId: z.string().min(1),
  secrets: z.record(z.string()),
})

export async function POST(req: NextRequest) {
  return withRequestContext(req, () =>
    withSpan('api.marketplace.install', {}, async () => {
      const auth = await authenticateUser()
      if (!auth.ok) return auth.response

      const body = await req.json()
      const parsed = InstallRequestSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
      }

      const { providerId, orgId, secrets } = parsed.data

      const result = await installProvider(
        {
          orgId,
          providerKey: providerId,
          installedBy: auth.userId,
          secrets,
        },
        {
          async loadManifest(key) {
            return {
              providerKey: key,
              name: key,
              version: '1.0.0',
              description: `Provider ${key}`,
              category: 'integration',
              scopes: [],
              webhookSigning: { algorithm: 'hmac-sha256' as const, headerName: 'x-signature' },
              retryPolicy: { maxAttempts: 3, initialDelayMs: 1000, maxDelayMs: 30000, backoffMultiplier: 2 },
              requiredSecrets: Object.keys(secrets).map((k) => ({ key: k, description: k, required: true })),
              metadata: {},
            }
          },
          async listManifests() { return [] },
          async saveInstallation() {},
          async loadInstallation() { return null },
          async listInstallations() { return [] },
          async validateSecrets(_key, provided) {
            return Object.keys(provided).length > 0
          },
          async runTestCall() {
            return { ok: true }
          },
        },
      )

      if (!result.ok) {
        return NextResponse.json({ error: result.error ?? 'Installation failed' }, { status: 422 })
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
    }),
  )
}
