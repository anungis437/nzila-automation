/**
 * @nzila/commerce-evidence — Commerce Evidence Pack Builder
 *
 * Bridges the commerce domain with the @nzila/os-core evidence pack
 * infrastructure. Provides typed builders for commerce-specific evidence
 * packs (quote PDFs, approval records, delivery proofs, etc.).
 *
 * Design rules:
 *  - Pure functions — no I/O, no DB, no blob writes
 *  - The caller supplies buffers; this module produces metadata descriptors
 *  - All packs are org-scoped via entityId
 *  - Integrates with @nzila/os-core/evidence lifecycle: draft → sealed
 *
 * @module @nzila/commerce-evidence
 */
import { EvidenceType } from '@nzila/commerce-core/enums'
import type { AuditEntry } from '@nzila/commerce-audit'
import type {
  ControlFamily,
  EvidenceEventType,
  RetentionClass,
  BlobContainer,
} from '@nzila/os-core/evidence'

// ── Types ───────────────────────────────────────────────────────────────────

/**
 * Commerce-specific evidence artifact descriptor.
 * Aligns with @nzila/os-core ArtifactDescriptor but adds commerce typing.
 */
export interface CommerceArtifact {
  /** Artifact identifier (e.g. "quote-pdf-Q-2026-001") */
  readonly artifactId: string
  /** Commerce evidence type */
  readonly evidenceType: EvidenceType
  /** Original file name */
  readonly filename: string
  /** MIME type */
  readonly contentType: string
  /** SHA-256 hash of the content */
  readonly sha256: string
  /** Size in bytes */
  readonly sizeBytes: number
  /** Human-readable description */
  readonly description: string
}

/**
 * Metadata for a commerce evidence pack (before sealing).
 * This is the commerce-domain representation that maps to an
 * @nzila/os-core EvidencePackDraft.
 */
export interface CommerceEvidencePackMeta {
  /** Pack identifier (e.g. "COM-Q-2026-001") */
  readonly packId: string
  /** Org scope */
  readonly entityId: string
  /** Commerce entity type (quote, order, invoice, etc.) */
  readonly commerceEntityType: string
  /** ID of the commerce entity */
  readonly commerceEntityId: string
  /** Control family */
  readonly controlFamily: ControlFamily
  /** Triggering event type */
  readonly eventType: EvidenceEventType
  /** Triggering event ID */
  readonly eventId: string
  /** Blob container */
  readonly blobContainer: BlobContainer
  /** Human-readable summary */
  readonly summary: string
  /** Retention class */
  readonly retentionClass: RetentionClass
  /** Control IDs covered */
  readonly controlsCovered: string[]
  /** Actor who created this pack */
  readonly createdBy: string
  /** Artifact descriptors */
  readonly artifacts: readonly CommerceArtifact[]
  /** Audit trail entries included in this pack */
  readonly auditTrailEntries: readonly AuditEntry[]
  /** ISO-8601 creation timestamp */
  readonly createdAt: string
}

/**
 * Context for building a commerce evidence pack.
 */
export interface BuildCommercePackContext {
  /** Org scope */
  readonly entityId: string
  /** Commerce entity type */
  readonly commerceEntityType: string
  /** Commerce entity ID */
  readonly commerceEntityId: string
  /** Actor creating the pack */
  readonly createdBy: string
  /** Summary */
  readonly summary?: string
  /** Override pack ID (auto-generated if omitted) */
  readonly packId?: string
  /** Override timestamp (for testing) */
  readonly timestamp?: string
}

// ── Pack ID Generation ──────────────────────────────────────────────────────

let packCounter = 0

/**
 * Generate a deterministic pack ID for commerce evidence.
 * Format: COM-{entityType}-{timestamp}-{counter}
 */
export function generateCommercePackId(
  entityType: string,
  entityId: string,
  timestamp?: string,
): string {
  const ts = timestamp ?? new Date().toISOString()
  const datePart = ts.slice(0, 10).replace(/-/g, '')
  packCounter++
  return `COM-${entityType.toUpperCase()}-${datePart}-${String(packCounter).padStart(4, '0')}`
}

/**
 * Reset the pack counter (for testing only).
 */
export function resetPackCounter(): void {
  packCounter = 0
}

// ── Artifact Builders ───────────────────────────────────────────────────────

/**
 * Build a commerce artifact descriptor.
 * Pure function — caller provides the hash and size.
 */
export function buildArtifact(
  evidenceType: EvidenceType,
  opts: {
    artifactId: string
    filename: string
    contentType: string
    sha256: string
    sizeBytes: number
    description?: string
  },
): CommerceArtifact {
  return {
    artifactId: opts.artifactId,
    evidenceType,
    filename: opts.filename,
    contentType: opts.contentType,
    sha256: opts.sha256,
    sizeBytes: opts.sizeBytes,
    description: opts.description ?? `${evidenceType} artifact`,
  }
}

// ── Pack Builders ───────────────────────────────────────────────────────────

/**
 * Default control family mappings for commerce evidence.
 */
export const COMMERCE_CONTROL_MAPPINGS: Record<
  string,
  { controlFamily: ControlFamily; eventType: EvidenceEventType; retentionClass: RetentionClass; controlsCovered: string[] }
> = {
  quote: {
    controlFamily: 'change-mgmt',
    eventType: 'period-close',
    retentionClass: '7_YEARS',
    controlsCovered: ['COM-01', 'COM-02'],
  },
  order: {
    controlFamily: 'integrity',
    eventType: 'period-close',
    retentionClass: '7_YEARS',
    controlsCovered: ['COM-03', 'COM-04'],
  },
  invoice: {
    controlFamily: 'integrity',
    eventType: 'period-close',
    retentionClass: '7_YEARS',
    controlsCovered: ['COM-05', 'COM-06'],
  },
  fulfillment: {
    controlFamily: 'integrity',
    eventType: 'period-close',
    retentionClass: '3_YEARS',
    controlsCovered: ['COM-07'],
  },
  payment: {
    controlFamily: 'integrity',
    eventType: 'period-close',
    retentionClass: '7_YEARS',
    controlsCovered: ['COM-08'],
  },
  refund: {
    controlFamily: 'change-mgmt',
    eventType: 'period-close',
    retentionClass: '7_YEARS',
    controlsCovered: ['COM-09'],
  },
}

/**
 * Build a commerce evidence pack metadata object.
 * Pure function — no I/O. Caller provides artifacts and audit entries.
 */
export function buildCommerceEvidencePack(
  ctx: BuildCommercePackContext,
  artifacts: readonly CommerceArtifact[],
  auditTrailEntries: readonly AuditEntry[],
): CommerceEvidencePackMeta {
  const mapping = COMMERCE_CONTROL_MAPPINGS[ctx.commerceEntityType]
  const timestamp = ctx.timestamp ?? new Date().toISOString()
  const packId = ctx.packId ?? generateCommercePackId(
    ctx.commerceEntityType,
    ctx.commerceEntityId,
    timestamp,
  )

  return {
    packId,
    entityId: ctx.entityId,
    commerceEntityType: ctx.commerceEntityType,
    commerceEntityId: ctx.commerceEntityId,
    controlFamily: mapping?.controlFamily ?? 'integrity',
    eventType: mapping?.eventType ?? 'period-close',
    retentionClass: mapping?.retentionClass ?? '7_YEARS',
    controlsCovered: mapping?.controlsCovered ?? [],
    eventId: `${ctx.commerceEntityType}-${ctx.commerceEntityId}`,
    blobContainer: 'evidence',
    summary: ctx.summary ?? `Commerce evidence pack for ${ctx.commerceEntityType} ${ctx.commerceEntityId}`,
    createdBy: ctx.createdBy,
    artifacts,
    auditTrailEntries,
    createdAt: timestamp,
  }
}

// ── Validation ──────────────────────────────────────────────────────────────

/**
 * Validate a commerce evidence pack metadata object.
 * Returns an array of error messages (empty = valid).
 */
export function validateCommerceEvidencePack(pack: CommerceEvidencePackMeta): string[] {
  const errors: string[] = []

  if (!pack.packId) errors.push('packId is required')
  if (!pack.entityId) errors.push('entityId is required (org scope)')
  if (!pack.commerceEntityType) errors.push('commerceEntityType is required')
  if (!pack.commerceEntityId) errors.push('commerceEntityId is required')
  if (!pack.createdBy) errors.push('createdBy is required')

  if (pack.artifacts.length === 0) {
    errors.push('At least one artifact is required')
  }

  for (const artifact of pack.artifacts) {
    if (!artifact.sha256) errors.push(`Artifact "${artifact.artifactId}" missing sha256 hash`)
    if (artifact.sizeBytes <= 0) errors.push(`Artifact "${artifact.artifactId}" has invalid size`)
  }

  // Verify org scope consistency
  for (const entry of pack.auditTrailEntries) {
    if (entry.entityId !== pack.entityId) {
      errors.push(
        `Audit entry "${entry.id}" org "${entry.entityId}" does not match pack org "${pack.entityId}"`,
      )
    }
  }

  return errors
}

/**
 * Convert commerce evidence pack metadata to an @nzila/os-core pack index
 * shape for sealing. This creates the canonical structure that the sealing
 * infrastructure expects.
 */
export function toSealableIndex(pack: CommerceEvidencePackMeta): {
  packId: string
  entityId: string
  controlFamily: string
  eventType: string
  eventId: string
  summary: string
  controlsCovered: string[]
  createdBy: string
  createdAt: string
  artifacts: Array<{ sha256: string; artifactId: string; filename: string; contentType: string }>
} {
  return {
    packId: pack.packId,
    entityId: pack.entityId,
    controlFamily: pack.controlFamily,
    eventType: pack.eventType,
    eventId: pack.eventId,
    summary: pack.summary,
    controlsCovered: pack.controlsCovered,
    createdBy: pack.createdBy,
    createdAt: pack.createdAt,
    artifacts: pack.artifacts.map((a) => ({
      sha256: a.sha256,
      artifactId: a.artifactId,
      filename: a.filename,
      contentType: a.contentType,
    })),
  }
}
