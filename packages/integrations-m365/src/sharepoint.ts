/* ── SharePoint Integration ───────────────────────────────
 *
 * Document storage via Microsoft Graph API.
 * NzilaOS stores metadata; SharePoint stores files.
 *
 * Mapping: sharepoint_url → mobility_documents table
 */

/* ── Types ────────────────────────────────────────────────── */

export interface SharePointConfig {
  siteId: string
  driveId: string
  baseFolderPath: string
}

export interface SharePointDocument {
  documentId: string
  sharepointUrl: string
  fileName: string
  mimeType: string
  size: number
  createdAt: Date
}

export interface SharePointFolder {
  folderId: string
  folderUrl: string
  name: string
}

/* ── Graph API Client Interface ───────────────────────────── */

export interface GraphClient {
  createFolder(siteDriveId: string, parentPath: string, name: string): Promise<SharePointFolder>
  uploadFile(
    siteDriveId: string,
    folderPath: string,
    fileName: string,
    content: Buffer | Uint8Array,
  ): Promise<SharePointDocument>
  getFileMetadata(siteDriveId: string, itemId: string): Promise<SharePointDocument>
}

/* ── Functions ────────────────────────────────────────────── */

/**
 * Create a case folder in SharePoint for document organisation.
 * Naming convention: case-{caseId}
 */
export async function attachSharePointFolder(
  graph: GraphClient,
  config: SharePointConfig,
  caseId: string,
): Promise<SharePointFolder> {
  const folderName = `case-${caseId}`
  return graph.createFolder(`${config.siteId}/drives/${config.driveId}`, config.baseFolderPath, folderName)
}

/**
 * Upload a document to the case's SharePoint folder.
 */
export async function uploadToSharePoint(
  graph: GraphClient,
  config: SharePointConfig,
  caseId: string,
  fileName: string,
  content: Buffer | Uint8Array,
): Promise<SharePointDocument> {
  const folderPath = `${config.baseFolderPath}/case-${caseId}`
  return graph.uploadFile(`${config.siteId}/drives/${config.driveId}`, folderPath, fileName, content)
}
