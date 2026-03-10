/**
 * @nzila/platform-ontology — Canonical Relationship Definitions
 *
 * Declares the standard relationships between ontology entity types.
 */
import type {
  AllowedRelationship,
  OntologyEntityType,
  OntologyTypeDefinition,
} from './types'
import { OntologyEntityTypes, RelationshipTypes } from './types'

// ── Canonical Relationship Map ──────────────────────────────────────────────

const rel = (
  relationshipType: (typeof RelationshipTypes)[keyof typeof RelationshipTypes],
  targetEntityType: OntologyEntityType,
  cardinality: 'one' | 'many',
  description: string,
): AllowedRelationship => ({ relationshipType, targetEntityType, cardinality, description })

const TYPE_DEFINITIONS: ReadonlyMap<OntologyEntityType, OntologyTypeDefinition> = new Map([
  [OntologyEntityTypes.PERSON, {
    entityType: OntologyEntityTypes.PERSON,
    description: 'A natural person known to the platform',
    requiredFields: ['canonicalName'],
    optionalFields: ['email', 'phone', 'dateOfBirth'],
    allowedRelationships: [
      rel(RelationshipTypes.BELONGS_TO, OntologyEntityTypes.ORGANIZATION, 'many', 'Person belongs to organization(s)'),
      rel(RelationshipTypes.HAS, OntologyEntityTypes.DOCUMENT, 'many', 'Person has documents'),
    ],
  }],
  [OntologyEntityTypes.CLIENT, {
    entityType: OntologyEntityTypes.CLIENT,
    description: 'A client entity — person receiving services',
    requiredFields: ['canonicalName'],
    optionalFields: ['clientType', 'jurisdiction'],
    allowedRelationships: [
      rel(RelationshipTypes.HAS, OntologyEntityTypes.FAMILY, 'one', 'Client has a family'),
      rel(RelationshipTypes.HAS, OntologyEntityTypes.CASE, 'many', 'Client has cases'),
      rel(RelationshipTypes.HAS, OntologyEntityTypes.DOCUMENT, 'many', 'Client has documents'),
      rel(RelationshipTypes.BELONGS_TO, OntologyEntityTypes.ORGANIZATION, 'many', 'Client belongs to organization'),
    ],
  }],
  [OntologyEntityTypes.CASE, {
    entityType: OntologyEntityTypes.CASE,
    description: 'A case or matter being tracked',
    requiredFields: ['canonicalName'],
    optionalFields: ['caseType', 'priority', 'jurisdiction'],
    allowedRelationships: [
      rel(RelationshipTypes.REFERENCES, OntologyEntityTypes.PROGRAM, 'many', 'Case references program(s)'),
      rel(RelationshipTypes.HAS, OntologyEntityTypes.DOCUMENT, 'many', 'Case has documents'),
      rel(RelationshipTypes.HAS, OntologyEntityTypes.TASK, 'many', 'Case has tasks'),
      rel(RelationshipTypes.HAS, OntologyEntityTypes.DECISION, 'many', 'Case has decisions'),
      rel(RelationshipTypes.HAS, OntologyEntityTypes.COMMUNICATION, 'many', 'Case has communications'),
      rel(RelationshipTypes.BELONGS_TO, OntologyEntityTypes.CLIENT, 'one', 'Case belongs to client'),
    ],
  }],
  [OntologyEntityTypes.DECISION, {
    entityType: OntologyEntityTypes.DECISION,
    description: 'A decision made within the platform',
    requiredFields: ['canonicalName'],
    optionalFields: ['decisionType', 'confidence'],
    allowedRelationships: [
      rel(RelationshipTypes.PRODUCES, OntologyEntityTypes.APPROVAL, 'one', 'Decision produces approval'),
      rel(RelationshipTypes.REFERENCES, OntologyEntityTypes.POLICY, 'many', 'Decision references policies'),
      rel(RelationshipTypes.REFERENCES, OntologyEntityTypes.EVIDENCE_PACK, 'many', 'Decision references evidence'),
    ],
  }],
  [OntologyEntityTypes.APPROVAL, {
    entityType: OntologyEntityTypes.APPROVAL,
    description: 'An approval action taken by a person',
    requiredFields: ['canonicalName'],
    optionalFields: ['approvalOutcome', 'approverRole'],
    allowedRelationships: [
      rel(RelationshipTypes.REFERENCES, OntologyEntityTypes.POLICY, 'many', 'Approval references policies'),
      rel(RelationshipTypes.APPROVED_BY, OntologyEntityTypes.USER, 'one', 'Approval made by user'),
    ],
  }],
  [OntologyEntityTypes.SHIPMENT, {
    entityType: OntologyEntityTypes.SHIPMENT,
    description: 'A physical shipment of goods',
    requiredFields: ['canonicalName'],
    optionalFields: ['origin', 'destination', 'carrier'],
    allowedRelationships: [
      rel(RelationshipTypes.LINKS_TO, OntologyEntityTypes.PRODUCT, 'many', 'Shipment links to product(s)'),
      rel(RelationshipTypes.HAS, OntologyEntityTypes.DOCUMENT, 'many', 'Shipment has documents'),
      rel(RelationshipTypes.BELONGS_TO, OntologyEntityTypes.ORGANIZATION, 'one', 'Shipment belongs to org'),
    ],
  }],
  [OntologyEntityTypes.FARMER, {
    entityType: OntologyEntityTypes.FARMER,
    description: 'An agricultural producer',
    requiredFields: ['canonicalName'],
    optionalFields: ['farmSize', 'crops', 'certifications'],
    allowedRelationships: [
      rel(RelationshipTypes.LINKS_TO, OntologyEntityTypes.PARCEL, 'many', 'Farmer links to parcel(s)'),
      rel(RelationshipTypes.HAS, OntologyEntityTypes.SUBSIDY, 'many', 'Farmer has subsidies'),
      rel(RelationshipTypes.BELONGS_TO, OntologyEntityTypes.ORGANIZATION, 'one', 'Farmer belongs to organization'),
    ],
  }],
  [OntologyEntityTypes.DEAL, {
    entityType: OntologyEntityTypes.DEAL,
    description: 'A business deal or transaction',
    requiredFields: ['canonicalName'],
    optionalFields: ['dealStage', 'value', 'currency'],
    allowedRelationships: [
      rel(RelationshipTypes.LINKS_TO, OntologyEntityTypes.CLIENT, 'one', 'Deal links to client'),
      rel(RelationshipTypes.HAS, OntologyEntityTypes.DOCUMENT, 'many', 'Deal has documents'),
      rel(RelationshipTypes.HAS, OntologyEntityTypes.INVOICE, 'many', 'Deal has invoices'),
    ],
  }],
  [OntologyEntityTypes.FAMILY, {
    entityType: OntologyEntityTypes.FAMILY,
    description: 'A family unit (e.g. for mobility or social services)',
    requiredFields: ['canonicalName'],
    optionalFields: ['dependentCount'],
    allowedRelationships: [
      rel(RelationshipTypes.HAS, OntologyEntityTypes.PERSON, 'many', 'Family has members'),
      rel(RelationshipTypes.BELONGS_TO, OntologyEntityTypes.CLIENT, 'one', 'Family belongs to client'),
    ],
  }],
  [OntologyEntityTypes.DOCUMENT, {
    entityType: OntologyEntityTypes.DOCUMENT,
    description: 'A document or file attached to an entity',
    requiredFields: ['canonicalName'],
    optionalFields: ['documentType', 'mimeType', 'storageRef'],
    allowedRelationships: [
      rel(RelationshipTypes.BELONGS_TO, OntologyEntityTypes.CASE, 'one', 'Document belongs to case'),
      rel(RelationshipTypes.CREATED_BY, OntologyEntityTypes.USER, 'one', 'Document created by user'),
    ],
  }],
  [OntologyEntityTypes.WORKFLOW, {
    entityType: OntologyEntityTypes.WORKFLOW,
    description: 'A workflow process',
    requiredFields: ['canonicalName'],
    optionalFields: ['workflowType', 'currentStep'],
    allowedRelationships: [
      rel(RelationshipTypes.HAS, OntologyEntityTypes.TASK, 'many', 'Workflow has tasks'),
      rel(RelationshipTypes.REFERENCES, OntologyEntityTypes.CASE, 'one', 'Workflow references case'),
      rel(RelationshipTypes.ASSIGNED_TO, OntologyEntityTypes.USER, 'many', 'Workflow assigned to users'),
    ],
  }],
  [OntologyEntityTypes.PROGRAM, {
    entityType: OntologyEntityTypes.PROGRAM,
    description: 'A program, benefit, or service offering',
    requiredFields: ['canonicalName'],
    optionalFields: ['programType', 'jurisdiction', 'eligibilityCriteria'],
    allowedRelationships: [
      rel(RelationshipTypes.HAS, OntologyEntityTypes.POLICY, 'many', 'Program has policies'),
      rel(RelationshipTypes.HAS, OntologyEntityTypes.DOCUMENT, 'many', 'Program has documents'),
    ],
  }],
  [OntologyEntityTypes.CLAIM, {
    entityType: OntologyEntityTypes.CLAIM,
    description: 'A claim filed by a member or client',
    requiredFields: ['canonicalName'],
    optionalFields: ['claimType', 'amount'],
    allowedRelationships: [
      rel(RelationshipTypes.BELONGS_TO, OntologyEntityTypes.MEMBER, 'one', 'Claim belongs to member'),
      rel(RelationshipTypes.HAS, OntologyEntityTypes.DOCUMENT, 'many', 'Claim has documents'),
      rel(RelationshipTypes.HAS, OntologyEntityTypes.DECISION, 'many', 'Claim has decisions'),
    ],
  }],
  [OntologyEntityTypes.ORGANIZATION, {
    entityType: OntologyEntityTypes.ORGANIZATION,
    description: 'A legal or operational organization',
    requiredFields: ['canonicalName'],
    optionalFields: ['orgType', 'registrationNumber', 'jurisdiction'],
    allowedRelationships: [
      rel(RelationshipTypes.HAS, OntologyEntityTypes.PERSON, 'many', 'Organization has persons'),
      rel(RelationshipTypes.HAS, OntologyEntityTypes.ASSET, 'many', 'Organization has assets'),
      rel(RelationshipTypes.PARENT_OF, OntologyEntityTypes.ORGANIZATION, 'many', 'Organization is parent of sub-org'),
    ],
  }],
  [OntologyEntityTypes.TENANT, {
    entityType: OntologyEntityTypes.TENANT,
    description: 'A platform tenant',
    requiredFields: ['canonicalName'],
    optionalFields: ['plan', 'region'],
    allowedRelationships: [
      rel(RelationshipTypes.HAS, OntologyEntityTypes.ORGANIZATION, 'many', 'Tenant has organizations'),
    ],
  }],
])

// ── Default definitions for types without explicit relationship config ──────

function defaultDefinition(entityType: OntologyEntityType): OntologyTypeDefinition {
  return {
    entityType,
    description: `${entityType} entity`,
    requiredFields: ['canonicalName'],
    optionalFields: [],
    allowedRelationships: [],
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

export function getTypeDefinition(entityType: OntologyEntityType): OntologyTypeDefinition {
  return TYPE_DEFINITIONS.get(entityType) ?? defaultDefinition(entityType)
}

export function getAllTypeDefinitions(): readonly OntologyTypeDefinition[] {
  return Array.from(TYPE_DEFINITIONS.values())
}

export function getRelationshipsFor(entityType: OntologyEntityType): readonly AllowedRelationship[] {
  const def = TYPE_DEFINITIONS.get(entityType)
  return def?.allowedRelationships ?? []
}

export function isRelationshipAllowed(
  sourceType: OntologyEntityType,
  targetType: OntologyEntityType,
  relationshipType: (typeof RelationshipTypes)[keyof typeof RelationshipTypes],
): boolean {
  const rels = getRelationshipsFor(sourceType)
  return rels.some(
    (r) =>
      r.targetEntityType === targetType &&
      r.relationshipType === relationshipType,
  )
}
