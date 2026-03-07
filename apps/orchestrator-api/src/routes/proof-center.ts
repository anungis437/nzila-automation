/**
 * Proof Center routes — read-only metadata endpoint for the latest procurement pack.
 *
 * GET /api/proof-center/latest-pack
 *   Returns metadata about the most recently generated procurement pack
 *   without including the full payload (use the export endpoint for that).
 */
import type { FastifyInstance } from 'fastify'
import { nowISO } from '@nzila/platform-utils/time'
import {
  collectProcurementPack,
  signProcurementPack,
  createRealPorts,
} from '@nzila/platform-procurement-proof'
import type { ProcurementPack } from '@nzila/platform-procurement-proof/types'

// ── Cached latest pack (in-memory; reset on restart) ────────────────────────
let cachedPack: ProcurementPack | null = null

export async function proofCenterRoutes(app: FastifyInstance) {
  // ── GET /latest-pack ────────────────────────────────────────────────────
  app.get('/latest-pack', async (_req, reply) => {
    try {
      // If no cached pack, collect a fresh one
      if (!cachedPack) {
        const ports = createRealPorts()
        const unsigned = await collectProcurementPack('default-org', 'api', ports)
        cachedPack = await signProcurementPack(unsigned, ports)
      }

      const pack = cachedPack!
      const sectionNames = Object.keys(pack.sections)
      const manifestHash = pack.signature?.digest ?? null

      return reply.status(200).send({
        packId: pack.packId,
        orgId: pack.orgId,
        generatedAt: pack.generatedAt,
        status: pack.status,
        sectionCount: sectionNames.length,
        sections: sectionNames,
        manifestHash,
        verificationStatus: pack.status === 'signed' ? 'VALID' : 'UNSIGNED',
        downloadUrl: '/api/proof-center/export',
        respondedAt: nowISO(),
      })
    } catch (err) {
      app.log.error({ err }, 'Failed to retrieve latest procurement pack')
      return reply.status(500).send({
        error: 'Failed to retrieve procurement pack metadata',
        message: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  })

  // ── POST /refresh ───────────────────────────────────────────────────────
  app.post('/refresh', async (_req, reply) => {
    try {
      const ports = createRealPorts()
      const unsigned = await collectProcurementPack('default-org', 'api', ports)
      cachedPack = await signProcurementPack(unsigned, ports)

      return reply.status(200).send({
        packId: cachedPack.packId,
        generatedAt: cachedPack.generatedAt,
        status: cachedPack.status,
        refreshedAt: nowISO(),
      })
    } catch (err) {
      app.log.error({ err }, 'Failed to refresh procurement pack')
      return reply.status(500).send({
        error: 'Failed to refresh procurement pack',
        message: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  })
}
