/**
 * @nzila/platform-ontology — Barrel Export
 */

// Types
export type {
  OntologyEntityType,
  EntityStatus,
  RelationshipType,
  OntologyEntity,
  OntologyRelationship,
  OntologyTypeDefinition,
  AllowedRelationship,
  CreateOntologyEntityInput,
  UpdateOntologyEntityInput,
  CreateRelationshipInput,
} from './types'

export {
  OntologyEntityTypes,
  EntityStatuses,
  RelationshipTypes,
} from './types'

// Validators
export {
  OntologyEntitySchema,
  CreateOntologyEntitySchema,
  UpdateOntologyEntitySchema,
  OntologyRelationshipSchema,
  CreateRelationshipSchema,
  validateEntity,
  validateCreateEntity,
  validateRelationship,
  validateCreateRelationship,
} from './validators'

// Relationships
export {
  getTypeDefinition,
  getAllTypeDefinitions,
  getRelationshipsFor,
  isRelationshipAllowed,
} from './relationships'

// Registry
export {
  getOntologyDefinition,
  registerOntologyType,
  listOntologyDefinitions,
  resolveOntologyRelationships,
  validateRelationshipAllowed,
  buildOntologyEntity,
  buildOntologyRelationship,
  resetRegistry,
} from './registry'

// Schema (Drizzle)
export { ontologyEntities, ontologyRelationships } from './schema'
