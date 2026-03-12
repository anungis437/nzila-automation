/**
 * @nzila/platform-decision-engine — Decision export
 *
 * Packages decisions into export packs with integrity hashes.
 *
 * @module @nzila/platform-decision-engine/export
 */
import type { DecisionRecord, DecisionExportPack } from './types'
import { computeHash, nowISO } from './utils'
import { loadAuditTrail } from './audit'
import { loadDecisionFeedback } from './store'

/**
 * Create a full decision export pack for procurement or audit purposes.
 */
export function createDecisionExportPack(decision: DecisionRecord): DecisionExportPack {
  const auditTrail = loadAuditTrail(decision.decision_id)
  const feedback = loadDecisionFeedback(decision.decision_id)

  const packData = {
    decision_record: decision,
    evidence_refs: decision.evidence_refs,
    policy_context: decision.policy_context,
    governance_status_snapshot: {},
    change_status_snapshot: {},
    audit_trail: auditTrail,
    feedback_history: feedback,
  }

  return {
    decision_record: decision,
    evidence_refs: [...decision.evidence_refs],
    policy_context: { ...decision.policy_context },
    governance_status_snapshot: {},
    change_status_snapshot: {},
    output_hash: computeHash(packData),
    exported_at: nowISO(),
  }
}
