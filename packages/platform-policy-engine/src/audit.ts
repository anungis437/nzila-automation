/**
 * @nzila/platform-policy-engine — Audit
 *
 * Records and retrieves policy evaluation audit entries.
 * Every policy decision is persisted for governance traceability.
 *
 * @module @nzila/platform-policy-engine/audit
 */
import { randomUUID } from 'node:crypto'
import { createLogger } from '@nzila/os-core/telemetry'
import type {
  PolicyAuditEntry,
  PolicyEnginePorts,
  PolicyEvaluationOutput,
} from './types'

const logger = createLogger('policy-audit')

/**
 * Record a policy evaluation as an audit entry.
 */
export async function recordPolicyAudit(
  output: PolicyEvaluationOutput,
  ports: PolicyEnginePorts,
): Promise<PolicyAuditEntry> {
  const entry: PolicyAuditEntry = {
    id: randomUUID(),
    evaluationId: output.evaluationId,
    policyId: output.policyId,
    actor: output.input.actor,
    action: output.input.action,
    resource: output.input.resource,
    overallResult: output.overallResult,
    decisions: output.decisions,
    orgId: output.input.orgId,
    environment: output.input.environment,
    timestamp: output.evaluatedAt,
  }

  await ports.recordAudit(entry)

  logger.info('Policy audit recorded', {
    auditId: entry.id,
    evaluationId: entry.evaluationId,
    policyId: entry.policyId,
    result: entry.overallResult,
  })

  return entry
}

/**
 * Retrieve recent policy audit entries for an org.
 */
export async function getOrgPolicyAudit(
  orgId: string,
  ports: PolicyEnginePorts,
  limit = 100,
): Promise<readonly PolicyAuditEntry[]> {
  return ports.loadAuditEntries(orgId, limit)
}
