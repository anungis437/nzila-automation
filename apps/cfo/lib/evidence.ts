/**
 * Evidence pipeline — CFO app.
 *
 * Bridges financial actions to the NzilaOS evidence pipeline for tamper-proof
 * audit trails, regulatory compliance, and governance attestation.
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
 * Build and seal an evidence pack for a financial governance action.
 */
export async function buildFinancialEvidencePack(
  action: GovernanceActionContext,
): Promise<EvidencePackResult> {
  const pack = await buildEvidencePackFromAction(action)
  return processEvidencePack(pack)
}
