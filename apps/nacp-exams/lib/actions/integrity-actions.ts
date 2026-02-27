'use server'

/**
 * Integrity actions — NACP Exams.
 *
 * Manages integrity artifacts, verification, and evidence-chain queries.
 * Integrates with @nzila/os-core evidence pipeline for tamper-proof seals.
 */
import { platformDb } from '@nzila/db/platform'
import { sql } from 'drizzle-orm'
import { verifySeal } from '@/lib/evidence'
import { resolveOrgContext } from '@/lib/resolve-org'

// ── Types ────────────────────────────────────────────────────────────────────

export interface IntegrityArtifactRow {
  id: string
  entityType: string
  entityId: string
  action: string
  sealHash: string
  status: string
  createdAt: string
}

export interface IntegrityDashboard {
  totalArtifacts: number
  verifiedCount: number
  pendingCount: number
  failedCount: number
  recentArtifacts: IntegrityArtifactRow[]
  integrityScore: number
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getIntegrityDashboard(): Promise<IntegrityDashboard> {
  const ctx = await resolveOrgContext()

  try {
    const [statsRow] = await platformDb.execute(sql`
      SELECT
        COUNT(*)::int as "totalArtifacts",
        COUNT(*) FILTER (WHERE status = 'verified')::int as "verifiedCount",
        COUNT(*) FILTER (WHERE status = 'pending')::int as "pendingCount",
        COUNT(*) FILTER (WHERE status = 'failed')::int as "failedCount"
      FROM integrity_artifacts
      WHERE org_id = ${ctx.entityId}
    `)

    const recentRows = await platformDb.execute(sql`
      SELECT
        id,
        entity_type as "entityType",
        entity_id as "entityId",
        action,
        seal_hash as "sealHash",
        status,
        created_at as "createdAt"
      FROM integrity_artifacts
      WHERE org_id = ${ctx.entityId}
      ORDER BY created_at DESC
      LIMIT 20
    `)

    const s = statsRow as Record<string, number>
    const total = s.totalArtifacts ?? 0
    const verified = s.verifiedCount ?? 0

    return {
      totalArtifacts: total,
      verifiedCount: verified,
      pendingCount: s.pendingCount ?? 0,
      failedCount: s.failedCount ?? 0,
      recentArtifacts: (recentRows as unknown as IntegrityArtifactRow[]) ?? [],
      integrityScore: total > 0 ? Math.round((verified / total) * 100) : 100,
    }
  } catch {
    return {
      totalArtifacts: 0,
      verifiedCount: 0,
      pendingCount: 0,
      failedCount: 0,
      recentArtifacts: [],
      integrityScore: 100,
    }
  }
}

export async function verifyArtifact(artifactId: string) {
  const ctx = await resolveOrgContext()

  const [artifact] = await platformDb.execute(sql`
    SELECT seal_hash as "sealHash", entity_type as "entityType", entity_id as "entityId"
    FROM integrity_artifacts
    WHERE id = ${artifactId} AND org_id = ${ctx.entityId}
  `)

  if (!artifact) {
    return { success: false, error: 'Artifact not found' }
  }

  try {
    const row = artifact as Record<string, string>
    // Parse the stored seal data and verify it
    const packIndex = JSON.parse(row.sealHash) as Record<string, unknown>
    const result = verifySeal(packIndex as Parameters<typeof verifySeal>[0])
    const valid = result.valid

    await platformDb.execute(sql`
      UPDATE integrity_artifacts
      SET status = ${valid ? 'verified' : 'failed'}, verified_at = NOW(), verified_by = ${ctx.actorId}
      WHERE id = ${artifactId} AND org_id = ${ctx.entityId}
    `)

    return { success: true, valid }
  } catch {
    return { success: false, error: 'Verification failed' }
  }
}
