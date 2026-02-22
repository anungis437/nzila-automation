/**
 * Agreements Domain
 * 
 * Collective bargaining agreement schemas.
 * 
 * This domain consolidates:
 * - collective-agreements-schema.ts
 * - cba-schema.ts
 * - cba-clauses-schema.ts
 * - cba-intelligence-schema.ts
 * - shared-clause-library-schema.ts
 * - bargaining-negotiations-schema.ts (Active negotiations)
 * 
 * Priority: 3
 * 
 * Duplicates to resolve:
 * - ClauseType (use cba-clauses-schema version)
 */

// Export all agreement-related schemas from consolidated domain location
export * from './collective-agreements';
export * from './cba';
export * from './clauses';
export * from './intelligence';
export * from './shared-library';
export * from './negotiations'; // Active bargaining negotiations

// Explicit re-export to resolve ambiguity
// ClauseType exists in both clauses.ts and shared-library.ts
// Use the more specific enum version from clauses.ts
export { type ClauseType } from './clauses';
