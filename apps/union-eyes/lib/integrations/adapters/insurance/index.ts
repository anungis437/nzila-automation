/**
 * Insurance Integration Adapters
 * 
 * Export all insurance integration components.
 * 
 * Supported Providers:
 * - Sun Life Financial (Group Benefits)
 * - Manulife Financial (Insurance Claims)
 * - Green Shield Canada (Health & Dental)
 * - Canada Life (Life, Disability, Health)
 * - Industrial Alliance (iA Financial)
 */

// Sun Life
export { SunLifeClient, type SunLifeConfig } from './sunlife-client';
export { SunLifeAdapter } from './sunlife-adapter';

// Manulife
export { ManulifeClient, type ManulifeConfig } from './manulife-client';
export { ManulifeAdapter } from './manulife-adapter';

// Green Shield Canada
export { GreenShieldClient, type GreenShieldConfig } from './greenshield-client';
export { GreenShieldAdapter } from './greenshield-adapter';

// Canada Life
export { CanadaLifeClient, type CanadaLifeConfig } from './canadalife-client';
export { CanadaLifeAdapter } from './canadalife-adapter';

// Industrial Alliance (iA Financial)
export { IndustrialAllianceClient, type IndustrialAllianceConfig } from './ia-client';
export { IndustrialAllianceAdapter } from './ia-adapter';
