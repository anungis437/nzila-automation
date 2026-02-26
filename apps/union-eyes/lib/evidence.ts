/**
 * Evidence pipeline — Union-Eyes app.
 *
 * Bridges union/labor governance actions to the NzilaOS evidence pipeline for
 * tamper-proof audit trails on grievances, elections, dues, and compliance.
 */
import {
  buildEvidencePackFromAction,
  processEvidencePack,
  generateSeal,
  verifySeal,
  type GovernanceActionContext,
  type EvidencePackResult,
} from '@nzila/os-core/evidence'

export { generateSeal, verifySeal }
export type { EvidencePackResult }

/**
 * Build and seal an evidence pack for a union governance action.
 *
 * @example
 * ```ts
 * const result = await buildUnionEvidencePack({
 *   actionType: 'GRIEVANCE_RESOLVED',
 *   entityId: grievanceId,
 *   actorId: userId,
 *   artifacts: [{ type: 'resolution', data: resolution }],
 * })
 * ```
 */
export async function buildUnionEvidencePack(
  action: GovernanceActionContext,
): Promise<EvidencePackResult> {
  const pack = await buildEvidencePackFromAction(action)
  return processEvidencePack(pack)
}
