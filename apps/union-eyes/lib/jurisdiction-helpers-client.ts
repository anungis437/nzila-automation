/**
 * Jurisdiction Helper Functions - Client-Safe
 * Pure utility functions that can be used in client components
 */

export type CAJurisdiction = 
  | 'CA-FED' // Federal
  | 'CA-AB'  // Alberta
  | 'CA-BC'  // British Columbia
  | 'CA-MB'  // Manitoba
  | 'CA-NB'  // New Brunswick
  | 'CA-NL'  // Newfoundland and Labrador
  | 'CA-NS'  // Nova Scotia
  | 'CA-NT'  // Northwest Territories
  | 'CA-NU'  // Nunavut
  | 'CA-ON'  // Ontario
  | 'CA-PE'  // Prince Edward Island
  | 'CA-QC'  // Quebec
  | 'CA-SK'  // Saskatchewan
  | 'CA-YT'; // Yukon

/**
 * Map old jurisdiction enum values to new ca_jurisdiction format
 */
export function mapJurisdictionValue(oldValue: string): CAJurisdiction {
  const mapping: Record<string, CAJurisdiction> = {
    'AB': 'CA-AB',
    'BC': 'CA-BC',
    'MB': 'CA-MB',
    'NB': 'CA-NB',
    'NL': 'CA-NL',
    'NS': 'CA-NS',
    'NT': 'CA-NT',
    'NU': 'CA-NU',
    'ON': 'CA-ON',
    'PE': 'CA-PE',
    'QC': 'CA-QC',
    'SK': 'CA-SK',
    'YT': 'CA-YT'
  };

  const normalized = oldValue?.trim();
  if (!normalized) {
    return 'CA-FED';
  }

  const upper = normalized.toUpperCase();
  if (upper === 'CA-FED' || upper === 'FEDERAL' || upper === 'FED') {
    return 'CA-FED';
  }

  if (upper.startsWith('CA-')) {
    const suffix = upper.slice(3);
    if (mapping[suffix]) {
      return mapping[suffix];
    }
  }

  return mapping[upper] || 'CA-FED';
}

/**
 * Get jurisdiction display name
 */
export function getJurisdictionName(jurisdiction: CAJurisdiction): string {
  const names: Record<CAJurisdiction, string> = {
    'CA-FED': 'Federal',
    'CA-AB': 'Alberta',
    'CA-BC': 'British Columbia',
    'CA-MB': 'Manitoba',
    'CA-NB': 'New Brunswick',
    'CA-NL': 'Newfoundland and Labrador',
    'CA-NS': 'Nova Scotia',
    'CA-NT': 'Northwest Territories',
    'CA-NU': 'Nunavut',
    'CA-ON': 'Ontario',
    'CA-PE': 'Prince Edward Island',
    'CA-QC': 'Quebec',
    'CA-SK': 'Saskatchewan',
    'CA-YT': 'Yukon',
  };

  return names[jurisdiction] ?? 'Unknown';
}

/**
 * Check if jurisdiction requires bilingual support
 */
export function requiresBilingualSupport(jurisdiction: CAJurisdiction): boolean {
  return jurisdiction === 'CA-FED' || jurisdiction === 'CA-QC' || jurisdiction === 'CA-NB';
}

/**
 * Get urgency level for deadline
 */
export function getDeadlineUrgency(daysRemaining: number): {
  level: 'critical' | 'high' | 'medium' | 'low';
  color: string;
  label: string;
} {
  if (daysRemaining < 0) {
    return { level: 'critical', color: 'red', label: 'Overdue' };
  }
  if (daysRemaining === 0) {
    return { level: 'critical', color: 'red', label: 'Due Today' };
  }
  if (daysRemaining <= 3) {
    return { level: 'high', color: 'orange', label: 'Urgent' };
  }
  if (daysRemaining <= 7) {
    return { level: 'medium', color: 'yellow', label: 'Upcoming' };
  }
  return { level: 'low', color: 'green', label: 'On Track' };
}

