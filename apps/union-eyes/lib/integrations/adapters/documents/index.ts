/**
 * Document Management Integrations Index
 * 
 * Exports all document management system integrations
 */

export { SharePointClient } from './sharepoint-client';
export { SharePointAdapter } from './sharepoint-adapter';

export type {
  SharePointSite,
  SharePointLibrary,
  SharePointFile,
  SharePointPermission,
} from './sharepoint-client';
