/**
 * @nzila/trade-core — Audit entry builder
 *
 * Pure functions for building audit entries from FSM transitions.
 * Follows the same pattern as @nzila/commerce-audit.
 */

import { createHash } from 'node:crypto'
import type { TradeOrgRole } from './enums'
import type { TradeAuditEntry } from './types/index'
import type { TradeTransitionSuccess } from './machines/engine'

// ── Build audit from transition ─────────────────────────────────────────────

export interface BuildAuditOpts {
  readonly id: string
  readonly orgId: string
  readonly actorId: string
  readonly role: TradeOrgRole
  readonly entityType: string
  readonly targetEntityId: string
}

export function buildTransitionAuditEntry(
  result: TradeTransitionSuccess,
  opts: BuildAuditOpts,
): TradeAuditEntry {
  return {
    id: opts.id,
    orgId: opts.orgId,
    actorId: opts.actorId,
    role: opts.role,
    entityType: opts.entityType,
    targetEntityId: opts.targetEntityId,
    action: 'transitioned',
    fromState: result.from,
    toState: result.to,
    label: result.label,
    metadata: {},
    eventsEmitted: result.eventsToEmit.map((e) => e.type),
    actionsScheduled: result.actionsToSchedule.map((a) => a.type),
    timestamp: new Date(),
  }
}

export function buildActionAuditEntry(
  opts: BuildAuditOpts & {
    action: string
    label: string
    metadata?: Record<string, unknown>
  },
): TradeAuditEntry {
  return {
    id: opts.id,
    orgId: opts.orgId,
    actorId: opts.actorId,
    role: opts.role,
    entityType: opts.entityType,
    targetEntityId: opts.targetEntityId,
    action: opts.action,
    fromState: null,
    toState: null,
    label: opts.label,
    metadata: opts.metadata ?? {},
    eventsEmitted: [],
    actionsScheduled: [],
    timestamp: new Date(),
  }
}

// ── Hash for integrity ──────────────────────────────────────────────────────

export function hashAuditEntry(entry: TradeAuditEntry): string {
  const sorted = JSON.stringify(entry, Object.keys(entry).sort())
  return createHash('sha256').update(sorted).digest('hex')
}

export function validateAuditEntry(entry: TradeAuditEntry): boolean {
  return !!(
    entry.id &&
    entry.orgId &&
    entry.actorId &&
    entry.entityType &&
    entry.targetEntityId &&
    entry.action &&
    entry.timestamp
  )
}
