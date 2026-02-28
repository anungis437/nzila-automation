import type { AgriReadContext, AgriDbContext } from '../types'
import type { TraceabilityChain, TraceabilityEntityType } from '@nzila/agri-core'

export async function listTraceabilityLinks(
  ctx: AgriReadContext,
  sourceType: string,
  sourceId: string,
): Promise<TraceabilityChain[]> {
  void ctx; void sourceType; void sourceId
  return []
}

export async function getFullChain(
  ctx: AgriReadContext,
  entityType: string,
  entityId: string,
): Promise<TraceabilityChain[]> {
  void ctx; void entityType; void entityId
  // TODO: recursive query to build full chain
  return []
}

export async function createTraceabilityLink(
  ctx: AgriDbContext,
  sourceType: TraceabilityEntityType,
  sourceId: string,
  targetType: TraceabilityEntityType,
  targetId: string,
  metadata: Record<string, unknown> = {},
): Promise<TraceabilityChain> {
  const id = crypto.randomUUID()
  return {
    id,
    orgId: ctx.orgId,
    sourceType,
    sourceId,
    targetType,
    targetId,
    linkMetadata: metadata,
    createdAt: new Date().toISOString(),
  }
}
