/**
 * @nzila/commerce-governance — Commerce Governance Gates
 *
 * Pure guard functions that enforce business rules on commerce state
 * machine transitions. Each gate returns `boolean` and conforms to
 * the `Guard<TState, TEntity>` signature from @nzila/commerce-state.
 *
 * Gates are composable: wire them into the machine `guards[]` array
 * at machine-definition time or at runtime via `withGovernanceGates()`.
 *
 * Design rules:
 * - No side effects — pure predicates only
 * - Org-scoped: every gate validates org context
 * - Configurable thresholds via `GovernancePolicy`
 * - All policy fields have sensible defaults
 *
 * @module @nzila/commerce-governance
 */
import type { OrgRole, QuoteStatus, OrderStatus, InvoiceStatus } from '@nzila/commerce-core/enums'
import type { TransitionContext, Guard, MachineDefinition, TransitionDef } from '@nzila/commerce-state'

// ── Policy Configuration ────────────────────────────────────────────────────

/**
 * Governance policy — configurable per org.
 * All thresholds are optional; defaults are applied by `resolvePolicy()`.
 */
export interface GovernancePolicy {
  /** Quote grand-total above which approval is required before accepting */
  readonly approvalThreshold: number
  /** Minimum margin percent for quote pricing to proceed */
  readonly marginFloorPercent: number
  /** Value threshold requiring manager+ role for transition */
  readonly highValueThreshold: number
  /** Roles considered "elevated" for high-value gate */
  readonly elevatedRoles: readonly OrgRole[]
  /** Minimum number of lines required on an order before confirming */
  readonly minOrderLines: number
  /** Whether evidence pack is required before issuing an invoice */
  readonly requireEvidenceForInvoice: boolean
  /** Maximum quote validity period in days (0 = unlimited) */
  readonly maxQuoteValidityDays: number
  /** Maximum discount percent allowed without manager approval */
  readonly maxDiscountWithoutApproval: number
}

const DEFAULT_POLICY: GovernancePolicy = {
  approvalThreshold: 10_000,
  marginFloorPercent: 15,
  highValueThreshold: 50_000,
  elevatedRoles: ['owner', 'admin', 'manager'] as unknown as readonly OrgRole[],
  minOrderLines: 1,
  requireEvidenceForInvoice: true,
  maxQuoteValidityDays: 90,
  maxDiscountWithoutApproval: 20,
} as const

/**
 * Resolve a partial policy, filling in defaults.
 */
export function resolvePolicy(partial?: Partial<GovernancePolicy>): GovernancePolicy {
  if (!partial) return DEFAULT_POLICY
  return { ...DEFAULT_POLICY, ...partial }
}

// ── Gate Result Accumulator ─────────────────────────────────────────────────

/**
 * Structured gate evaluation result for audit / diagnostics.
 * Gates themselves return boolean for the engine; this type is for
 * the `evaluateGates()` diagnostic function.
 */
export interface GateResult {
  readonly gate: string
  readonly passed: boolean
  readonly reason: string
}

// ── Entity Shapes for Guard Evaluation ──────────────────────────────────────

/** Minimal entity shape a quote guard needs to inspect */
export interface QuoteEntity {
  readonly orgId: string
  readonly grandTotal: number
  readonly approvalFlags: readonly { readonly reason: string; readonly threshold: number; readonly actualValue: number }[]
  readonly marginPercent: number
  readonly discountPercent: number
  readonly validUntil: string | null
  readonly hasApproval: boolean
  readonly lineCount: number
}

/** Minimal entity shape an order guard needs to inspect */
export interface OrderEntity {
  readonly orgId: string
  readonly grandTotal: number
  readonly lineCount: number
  readonly quoteSnapshotHash: string | null
}

/** Minimal entity shape an invoice guard needs to inspect */
export interface InvoiceEntity {
  readonly orgId: string
  readonly grandTotal: number
  readonly hasEvidencePack: boolean
  readonly lineCount: number
}

// ── Quote Guards ────────────────────────────────────────────────────────────

/**
 * Approval gate: blocks quote acceptance when grand total exceeds threshold
 * and no approval has been recorded.
 */
export function createApprovalRequiredGate(
  policy?: Partial<GovernancePolicy>,
): Guard<QuoteStatus, QuoteEntity> {
  const resolved = resolvePolicy(policy)
  return (_ctx, entity, _from, to) => {
    // Only enforce on transitions TO accepted
    if (to !== 'accepted') return true
    // If below threshold, no approval needed
    if (entity.grandTotal <= resolved.approvalThreshold) return true
    // Above threshold — require approval
    return entity.hasApproval
  }
}

/**
 * Margin floor gate: blocks transition out of pricing if margin is below floor.
 */
export function createMarginFloorGate(
  policy?: Partial<GovernancePolicy>,
): Guard<QuoteStatus, QuoteEntity> {
  const resolved = resolvePolicy(policy)
  return (_ctx, entity, from, _to) => {
    // Only enforce when leaving pricing state
    if (from !== 'pricing') return true
    return entity.marginPercent >= resolved.marginFloorPercent
  }
}

/**
 * Discount cap gate: blocks transitions when discount exceeds cap
 * and actor does not have an elevated role.
 */
export function createDiscountCapGate(
  policy?: Partial<GovernancePolicy>,
): Guard<QuoteStatus, QuoteEntity> {
  const resolved = resolvePolicy(policy)
  return (ctx, entity) => {
    if (entity.discountPercent <= resolved.maxDiscountWithoutApproval) return true
    // Discount above cap — only elevated roles can proceed
    return (resolved.elevatedRoles as readonly string[]).includes(ctx.role)
  }
}

/**
 * Quote validity gate: blocks send if validity period exceeds max.
 */
export function createQuoteValidityGate(
  policy?: Partial<GovernancePolicy>,
): Guard<QuoteStatus, QuoteEntity> {
  const resolved = resolvePolicy(policy)
  return (_ctx, entity, _from, to) => {
    if (resolved.maxQuoteValidityDays === 0) return true // unlimited
    if (to !== 'sent') return true
    if (!entity.validUntil) return true // no expiry set — allowed
    const now = Date.now()
    const validUntilMs = new Date(entity.validUntil).getTime()
    const diffDays = (validUntilMs - now) / (1000 * 60 * 60 * 24)
    return diffDays <= resolved.maxQuoteValidityDays
  }
}

/**
 * Quote completeness gate: blocks send if quote has no lines.
 */
export function createQuoteCompletenessGate(): Guard<QuoteStatus, QuoteEntity> {
  return (_ctx, entity, _from, to) => {
    if (to !== 'sent' && to !== 'ready') return true
    return entity.lineCount > 0
  }
}

// ── Order Guards ────────────────────────────────────────────────────────────

/**
 * Order completeness gate: requires minimum line count before confirming.
 */
export function createOrderCompletenessGate(
  policy?: Partial<GovernancePolicy>,
): Guard<OrderStatus, OrderEntity> {
  const resolved = resolvePolicy(policy)
  return (_ctx, entity, _from, to) => {
    if (to !== 'confirmed') return true
    return entity.lineCount >= resolved.minOrderLines
  }
}

/**
 * High-value gate: blocks transitions for high-value orders unless
 * actor has an elevated role.
 */
export function createHighValueGate<TState extends string, TEntity extends { grandTotal: number }>(
  policy?: Partial<GovernancePolicy>,
): Guard<TState, TEntity> {
  const resolved = resolvePolicy(policy)
  return (ctx, entity) => {
    if (entity.grandTotal <= resolved.highValueThreshold) return true
    return (resolved.elevatedRoles as readonly string[]).includes(ctx.role)
  }
}

/**
 * Quote snapshot integrity gate: blocks order confirmation if no
 * locked snapshot hash is present.
 */
export function createSnapshotIntegrityGate(): Guard<OrderStatus, OrderEntity> {
  return (_ctx, entity, _from, to) => {
    if (to !== 'confirmed') return true
    return entity.quoteSnapshotHash !== null && entity.quoteSnapshotHash.length > 0
  }
}

// ── Invoice Guards ──────────────────────────────────────────────────────────

/**
 * Evidence required gate: blocks invoice issuance unless evidence pack exists.
 */
export function createEvidenceRequiredGate(
  policy?: Partial<GovernancePolicy>,
): Guard<InvoiceStatus, InvoiceEntity> {
  const resolved = resolvePolicy(policy)
  return (_ctx, entity, _from, to) => {
    if (!resolved.requireEvidenceForInvoice) return true
    if (to !== 'issued') return true
    return entity.hasEvidencePack
  }
}

/**
 * Invoice completeness gate: requires at least one line item.
 */
export function createInvoiceCompletenessGate(): Guard<InvoiceStatus, InvoiceEntity> {
  return (_ctx, entity, _from, to) => {
    if (to !== 'issued') return true
    return entity.lineCount > 0
  }
}

// ── Diagnostic Evaluator ────────────────────────────────────────────────────

/**
 * Evaluate a named list of gates and return structured results.
 * For audit/diagnostics — not used inside the engine itself.
 */
export function evaluateGates<TState extends string, TEntity>(
  gates: readonly { readonly name: string; readonly guard: Guard<TState, TEntity> }[],
  ctx: TransitionContext,
  entity: TEntity,
  from: TState,
  to: TState,
): readonly GateResult[] {
  return gates.map(({ name, guard }) => {
    const passed = guard(ctx, entity, from, to)
    return {
      gate: name,
      passed,
      reason: passed ? 'passed' : `Gate "${name}" blocked transition ${from} → ${to}`,
    }
  })
}

// ── Machine Enhancer ────────────────────────────────────────────────────────

/**
 * Enhance a machine definition by injecting governance guards into
 * matching transitions. Returns a new machine — does not mutate.
 *
 * @param machine   - The base machine definition
 * @param selector  - Predicate selecting which transitions to enhance
 * @param guards    - Guard functions to inject
 */
export function withGovernanceGates<TState extends string, TEntity>(
  machine: MachineDefinition<TState, TEntity>,
  selector: (transition: TransitionDef<TState, TEntity>) => boolean,
  guards: readonly Guard<TState, TEntity>[],
): MachineDefinition<TState, TEntity> {
  return {
    ...machine,
    transitions: machine.transitions.map((t) => {
      if (!selector(t)) return t
      return {
        ...t,
        guards: [...t.guards, ...guards],
      }
    }),
  }
}

/**
 * Create a default governance-enhanced quote machine.
 * Wires approval, margin-floor, discount-cap, validity, and completeness gates.
 */
export function createGovernedQuoteMachine(
  baseMachine: MachineDefinition<QuoteStatus, QuoteEntity>,
  policy?: Partial<GovernancePolicy>,
): MachineDefinition<QuoteStatus, QuoteEntity> {
  const approvalGate = createApprovalRequiredGate(policy)
  const marginGate = createMarginFloorGate(policy)
  const discountGate = createDiscountCapGate(policy)
  const validityGate = createQuoteValidityGate(policy)
  const completenessGate = createQuoteCompletenessGate()

  let governed = withGovernanceGates(
    baseMachine,
    (t) => t.to === ('accepted' as QuoteStatus),
    [approvalGate],
  )
  governed = withGovernanceGates(
    governed,
    (t) => t.from === ('pricing' as QuoteStatus),
    [marginGate],
  )
  governed = withGovernanceGates(
    governed,
    () => true,
    [discountGate],
  )
  governed = withGovernanceGates(
    governed,
    (t) => t.to === ('sent' as QuoteStatus) || t.to === ('ready' as QuoteStatus),
    [validityGate, completenessGate],
  )
  return governed
}

/**
 * Create a default governance-enhanced order machine.
 * Wires completeness, high-value, and snapshot integrity gates.
 */
export function createGovernedOrderMachine(
  baseMachine: MachineDefinition<OrderStatus, OrderEntity>,
  policy?: Partial<GovernancePolicy>,
): MachineDefinition<OrderStatus, OrderEntity> {
  const completenessGate = createOrderCompletenessGate(policy)
  const highValueGate = createHighValueGate<OrderStatus, OrderEntity>(policy)
  const snapshotGate = createSnapshotIntegrityGate()

  let governed = withGovernanceGates(
    baseMachine,
    (t) => t.to === ('confirmed' as OrderStatus),
    [completenessGate, snapshotGate],
  )
  governed = withGovernanceGates(
    governed,
    () => true,
    [highValueGate],
  )
  return governed
}

/**
 * Create a default governance-enhanced invoice machine.
 * Wires evidence-required and completeness gates.
 */
export function createGovernedInvoiceMachine(
  baseMachine: MachineDefinition<InvoiceStatus, InvoiceEntity>,
  policy?: Partial<GovernancePolicy>,
): MachineDefinition<InvoiceStatus, InvoiceEntity> {
  const evidenceGate = createEvidenceRequiredGate(policy)
  const completenessGate = createInvoiceCompletenessGate()

  return withGovernanceGates(
    baseMachine,
    (t) => t.to === ('issued' as InvoiceStatus),
    [evidenceGate, completenessGate],
  )
}
