/**
 * HRIS Adapters Index
 * 
 * Exports all HRIS integration adapters and utilities.
 */

// Adapters
export { WorkdayAdapter } from './workday-adapter';
export { WorkdayClient } from './workday-client';
export type { WorkdayConfig, WorkdayEmployee, WorkdayPosition, WorkdayDepartment } from './workday-client';

export { BambooHRAdapter } from './bamboohr-adapter';
export { BambooHRClient } from './bamboohr-client';
export type { BambooHRConfig, BambooHREmployee, BambooHRDepartment } from './bamboohr-client';

export { ADPAdapter } from './adp-adapter';
export { ADPClient } from './adp-client';
export type { ADPConfig, ADPWorker, ADPPosition, ADPOrganizationalUnit } from './adp-client';

// Utilities
export {
  findEmployeeMappings,
  detectSyncConflicts,
  getSyncStats,
  validateEmployeeData,
  bulkMapEmployees,
  deactivateRemovedEmployees,
} from './sync-utils';

export type {
  EmployeeMapping,
  SyncConflict,
  SyncStats,
} from './sync-utils';
