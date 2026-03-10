/* ── @nzila/integrations-m365 ──────────────────────────── */

// SharePoint
export { attachSharePointFolder, uploadToSharePoint } from './sharepoint'
export type { SharePointConfig, SharePointDocument, SharePointFolder, GraphClient } from './sharepoint'

// Outlook
export { logEmailToCase } from './outlook'
export type { EmailMessage, EmailLogEntry, GraphMailClient } from './outlook'

// Teams
export { createCaseChannel } from './teams'
export type { TeamsChannel, GraphTeamsClient } from './teams'
