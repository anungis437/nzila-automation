/**
 * @nzila/commerce-observability — Structured Logging
 *
 * Commerce-specific structured log helpers.
 *
 * All log entries follow the Nzila structured logging convention:
 *   - JSON lines format
 *   - Always include orgId (entityId) — never PII
 *   - Include correlationId for trace correlation
 *   - Level: debug | info | warn | error
 *   - Machine-parseable by log aggregators (Azure Monitor, ELK, Loki)
 *
 * DESIGN RULES:
 *   1. Never log PII (emails, names, addresses)
 *   2. Always include orgId for org-scoped log filtering
 *   3. Always include correlationId for distributed trace correlation
 *   4. Use structured fields, not string interpolation
 *   5. All amounts in cents (integers) — never floating point
 *
 * @module @nzila/commerce-observability/logging
 */

// ── Log Level ─────────────────────────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// ── Log Entry ─────────────────────────────────────────────────────────────

export interface CommerceLogEntry {
  readonly timestamp: string
  readonly level: LogLevel
  readonly module: string
  readonly message: string
  readonly orgId: string
  readonly correlationId?: string
  readonly actorId?: string
  readonly data?: Record<string, unknown>
}

// ── Log Context ───────────────────────────────────────────────────────────

export interface CommerceLogContext {
  readonly orgId: string
  readonly correlationId?: string
  readonly actorId?: string
}

// ── Structured Log Builders ───────────────────────────────────────────────

/**
 * Build a structured log entry for a state machine transition.
 */
export function logTransition(
  ctx: CommerceLogContext,
  machine: string,
  from: string,
  to: string,
  ok: boolean,
  details?: Record<string, unknown>,
): CommerceLogEntry {
  return {
    timestamp: new Date().toISOString(),
    level: ok ? 'info' : 'warn',
    module: 'commerce-state',
    message: ok
      ? `Transition ${machine}: ${from} → ${to}`
      : `Transition BLOCKED ${machine}: ${from} → ${to}`,
    orgId: ctx.orgId,
    correlationId: ctx.correlationId,
    actorId: ctx.actorId,
    data: { machine, from, to, ok, ...details },
  }
}

/**
 * Build a structured log entry for a saga execution.
 */
export function logSagaExecution(
  ctx: CommerceLogContext,
  sagaName: string,
  status: string,
  stepsCompleted: readonly string[],
  error?: string,
): CommerceLogEntry {
  const level: LogLevel = status === 'completed' ? 'info'
    : status === 'compensated' ? 'warn'
    : 'error'

  return {
    timestamp: new Date().toISOString(),
    level,
    module: 'commerce-sagas',
    message: `Saga ${sagaName}: ${status}`,
    orgId: ctx.orgId,
    correlationId: ctx.correlationId,
    actorId: ctx.actorId,
    data: { sagaName, status, stepsCompleted, error },
  }
}

/**
 * Build a structured log entry for a governance gate evaluation.
 */
export function logGovernanceGate(
  ctx: CommerceLogContext,
  machine: string,
  gate: string,
  passed: boolean,
  reason?: string,
): CommerceLogEntry {
  return {
    timestamp: new Date().toISOString(),
    level: passed ? 'debug' : 'warn',
    module: 'commerce-governance',
    message: passed
      ? `Gate PASS ${machine}/${gate}`
      : `Gate FAIL ${machine}/${gate}: ${reason ?? 'policy violation'}`,
    orgId: ctx.orgId,
    correlationId: ctx.correlationId,
    actorId: ctx.actorId,
    data: { machine, gate, passed, reason },
  }
}

/**
 * Build a structured log entry for an org mismatch attempt.
 * This is always level 'error' — it indicates a security boundary violation attempt.
 */
export function logOrgMismatch(
  ctx: CommerceLogContext,
  machine: string,
  attemptedOrgId: string,
  resourceOrgId: string,
): CommerceLogEntry {
  return {
    timestamp: new Date().toISOString(),
    level: 'error',
    module: 'commerce-state',
    message: `ORG MISMATCH: ${machine} transition attempt — actor org ${attemptedOrgId} ≠ resource org ${resourceOrgId}`,
    orgId: ctx.orgId,
    correlationId: ctx.correlationId,
    actorId: ctx.actorId,
    data: { machine, attemptedOrgId, resourceOrgId, securityEvent: true },
  }
}

/**
 * Build a structured log entry for an evidence pack operation.
 */
export function logEvidencePack(
  ctx: CommerceLogContext,
  packId: string,
  controlFamily: string,
  artifactCount: number,
  valid: boolean,
): CommerceLogEntry {
  return {
    timestamp: new Date().toISOString(),
    level: valid ? 'info' : 'error',
    module: 'commerce-evidence',
    message: valid
      ? `Evidence pack ${packId} created (${artifactCount} artifacts, ${controlFamily})`
      : `Evidence pack ${packId} VALIDATION FAILED (${controlFamily})`,
    orgId: ctx.orgId,
    correlationId: ctx.correlationId,
    actorId: ctx.actorId,
    data: { packId, controlFamily, artifactCount, valid },
  }
}

/**
 * Build a structured log entry for an audit trail operation.
 */
export function logAuditTrail(
  ctx: CommerceLogContext,
  entityType: string,
  action: string,
  entityId: string,
): CommerceLogEntry {
  return {
    timestamp: new Date().toISOString(),
    level: 'info',
    module: 'commerce-audit',
    message: `Audit: ${entityType}/${action} for ${entityId}`,
    orgId: ctx.orgId,
    correlationId: ctx.correlationId,
    actorId: ctx.actorId,
    data: { entityType, action, entityId },
  }
}
