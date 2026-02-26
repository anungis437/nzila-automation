/**
 * Evidence pipeline — NACP Exams app.
 *
 * Bridges exam lifecycle actions to the NzilaOS evidence pipeline for
 * tamper-proof audit trails on exam sessions, results, and certifications.
 */
import {
  buildEvidencePackFromAction,
  processEvidencePack,
  generateSeal,
  verifySeal,
  type GovernanceActionContext,
  type EvidencePackResult,
} from '@nzila/os-core/evidence'

export { generateSeal, verifySeal, buildEvidencePackFromAction, processEvidencePack }
export type { EvidencePackResult }

/** App-level evidence action context used by exam action files. */
export interface ExamEvidenceAction {
  action: string
  entityType: string
  entityId: string
  actorId: string
  payload?: Record<string, unknown>
}

/**
 * Build and seal an evidence pack for an exam governance action.
 * Accepts either a GovernanceActionContext or the simpler ExamEvidenceAction shape.
 */
export async function buildExamEvidencePack(
  action: GovernanceActionContext | ExamEvidenceAction,
): Promise<EvidencePackResult> {
  const ctx: GovernanceActionContext = 'actionId' in action
    ? action
    : {
        actionId: action.entityId,
        actionType: action.action,
        entityId: action.entityId,
        executedBy: action.actorId,
      }
  const pack = await buildEvidencePackFromAction(ctx)
  return processEvidencePack(pack)
}
