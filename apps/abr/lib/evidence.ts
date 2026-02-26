/**
 * Evidence pipeline — ABR app.
 *
 * Bridges legal/compliance actions to the NzilaOS evidence pipeline for
 * tamper-proof audit trails and regulatory attestation.
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
 * Build and seal an evidence pack for a legal compliance action.
 */
export async function buildComplianceEvidencePack(
  action: GovernanceActionContext,
): Promise<EvidencePackResult> {
  const pack = await buildEvidencePackFromAction(action)
  return processEvidencePack(pack)
}
