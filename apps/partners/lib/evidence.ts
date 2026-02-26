/**
 * Evidence pipeline — Partners app.
 *
 * Bridges partner lifecycle actions to the NzilaOS evidence pipeline for
 * tamper-proof audit trails on deals, commissions, and certifications.
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
 * Build and seal an evidence pack for a partner governance action.
 */
export async function buildPartnerEvidencePack(
  action: GovernanceActionContext,
): Promise<EvidencePackResult> {
  const pack = await buildEvidencePackFromAction(action)
  return processEvidencePack(pack)
}
