/**
 * Evidence pipeline — Zonga app.
 *
 * Bridges content/revenue actions to the NzilaOS evidence pipeline for
 * tamper-proof audit trails on royalty distributions and content rights.
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

/**
 * Build and seal an evidence pack for a content/royalty governance action.
 */
export async function buildContentEvidencePack(
  action: GovernanceActionContext,
): Promise<EvidencePackResult> {
  const pack = await buildEvidencePackFromAction(action)
  return processEvidencePack(pack)
}
