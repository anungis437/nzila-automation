import type { AgriReadContext, AgriDbContext } from '../types'
import type { QualityInspection, InspectLotInput, GradeLotInput as _GradeLotInput } from '@nzila/agri-core'
import { db } from '@nzila/db'
import { agriInspections } from '@nzila/db/schema'
import { eq, and } from 'drizzle-orm'

function toInspection(row: typeof agriInspections.$inferSelect): QualityInspection {
  return {
    id: row.id,
    orgId: row.orgId,
    lotId: row.lotId,
    inspectorId: row.inspectorId,
    grade: row.grade ?? null,
    score: row.score ? Number(row.score) : null,
    defects: (row.defects ?? {}) as Record<string, unknown>,
    notes: row.notes ?? null,
    inspectedAt: row.inspectedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listInspections(
  ctx: AgriReadContext,
  lotId: string,
): Promise<QualityInspection[]> {
  const rows = await db
    .select()
    .from(agriInspections)
    .where(and(eq(agriInspections.orgId, ctx.orgId), eq(agriInspections.lotId, lotId)))
  return rows.map(toInspection)
}

export async function getInspectionById(
  ctx: AgriReadContext,
  inspectionId: string,
): Promise<QualityInspection | null> {
  const [row] = await db
    .select()
    .from(agriInspections)
    .where(and(eq(agriInspections.orgId, ctx.orgId), eq(agriInspections.id, inspectionId)))
    .limit(1)
  return row ? toInspection(row) : null
}

export async function createInspection(
  ctx: AgriDbContext,
  values: InspectLotInput,
): Promise<QualityInspection> {
  const [row] = await db
    .insert(agriInspections)
    .values({
      orgId: ctx.orgId,
      lotId: values.lotId,
      inspectorId: ctx.actorId,
      defects: values.defects,
      notes: values.notes,
      inspectedAt: new Date(),
    })
    .returning()
  return toInspection(row!)
}

export async function updateInspectionGrade(
  ctx: AgriDbContext,
  inspectionId: string,
  grade: string,
  score: number,
): Promise<void> {
  await db
    .update(agriInspections)
    .set({ grade, score: score.toString() })
    .where(and(eq(agriInspections.orgId, ctx.orgId), eq(agriInspections.id, inspectionId)))
}
