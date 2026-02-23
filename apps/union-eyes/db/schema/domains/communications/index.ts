/**
 * Communications Domain
 * 
 * Member engagement and notification schemas.
 * 
 * This domain consolidates:
 * - messages-schema.ts
 * - notifications-schema.ts
 * - newsletter-schema.ts
 * - sms-communications-schema.ts
 * - survey-polling-schema.ts
 * - communication-analytics-schema.ts
 * - push-notifications.ts
 * - campaigns.ts (Phase 4: Campaign management)
 * - organizer-workflows.ts (Phase 4: Organizer tools)
 * 
 * Priority: 6
 * Lines: ~2,400 (largest domain, expanded in Phase 4)
 * 
 * Duplicates to resolve:
 * - campaignStatusEnum (2 locations)
 */

// Export all communication-related schemas from consolidated domain location
export * from './messages';
export * from './notifications';
export * from './newsletters';
export * from './sms';
export * from './surveys';
export * from '../../analytics';
export * from './push-notifications';
export * from './public-content';

// Phase 4: Communications & Organizing
export * from './campaigns';
export * from './organizer-workflows';
