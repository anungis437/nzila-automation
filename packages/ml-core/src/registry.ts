/**
 * @nzila/ml-core — Model Registry helpers
 *
 * Server-side utilities for reading/writing ML model registry from DB.
 * Never imported by apps directly; apps use @nzila/ml-sdk.
 */
import { db } from '@nzila/db'
import { mlModels, mlDatasets } from '@nzila/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import type { MlModelKey, MlModelStatus } from './types'

/**
 * Return the latest active model for a given orgId + modelKey.
 * Returns null if none exists.
 */
export async function getActiveModel(orgId: string, modelKey: MlModelKey) {
  const rows = await db
    .select()
    .from(mlModels)
    .where(
      and(
        eq(mlModels.orgId, orgId),
        eq(mlModels.modelKey, modelKey),
        eq(mlModels.status, 'active' as MlModelStatus),
      ),
    )
    .orderBy(desc(mlModels.version))
    .limit(1)

  return rows[0] ?? null
}

/**
 * Return all models for a given orgId, ordered by modelKey asc + version desc.
 */
export async function listModels(orgId: string) {
  return db
    .select()
    .from(mlModels)
    .where(eq(mlModels.orgId, orgId))
    .orderBy(desc(mlModels.version))
}

/**
 * Activate a model by id (sets status = active, retires all others of same key).
 */
export async function activateModel(
  orgId: string,
  modelId: string,
  approvedBy: string,
): Promise<void> {
  const model = await db
    .select()
    .from(mlModels)
    .where(and(eq(mlModels.id, modelId), eq(mlModels.orgId, orgId)))
    .limit(1)
    .then((r) => r[0])

  if (!model) throw new Error(`Model ${modelId} not found for entity ${orgId}`)

  // Retire all other active versions of same key
  await db
    .update(mlModels)
    .set({ status: 'retired', updatedAt: new Date() })
    .where(
      and(
        eq(mlModels.orgId, orgId),
        eq(mlModels.modelKey, model.modelKey),
        eq(mlModels.status, 'active'),
      ),
    )

  // Activate target
  await db
    .update(mlModels)
    .set({ status: 'active', approvedBy, approvedAt: new Date(), updatedAt: new Date() })
    .where(eq(mlModels.id, modelId))
}

/**
 * Retire a model by id.
 */
export async function retireModel(orgId: string, modelId: string): Promise<void> {
  await db
    .update(mlModels)
    .set({ status: 'retired', updatedAt: new Date() })
    .where(and(eq(mlModels.id, modelId), eq(mlModels.orgId, orgId)))
}

/**
 * Get dataset by id.
 */
export async function getDataset(orgId: string, datasetId: string) {
  const rows = await db
    .select()
    .from(mlDatasets)
    .where(and(eq(mlDatasets.id, datasetId), eq(mlDatasets.orgId, orgId)))
    .limit(1)
  return rows[0] ?? null
}
