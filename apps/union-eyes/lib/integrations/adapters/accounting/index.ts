/**
 * Accounting Integration Adapters
 * 
 * Export all accounting integration components.
 * 
 * Supported Providers:
 * - QuickBooks Online
 * - Xero
 * - Sage Intacct
 * - FreshBooks
 * - Wave
 */

// QuickBooks
export { QuickBooksClient, type QuickBooksConfig } from './quickbooks-client';
export { QuickBooksAdapter } from './quickbooks-adapter';

// Xero
export { XeroClient, type XeroConfig } from './xero-client';
export { XeroAdapter } from './xero-adapter';

// Sage Intacct
export { SageIntacctClient, type SageIntacctConfig } from './sage-intacct-client';
export { SageIntacctAdapter } from './sage-intacct-adapter';

// FreshBooks
export { FreshBooksClient, type FreshBooksConfig } from './freshbooks-client';
export { FreshBooksAdapter } from './freshbooks-adapter';

// Wave
export { WaveClient, type WaveConfig } from './wave-client';
export { WaveAdapter } from './wave-adapter';

// Utilities
export * from './sync-utils';
