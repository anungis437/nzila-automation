import type { AgriReadContext, AgriDbContext } from '../types'
import type { TraceabilityChain, TraceabilityEntityType } from '@nzila/agri-core'
import { db } from '@nzila/db'
import { agriTraceabilityLinks } from '@nzila/db/schema'
import { eq, and, or } from 'drizzle-orm'

function toLink(row: typeof agriTraceabilityLinks.$inferSelect): TraceabilityChain {
  return {
    id: row.id,
    orgId: row.orgId,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    targetType: row.targetType,
    targetId: row.targetId,
    linkMetadata: (row.linkMetadata ?? {}) as Record<string, unknown>,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listTraceabilityLinks(
  ctx: AgriReadContext,
  sourceType: string,
  sourceId: string,
): Promise<TraceabilityChain[]> {
  const rows = await db
    .select()
    .from(agriTraceabilityLinks)
    .where(
      and(
        eq(agriTraceabilityLinks.orgId, ctx.orgId),
        eq(agriTraceabilityLinks.sourceType, sourceType as typeof agriTraceabilityLinks.$inferSelect.sourceType),
        eq(agriTraceabilityLinks.sourceId, sourceId),
      ),
    )
  return rows.map(toLink)
}

export async function getFullChain(
  ctx: AgriReadContext,
  entityType: string,
  targetEntityId: string,
): Promise<TraceabilityChain[]> {
  const rows = await db
    .select()
    .from(agriTraceabilityLinks)
    .where(
      and(
        eq(agriTraceabilityLinks.orgId, ctx.orgId),
        or(
          and(
            eq(agriTraceabilityLinks.sourceType, entityType as typeof agriTraceabilityLinks.$inferSelect.sourceType),
            eq(agriTraceabilityLinks.sourceId, targetEntityId),
          ),
          and(
            eq(agriTraceabilityLinks.targetType, entityType as typeof agriTraceabilityLinks.$inferSelect.targetType),
            eq(agriTraceabilityLinks.targetId, targetEntityId),
          ),
        ),
      ),
    )
  return rows.map(toLink)
}

export async function createTraceabilityLink(
  ctx: AgriDbContext,
  sourceType: TraceabilityEntityType,
  sourceId: string,
  targetType: TraceabilityEntityType,
  targetId: string,
  metadata: Record<string, unknown> = {},
): Promise<TraceabilityChain> {
  const [row] = await db
    .insert(agriTraceabilityLinks)
    .values({
      orgId: ctx.orgId,
      sourceType,
      sourceId,
      targetType,
      targetId,
      linkMetadata: metadata,
    })
    .returning()
  return toLink(row)
}
