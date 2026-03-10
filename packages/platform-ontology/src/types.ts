/**
 * @nzila/platform-ontology — Canonical Business Ontology Types
 *
 * Defines the type system for NzilaOS domain entities.
 * All ontology types are strict TypeScript interfaces with Zod validation.
 */

// ── Ontology Entity Types ───────────────────────────────────────────────────

export const OntologyEntityTypes = {
  TENANT: 'Tenant',
  ORGANIZATION: 'Organization',
  PERSON: 'Person',
  USER: 'User',
  ADVISOR: 'Advisor',
  MEMBER: 'Member',
  CLIENT: 'Client',
  FAMILY: 'Family',
  CASE: 'Case',
  CLAIM: 'Claim',
  PROGRAM: 'Program',
  DOCUMENT: 'Document',
  COMMUNICATION: 'Communication',
  TASK: 'Task',
  WORKFLOW: 'Workflow',
  DECISION: 'Decision',
  RISK_EVENT: 'RiskEvent',
  POLICY: 'Policy',
  APPROVAL: 'Approval',
  EVIDENCE_PACK: 'EvidencePack',
  AUDIT_EVENT: 'AuditEvent',
  ASSET: 'Asset',
  PROPERTY: 'Property',
  DEAL: 'Deal',
  INVOICE: 'Invoice',
  PAYMENT: 'Payment',
  SHIPMENT: 'Shipment',
  PRODUCT: 'Product',
  FARMER: 'Farmer',
  PARCEL: 'Parcel',
  SUBSIDY: 'Subsidy',
  REGISTRY_RECORD: 'RegistryRecord',
} as const

export type OntologyEntityType =
  (typeof OntologyEntityTypes)[keyof typeof OntologyEntityTypes]

// ── Entity Status ───────────────────────────────────────────────────────────

export const EntityStatuses = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
} as const

export type EntityStatus = (typeof EntityStatuses)[keyof typeof EntityStatuses]

// ── Relationship Types ──────────────────────────────────────────────────────

export const RelationshipTypes = {
  BELONGS_TO: 'BELONGS_TO',
  HAS: 'HAS',
  REFERENCES: 'REFERENCES',
  LINKS_TO: 'LINKS_TO',
  PRODUCES: 'PRODUCES',
  DEPENDS_ON: 'DEPENDS_ON',
  PARENT_OF: 'PARENT_OF',
  CHILD_OF: 'CHILD_OF',
  ASSIGNED_TO: 'ASSIGNED_TO',
  CREATED_BY: 'CREATED_BY',
  APPROVED_BY: 'APPROVED_BY',
} as const

export type RelationshipType =
  (typeof RelationshipTypes)[keyof typeof RelationshipTypes]

// ── Ontology Entity ─────────────────────────────────────────────────────────

export interface OntologyEntity {
  readonly id: string
  readonly tenantId: string
  readonly entityType: OntologyEntityType
  readonly canonicalName: string
  readonly aliases: readonly string[]
  readonly status: EntityStatus
  readonly tags: readonly string[]
  readonly sourceSystems: readonly string[]
  readonly metadata: Record<string, unknown>
  readonly createdAt: string
  readonly updatedAt: string
}

// ── Ontology Relationship ───────────────────────────────────────────────────

export interface OntologyRelationship {
  readonly id: string
  readonly tenantId: string
  readonly sourceEntityType: OntologyEntityType
  readonly sourceEntityId: string
  readonly targetEntityType: OntologyEntityType
  readonly targetEntityId: string
  readonly relationshipType: RelationshipType
  readonly metadata: Record<string, unknown>
  readonly createdAt: string
}

// ── Ontology Type Definition ────────────────────────────────────────────────

export interface OntologyTypeDefinition {
  readonly entityType: OntologyEntityType
  readonly description: string
  readonly requiredFields: readonly string[]
  readonly optionalFields: readonly string[]
  readonly allowedRelationships: readonly AllowedRelationship[]
  readonly metadataSchema?: Record<string, unknown>
}

export interface AllowedRelationship {
  readonly relationshipType: RelationshipType
  readonly targetEntityType: OntologyEntityType
  readonly cardinality: 'one' | 'many'
  readonly description: string
}

// ── Create / Update DTOs ────────────────────────────────────────────────────

export interface CreateOntologyEntityInput {
  readonly tenantId: string
  readonly entityType: OntologyEntityType
  readonly canonicalName: string
  readonly aliases?: readonly string[]
  readonly status?: EntityStatus
  readonly tags?: readonly string[]
  readonly sourceSystems?: readonly string[]
  readonly metadata?: Record<string, unknown>
}

export interface UpdateOntologyEntityInput {
  readonly canonicalName?: string
  readonly aliases?: readonly string[]
  readonly status?: EntityStatus
  readonly tags?: readonly string[]
  readonly sourceSystems?: readonly string[]
  readonly metadata?: Record<string, unknown>
}

export interface CreateRelationshipInput {
  readonly tenantId: string
  readonly sourceEntityType: OntologyEntityType
  readonly sourceEntityId: string
  readonly targetEntityType: OntologyEntityType
  readonly targetEntityId: string
  readonly relationshipType: RelationshipType
  readonly metadata?: Record<string, unknown>
}
