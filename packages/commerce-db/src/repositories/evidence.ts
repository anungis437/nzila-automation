/**
 * @nzila/commerce-db — Evidence artifacts repository
 *
 * Org-scoped operations for commerce_evidence_artifacts.
 * Evidence rows are append-only — no updates or deletes.
 *
 * @module @nzila/commerce-db/evidence
 */
import {
  createScopedDb,
  createAuditedScopedDb,
  commerceEvidenceArtifacts,
} from '@nzila/db'
import { eq, and } from 'drizzle-orm'
import type { CommerceDbContext, CommerceReadContext, PaginationOpts } from '../types'

// ── Reads ─────────────────────────────────────────────────────────────────

export async function listEvidenceArtifacts(
  ctx: CommerceReadContext,
  opts: PaginationOpts = {},
) {
  const db = createScopedDb({ orgId: ctx.entityId })
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0

  const rows = await db.select(commerceEvidenceArtifacts)
  const sorted = rows.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  return {
    rows: sorted.slice(offset, offset + limit),
    total: sorted.length,
    limit,
    offset,
  }
}

export async function getEvidenceArtifactById(
  ctx: CommerceReadContext,
  artifactId: string,
) {
  const db = createScopedDb({ orgId: ctx.entityId })
  const rows = await db.select(
    commerceEvidenceArtifacts,
    eq(commerceEvidenceArtifacts.id, artifactId),
  )
  return rows[0] ?? null
}

export async function listEvidenceByTarget(
  ctx: CommerceReadContext,
  targetEntityType: string,
  targetEntityId: string,
) {
  const db = createScopedDb({ orgId: ctx.entityId })
  return db.select(
    commerceEvidenceArtifacts,
    and(
      eq(commerceEvidenceArtifacts.targetEntityType, targetEntityType),
      eq(commerceEvidenceArtifacts.targetEntityId, targetEntityId),
    ),
  )
}

// ── Writes (append-only — no update/delete) ───────────────────────────────

export async function createEvidenceArtifact(
  ctx: CommerceDbContext,
  values: {
    type: string
    targetEntityType: string
    targetEntityId: string
    storageKey: string
    hash: string
    metadata?: Record<string, unknown>
  },
) {
  const db = createAuditedScopedDb({
    orgId: ctx.entityId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.insert(commerceEvidenceArtifacts, values)
}
