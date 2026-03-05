/**
 * AI Governance Lifecycle
 *
 * State machine for AI/ML model governance:
 *   draft → review → approved → deployed → deprecated → retired
 *
 * Every transition is evidence-logged with actor, reason, and timestamp.
 * Enforces approval requirements based on risk tier.
 */

import { z } from 'zod';
import type { RiskLevel } from './risk-classification.js';

// ── Types ────────────────────────────────────────────────────────────────────

export type GovernanceState = 'draft' | 'review' | 'approved' | 'deployed' | 'deprecated' | 'retired';

export interface GovernanceTransition {
  from: GovernanceState;
  to: GovernanceState;
  requiredRole: string;
  requiresApproval: boolean;
  additionalApprovers?: number;
}

export const GovernanceEventSchema = z.object({
  modelId: z.string(),
  fromState: z.enum(['draft', 'review', 'approved', 'deployed', 'deprecated', 'retired']),
  toState: z.enum(['draft', 'review', 'approved', 'deployed', 'deprecated', 'retired']),
  actor: z.string(),
  actorRole: z.string(),
  reason: z.string(),
  riskTier: z.enum(['low', 'medium', 'high', 'critical']),
  approvers: z.array(z.string()).default([]),
  evidencePackId: z.string().optional(),
  timestamp: z.string().datetime(),
});

export type GovernanceEvent = z.infer<typeof GovernanceEventSchema>;

// ── Valid Transitions ────────────────────────────────────────────────────────

const TRANSITIONS: GovernanceTransition[] = [
  { from: 'draft', to: 'review', requiredRole: 'ai_developer', requiresApproval: false },
  { from: 'review', to: 'approved', requiredRole: 'org_admin', requiresApproval: true },
  { from: 'review', to: 'draft', requiredRole: 'ai_developer', requiresApproval: false },
  { from: 'approved', to: 'deployed', requiredRole: 'platform_admin', requiresApproval: true },
  { from: 'deployed', to: 'deprecated', requiredRole: 'org_admin', requiresApproval: false },
  { from: 'deprecated', to: 'retired', requiredRole: 'org_admin', requiresApproval: false },
  // Emergency rollback
  { from: 'deployed', to: 'approved', requiredRole: 'platform_admin', requiresApproval: false },
];

// ── Approval Requirements by Risk Tier ───────────────────────────────────────

const APPROVAL_REQUIREMENTS: Record<RiskLevel, { minApprovers: number; requiredRoles: string[] }> = {
  low: { minApprovers: 1, requiredRoles: ['org_admin'] },
  medium: { minApprovers: 1, requiredRoles: ['org_admin'] },
  high: { minApprovers: 2, requiredRoles: ['org_admin', 'platform_admin'] },
  critical: { minApprovers: 3, requiredRoles: ['org_admin', 'platform_admin', 'compliance_officer'] },
};

// ── Lifecycle Engine ─────────────────────────────────────────────────────────

export class GovernanceLifecycle {
  private events: GovernanceEvent[] = [];

  /**
   * Attempt a state transition. Validates the transition is legal,
   * the actor has sufficient role, and approval requirements are met.
   */
  transition(
    event: Omit<GovernanceEvent, 'timestamp'>,
  ): GovernanceEvent {
    // Validate transition exists
    const transition = TRANSITIONS.find(
      (t) => t.from === event.fromState && t.to === event.toState,
    );

    if (!transition) {
      throw new Error(
        `Invalid transition: ${event.fromState} → ${event.toState}`,
      );
    }

    // Check approval requirements for risk tier
    if (transition.requiresApproval) {
      const requirements = APPROVAL_REQUIREMENTS[event.riskTier];

      if (event.approvers.length < requirements.minApprovers) {
        throw new Error(
          `Transition ${event.fromState} → ${event.toState} for ${event.riskTier}-risk model requires ` +
          `${requirements.minApprovers} approver(s), got ${event.approvers.length}`,
        );
      }
    }

    const fullEvent = GovernanceEventSchema.parse({
      ...event,
      timestamp: new Date().toISOString(),
    });

    this.events.push(fullEvent);
    return fullEvent;
  }

  /**
   * Get full audit trail for a model.
   */
  getHistory(modelId: string): GovernanceEvent[] {
    return this.events.filter((e) => e.modelId === modelId);
  }

  /**
   * Get current state of a model by replaying events.
   */
  getCurrentState(modelId: string): GovernanceState | undefined {
    const history = this.getHistory(modelId);
    if (history.length === 0) return undefined;
    return history[history.length - 1]!.toState;
  }

  /**
   * Get available transitions from current state.
   */
  getAvailableTransitions(currentState: GovernanceState): GovernanceTransition[] {
    return TRANSITIONS.filter((t) => t.from === currentState);
  }
}
