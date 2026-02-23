/**
 * Domain-Driven Database Schema
 * 
 * Consolidated schema exports organized by business domain.
 * 
 * This replaces the previous flat 75-file structure with 13 domain modules,
 * reducing import depth from 5 to 2 levels and eliminating 18 duplicates.
 * 
 * Migration Status: COMPLETE - All domains migrated
 * Date: February 11, 2026
 * 
 * @see SCHEMA_CONSOLIDATION_DESIGN.md for full consolidation plan
 * @see SCHEMA_CONSOLIDATION_STATUS.md for migration status
 */

// ============================================================================
// DOMAIN EXPORTS (New Structure)
// ============================================================================

// Core Business Domains
export * from "./domains/member";           // Priority 1: Member profiles and user management
export * from "./domains/claims";           // Priority 2: Claims, grievances, deadlines
export * from "./domains/agreements";       // Priority 3: Collective bargaining agreements
export * from "./domains/finance";          // Priority 4: Financial transactions and accounting
export * from "./domains/governance";       // Priority 5: Governance, voting, structure

// Communication & Content Domains
export * from "./domains/communications";   // Priority 6: Member engagement and notifications
export * from "./domains/documents";        // Priority 7: Document storage and e-signatures
export * from "./domains/scheduling";       // Priority 8: Calendar, events, training

// Compliance & Data Domains
export * from "./domains/compliance";       // Priority 9: Regulatory compliance and privacy
export * from "./domains/data";             // Priority 10: External data integration

// Advanced Feature Domains
export * from "./domains/ml";               // Priority 11: Machine learning and AI
export * from "./domains/analytics";        // Priority 12: Reporting and analytics
export * from "./domains/infrastructure";   // Priority 13: System infrastructure and integrations

// ============================================================================
// EXTERNAL EXPORTS (Outside Domain Structure)
// ============================================================================

// Organizations (CLC-level schema, external to local union domains)
export * from "../schema-organizations";

// Union Structure (Organizational hierarchy and operational structure)
export * from "./union-structure-schema";
