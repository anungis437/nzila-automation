import type { AgriReadContext, AgriDbContext } from '../types'
import type { CertificationArtifact, CertifyLotInput } from '@nzila/agri-core'
import { createHash } from 'node:crypto'
import { db } from '@nzila/db'
import { agriCertifications } from '@nzila/db/schema'
import { eq, and } from 'drizzle-orm'

function toCert(row: typeof agriCertifications.$inferSelect): CertificationArtifact {
  return {
    id: row.id,
    orgId: row.orgId,
    lotId: row.lotId,
    certificationType: row.certificationType,
    certificateRef: row.certificateRef ?? null,
    contentHash: row.contentHash,
    storageKey: row.storageKey ?? null,
    issuedAt: row.issuedAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listCertifications(
  ctx: AgriReadContext,
  lotId: string,
): Promise<CertificationArtifact[]> {
  const rows = await db
    .select()
    .from(agriCertifications)
    .where(and(eq(agriCertifications.orgId, ctx.orgId), eq(agriCertifications.lotId, lotId)))
  return rows.map(toCert)
}

export async function getCertificationById(
  ctx: AgriReadContext,
  certId: string,
): Promise<CertificationArtifact | null> {
  const [row] = await db
    .select()
    .from(agriCertifications)
    .where(and(eq(agriCertifications.orgId, ctx.orgId), eq(agriCertifications.id, certId)))
    .limit(1)
  return row ? toCert(row) : null
}

export async function createCertification(
  ctx: AgriDbContext,
  values: CertifyLotInput,
  contentForHash: string,
): Promise<CertificationArtifact> {
  const contentHash = createHash('sha256').update(contentForHash).digest('hex')
  const [row] = await db
    .insert(agriCertifications)
    .values({
      orgId: ctx.orgId,
      lotId: values.lotId,
      certificationType: values.certificationType,
      certificateRef: values.certificateRef,
      contentHash,
      issuedAt: new Date(),
      metadata: values.metadata,
    })
    .returning()
  return toCert(row!)
}
