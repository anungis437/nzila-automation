import type { AgriReadContext, AgriDbContext } from '../types'
import type { QualityInspection, InspectLotInput, GradeLotInput } from '@nzila/agri-core'

export async function listInspections(
  ctx: AgriReadContext,
  lotId: string,
): Promise<QualityInspection[]> {
  void ctx; void lotId
  return []
}

export async function getInspectionById(
  ctx: AgriReadContext,
  inspectionId: string,
): Promise<QualityInspection | null> {
  void ctx; void inspectionId
  return null
}

export async function createInspection(
  ctx: AgriDbContext,
  values: InspectLotInput,
): Promise<QualityInspection> {
  const id = crypto.randomUUID()
  return {
    id,
    orgId: ctx.orgId,
    lotId: values.lotId,
    inspectorId: ctx.actorId,
    grade: null,
    score: null,
    defects: values.defects,
    notes: values.notes,
    inspectedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }
}

export async function updateInspectionGrade(
  ctx: AgriDbContext,
  inspectionId: string,
  grade: string,
  score: number,
): Promise<void> {
  void ctx; void inspectionId; void grade; void score
  // TODO: wire to Drizzle scoped update
}
