/**
 * Orchestrator API — Evidence Pipeline
 *
 * Bridges to @nzila/os-core/evidence for command dispatch audit trails.
 * Every command lifecycle event (create, approve, dispatch, complete, fail)
 * produces a sealed evidence pack.
 */
import {
  buildEvidencePackFromAction,
  processEvidencePack,
  generateSeal,
  verifySeal,
} from '@nzila/os-core/evidence'

export interface OrchestratorEvidenceAction {
  type: 'command_create' | 'command_approve' | 'command_dispatch' | 'command_status_update'
  correlationId: string
  playbook: string
  actor: string
  metadata?: Record<string, unknown>
}

export async function buildOrchestratorEvidencePack(action: OrchestratorEvidenceAction) {
  const pack = await buildEvidencePackFromAction({
    actionId: action.correlationId,
    actionType: action.type,
    orgId: action.correlationId,
    executedBy: action.actor,
  })

  const processed = await processEvidencePack(pack)
  const seal = generateSeal({
    ...processed,
    artifacts: processed.artifacts.map((a) => ({ ...a })),
  })

  return { pack: processed, seal }
}

export { verifySeal }
