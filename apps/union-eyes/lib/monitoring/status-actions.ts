'use server';

import { getSystemStatus } from './status-page';

/**
 * Server action for client components to fetch system status.
 * Extracted to a dedicated file so the 'use server' directive lives
 * at the module level (required when the consumer is a Client Component).
 */
export async function getStatusAction() {
  return getSystemStatus();
}
