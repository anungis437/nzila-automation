/**
 * @nzila/commerce-audit — Commerce Evidence Integration
 *
 * Bridges the commerce domain (quotes, orders, invoices, fulfillment)
 * with the NzilaOS evidence infrastructure (@nzila/os-core/evidence).
 *
 * Provides:
 *  - COMMERCE_CONTROL_MAPPINGS: which control family each entity type maps to
 *  - buildCommerceEvidencePack: produce an EvidencePackRequest for a commerce
 *    entity lifecycle (e.g., quote accepted, order completed, invoice paid)
 *  - computeAuditTrailHash: SHA-256 hash of a serialized audit trail
 *
 * Pure functions — no I/O, no DB. The caller provides entity data and
 * the evidence infrastructure handles upload and sealing.
 *
 * @module @nzila/commerce-audit/evidence
 */
import { createHash } from 'node:crypto'
import type { EvidenceType } from '@nzila/commerce-core/enums'
import type { AuditEntry } from './audit'
import { CommerceEntityType } from './audit'

// ── Control Family Mappings ─────────────────────────────────────────────────

/**
 * Maps commerce entity types to evidence control families.
 * Compatible with @nzila/os-core/evidence ControlFamily values.
 */
export const COMMERCE_CONTROL_MAPPINGS = {
  [CommerceEntityType.QUOTE]: {
    controlFamily: 'integrity' as const,
    retentionClass: '7_YEARS' as const,
    controlsCovered: ['INT-10', 'INT-11'],
  },
  [CommerceEntityType.ORDER]: {
    controlFamily: 'integrity' as const,
    retentionClass: '7_YEARS' as const,
    controlsCovered: ['INT-10', 'INT-12'],
  },
  [CommerceEntityType.INVOICE]: {
    controlFamily: 'integrity' as const,
    retentionClass: '7_YEARS' as const,
    controlsCovered: ['INT-10', 'INT-13'],
  },
  [CommerceEntityType.FULFILLMENT]: {
    controlFamily: 'integrity' as const,
    retentionClass: '3_YEARS' as const,
    controlsCovered: ['INT-10', 'INT-14'],
  },
  [CommerceEntityType.PAYMENT]: {
    controlFamily: 'integrity' as const,
    retentionClass: '7_YEARS' as const,
    controlsCovered: ['INT-10', 'INT-15'],
  },
  [CommerceEntityType.REFUND]: {
    controlFamily: 'integrity' as const,
    retentionClass: '7_YEARS' as const,
    controlsCovered: ['INT-10', 'INT-16'],
  },
} as const

export type CommerceControlMapping = (typeof COMMERCE_CONTROL_MAPPINGS)[keyof typeof COMMERCE_CONTROL_MAPPINGS]

// ── Evidence Pack Builder ───────────────────────────────────────────────────

/**
 * Descriptor for a commerce evidence artifact (pre-upload).
 */
export interface CommerceArtifactDescriptor {
  /** Artifact type from commerce-core EvidenceType enum */
  readonly type: EvidenceType
  /** Display filename */
  readonly filename: string
  /** Raw data */
  readonly buffer: Buffer
  /** MIME type */
  readonly contentType: string
  /** Optional description */
  readonly description?: string
}

/**
 * Request to build a commerce evidence pack.
 */
export interface CommerceEvidenceRequest {
  /** Org scope */
  readonly orgId: string
  /** Commerce entity type (quote, order, invoice, etc.) */
  readonly entityType: CommerceEntityType
  /** ID of the commerce entity generating evidence */
  readonly targetEntityId: string
  /** Triggering event (e.g., "quote.accepted", "order.completed") */
  readonly triggerEvent: string
  /** Actor who triggered the event */
  readonly actorId: string
  /** Audit trail entries for this entity */
  readonly auditTrail: readonly AuditEntry[]
  /** Additional artifacts (PDFs, snapshots, etc.) */
  readonly artifacts?: readonly CommerceArtifactDescriptor[]
}

/**
 * Result of building a commerce evidence pack (pre-upload metadata).
 */
export interface CommerceEvidencePackResult {
  /** Generated pack ID */
  readonly packId: string
  /** Org scope */
  readonly orgId: string
  /** Control family from COMMERCE_CONTROL_MAPPINGS */
  readonly controlFamily: string
  /** Controls covered */
  readonly controlsCovered: readonly string[]
  /** Retention class */
  readonly retentionClass: string
  /** Summary description */
  readonly summary: string
  /** Audit trail hash (SHA-256) */
  readonly auditTrailHash: string
  /** Number of artifacts (including audit trail) */
  readonly artifactCount: number
  /** ISO 8601 timestamp */
  readonly createdAt: string
}

/**
 * Build a commerce evidence pack descriptor from a lifecycle event.
 *
 * This produces the metadata and computes hashes — the caller then passes
 * the result to the os-core evidence pipeline for upload and sealing.
 *
 * @param req — The commerce evidence request
 * @returns metadata ready for the evidence pipeline
 */
export function buildCommerceEvidencePack(
  req: CommerceEvidenceRequest,
): CommerceEvidencePackResult {
  const mapping = COMMERCE_CONTROL_MAPPINGS[req.entityType as keyof typeof COMMERCE_CONTROL_MAPPINGS]
  const fallback = {
    controlFamily: 'integrity' as const,
    retentionClass: '7_YEARS' as const,
    controlsCovered: ['INT-10'],
  }
  const { controlFamily, retentionClass, controlsCovered } = mapping ?? fallback

  const packId = generateCommercePackId(req.entityType, req.targetEntityId, req.triggerEvent)
  const auditTrailHash = computeAuditTrailHash(req.auditTrail)

  // Count: audit trail itself + any additional artifacts
  const artifactCount = 1 + (req.artifacts?.length ?? 0)

  return {
    packId,
    orgId: req.orgId,
    controlFamily,
    controlsCovered,
    retentionClass,
    summary: `Commerce evidence: ${req.entityType} ${req.targetEntityId} — ${req.triggerEvent}`,
    auditTrailHash,
    artifactCount,
    createdAt: new Date().toISOString(),
  }
}

// ── Utility Functions ───────────────────────────────────────────────────────

/**
 * Compute a deterministic SHA-256 hash of a serialized audit trail.
 * Used for evidence pack integrity verification.
 */
export function computeAuditTrailHash(entries: readonly AuditEntry[]): string {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  )
  const canonical = JSON.stringify(sorted)
  return createHash('sha256').update(canonical).digest('hex')
}

/**
 * Generate a commerce-domain evidence pack ID.
 *
 * Pattern: COM-{ENTITY_TYPE}-{SHORT_ID}-{TRIGGER}-{YYYYMM}
 */
export function generateCommercePackId(
  entityType: CommerceEntityType,
  targetEntityId: string,
  triggerEvent: string,
): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const shortId = targetEntityId.slice(-8)
  const trigger = triggerEvent.replace(/\./g, '-').toUpperCase()
  return `COM-${entityType.toUpperCase()}-${shortId}-${trigger}-${year}${month}`
}
