import { describe, it, expect } from 'vitest'
import {
  attachSharePointFolder,
  uploadToSharePoint,
} from './sharepoint'
import { logEmailToCase } from './outlook'
import { createCaseChannel } from './teams'
import type { GraphClient, SharePointConfig } from './sharepoint'
import type { GraphMailClient } from './outlook'
import type { GraphTeamsClient } from './teams'

describe('SharePoint', () => {
  const config: SharePointConfig = {
    siteId: 'site-1',
    driveId: 'drive-1',
    baseFolderPath: '/Cases',
  }

  const mockGraph: GraphClient = {
    createFolder: async (_drive, _parent, name) => ({
      folderId: 'folder-1',
      folderUrl: `https://sharepoint.com/${name}`,
      name,
    }),
    uploadFile: async (_drive, _folder, fileName) => ({
      documentId: 'doc-1',
      sharepointUrl: `https://sharepoint.com/${fileName}`,
      fileName,
      mimeType: 'application/pdf',
      size: 1024,
      createdAt: new Date(),
    }),
    getFileMetadata: async () => ({
      documentId: 'doc-1',
      sharepointUrl: 'https://sharepoint.com/file',
      fileName: 'test.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      createdAt: new Date(),
    }),
  }

  it('creates a case folder with correct naming', async () => {
    const folder = await attachSharePointFolder(mockGraph, config, 'case-42')
    expect(folder.name).toBe('case-case-42')
    expect(folder.folderId).toBe('folder-1')
  })

  it('uploads document to case folder', async () => {
    const doc = await uploadToSharePoint(
      mockGraph, config, 'case-42', 'passport.pdf', Buffer.from('test'),
    )
    expect(doc.fileName).toBe('passport.pdf')
    expect(doc.documentId).toBe('doc-1')
  })
})

describe('Outlook', () => {
  const mockMail: GraphMailClient = {
    getMessages: async () => [],
    getMessage: async (_userId, messageId) => ({
      messageId,
      subject: 'Re: Case Application',
      from: 'advisor@firm.com',
      to: ['client@example.com'],
      bodyPreview: 'Please find attached...',
      receivedAt: new Date('2025-01-15'),
      conversationId: 'conv-1',
    }),
  }

  it('logs email to case', async () => {
    let persisted: unknown = null
    const entry = await logEmailToCase(
      mockMail, 'user-1', 'msg-1', 'case-42',
      async (e) => { persisted = e },
    )

    expect(entry.caseId).toBe('case-42')
    expect(entry.messageId).toBe('msg-1')
    expect(entry.direction).toBe('inbound')
    expect(persisted).not.toBeNull()
  })
})

describe('Teams', () => {
  const mockTeams: GraphTeamsClient = {
    createChannel: async (_teamId, displayName, description) => ({
      channelId: 'ch-1',
      displayName,
      webUrl: `https://teams.microsoft.com/${displayName}`,
    }),
    getChannel: async () => ({
      channelId: 'ch-1',
      displayName: 'test',
      webUrl: 'https://teams.microsoft.com/test',
    }),
  }

  it('creates a case channel with correct naming', async () => {
    const channel = await createCaseChannel(mockTeams, 'team-1', 'case-42')
    expect(channel.displayName).toBe('case-case-42')
    expect(channel.channelId).toBe('ch-1')
  })

  it('accepts optional description', async () => {
    const channel = await createCaseChannel(
      mockTeams, 'team-1', 'case-42', 'High priority case',
    )
    expect(channel.displayName).toBe('case-case-42')
  })
})
