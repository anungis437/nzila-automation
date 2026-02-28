/**
 * @nzila/commerce-observability — Span Helpers
 *
 * Commerce-specific span wrappers and attribute conventions for distributed tracing.
 *
 * Builds on top of @nzila/os-core/telemetry withSpan helper but adds:
 *   - Commerce-specific attribute names
 *   - Automatic metric recording from span outcomes
 *   - Org-scoped span attributes (never PII)
 *
 * ATTRIBUTE CONVENTIONS:
 *   commerce.machine    → quote | order | invoice | fulfillment
 *   commerce.from_state → source state (lowercase)
 *   commerce.to_state   → target state (lowercase)
 *   commerce.transition → label of the transition
 *   commerce.saga       → saga name
 *   commerce.step       → saga step name
 *   commerce.gate       → governance gate name
 *   nzila.org_id     → org identifier (from os-core convention)
 *
 * @module @nzila/commerce-observability/spans
 */

// ── Span Attribute Constants ──────────────────────────────────────────────

export const COMMERCE_SPAN_ATTR = {
  MACHINE: 'commerce.machine',
  FROM_STATE: 'commerce.from_state',
  TO_STATE: 'commerce.to_state',
  TRANSITION_LABEL: 'commerce.transition',
  TRANSITION_OK: 'commerce.transition_ok',
  FAILURE_CODE: 'commerce.failure_code',
  SAGA_NAME: 'commerce.saga',
  SAGA_STATUS: 'commerce.saga_status',
  STEP_NAME: 'commerce.step',
  GATE_NAME: 'commerce.gate',
  GATE_PASSED: 'commerce.gate_passed',
  ENTITY_ID: 'nzila.org_id',
  ACTOR_ID: 'nzila.actor_id',
  EVIDENCE_PACK_ID: 'commerce.evidence_pack_id',
  CONTROL_FAMILY: 'commerce.control_family',
  AUDIT_ACTION: 'commerce.audit_action',
} as const

export type CommerceSpanAttribute = typeof COMMERCE_SPAN_ATTR[keyof typeof COMMERCE_SPAN_ATTR]

// ── Span Name Constants ───────────────────────────────────────────────────

export const COMMERCE_SPAN = {
  TRANSITION: 'commerce.transition',
  SAGA_EXECUTE: 'commerce.saga.execute',
  SAGA_STEP: 'commerce.saga.step',
  SAGA_COMPENSATE: 'commerce.saga.compensate',
  GOVERNANCE_EVALUATE: 'commerce.governance.evaluate',
  AUDIT_ENTRY: 'commerce.audit.entry',
  AUDIT_HASH: 'commerce.audit.hash',
  EVIDENCE_PACK: 'commerce.evidence.pack',
  EVIDENCE_SEAL: 'commerce.evidence.seal',
} as const

export type CommerceSpanName = typeof COMMERCE_SPAN[keyof typeof COMMERCE_SPAN]

// ── Span Attribute Builders ───────────────────────────────────────────────

export interface TransitionSpanAttributes {
  readonly [COMMERCE_SPAN_ATTR.MACHINE]: string
  readonly [COMMERCE_SPAN_ATTR.FROM_STATE]: string
  readonly [COMMERCE_SPAN_ATTR.TO_STATE]: string
  readonly [COMMERCE_SPAN_ATTR.ENTITY_ID]: string
}

export interface SagaSpanAttributes {
  readonly [COMMERCE_SPAN_ATTR.SAGA_NAME]: string
  readonly [COMMERCE_SPAN_ATTR.ENTITY_ID]: string
  readonly [COMMERCE_SPAN_ATTR.ACTOR_ID]: string
}

/**
 * Build span attributes for a state machine transition.
 *
 * @param machine - Machine type (quote, order, invoice, fulfillment)
 * @param from    - Source state
 * @param to      - Target state
 * @param orgId   - Org identifier (orgId)
 */
export function buildTransitionSpanAttrs(
  machine: string,
  from: string,
  to: string,
  orgId: string,
): Record<string, string> {
  return {
    [COMMERCE_SPAN_ATTR.MACHINE]: machine,
    [COMMERCE_SPAN_ATTR.FROM_STATE]: from,
    [COMMERCE_SPAN_ATTR.TO_STATE]: to,
    [COMMERCE_SPAN_ATTR.ENTITY_ID]: orgId,
  }
}

/**
 * Build span attributes for a saga execution.
 *
 * @param sagaName - Saga identifier
 * @param orgId    - Org identifier
 * @param actorId  - Actor who triggered the saga
 */
export function buildSagaSpanAttrs(
  sagaName: string,
  orgId: string,
  actorId: string,
): Record<string, string> {
  return {
    [COMMERCE_SPAN_ATTR.SAGA_NAME]: sagaName,
    [COMMERCE_SPAN_ATTR.ENTITY_ID]: orgId,
    [COMMERCE_SPAN_ATTR.ACTOR_ID]: actorId,
  }
}

/**
 * Build span attributes for a governance gate evaluation.
 *
 * @param machine - Machine type
 * @param gate    - Gate/guard name
 * @param orgId   - Org identifier
 * @param passed  - Whether the gate passed
 */
export function buildGateSpanAttrs(
  machine: string,
  gate: string,
  orgId: string,
  passed: boolean,
): Record<string, string | boolean> {
  return {
    [COMMERCE_SPAN_ATTR.MACHINE]: machine,
    [COMMERCE_SPAN_ATTR.GATE_NAME]: gate,
    [COMMERCE_SPAN_ATTR.ENTITY_ID]: orgId,
    [COMMERCE_SPAN_ATTR.GATE_PASSED]: passed,
  }
}

/**
 * Build span attributes for an evidence pack operation.
 *
 * @param packId        - Evidence pack ID
 * @param controlFamily - Control family (e.g. 'SOC2-CC6.1')
 * @param orgId         - Org identifier
 */
export function buildEvidenceSpanAttrs(
  packId: string,
  controlFamily: string,
  orgId: string,
): Record<string, string> {
  return {
    [COMMERCE_SPAN_ATTR.EVIDENCE_PACK_ID]: packId,
    [COMMERCE_SPAN_ATTR.CONTROL_FAMILY]: controlFamily,
    [COMMERCE_SPAN_ATTR.ENTITY_ID]: orgId,
  }
}
