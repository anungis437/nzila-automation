/**
 * Scheduling Domain
 * 
 * Calendar, events, and training schemas.
 * 
 * This domain consolidates:
 * - calendar-schema.ts (517 lines)
 * - education-training-schema.ts
 * 
 * Priority: 8
 * 
 * Duplicates to resolve:
 * - syncStatusEnum (2 locations)
 */

// Export all scheduling-related schemas from consolidated domain location
export * from './calendar';
export * from './training';
