import { describe, it, expect } from 'vitest'
import {
  createTwilioProvider,
  createWhatsAppBusinessProvider,
  createOpenClawProvider,
} from './providers'
import type { WhatsAppProvider, CommunicationLogger } from './index'
import {
  sendNotification,
  sendCaseStatusUpdate,
  sendDocumentRequest,
} from './messaging'

describe('providers', () => {
  it('creates Twilio provider', () => {
    const provider = createTwilioProvider({
      accountSid: 'AC_test',
      authToken: 'token',
      fromNumber: '+15551234567',
    })
    expect(provider.name).toBe('twilio')
  })

  it('creates WhatsApp Business provider', () => {
    const provider = createWhatsAppBusinessProvider({
      phoneNumberId: 'phone-1',
      accessToken: 'token',
    })
    expect(provider.name).toBe('whatsapp_business_api')
  })

  it('creates OpenClaw provider', () => {
    const provider = createOpenClawProvider({
      apiUrl: 'https://api.openclaw.com',
      apiKey: 'key',
    })
    expect(provider.name).toBe('openclaw')
  })

  it('sendMessage returns queued result', async () => {
    const provider = createTwilioProvider({
      accountSid: 'AC_test',
      authToken: 'token',
      fromNumber: '+15551234567',
    })

    const result = await provider.sendMessage('+1234', 'Hello')
    expect(result.status).toBe('queued')
    expect(result.externalId).toBeTruthy()
    expect(result.timestamp).toBeInstanceOf(Date)
  })

  it('sendTemplate returns queued result', async () => {
    const provider = createWhatsAppBusinessProvider({
      phoneNumberId: 'phone-1',
      accessToken: 'token',
    })

    const result = await provider.sendTemplate('+1234', 'welcome', { name: 'John' })
    expect(result.status).toBe('queued')
  })
})

describe('messaging', () => {
  const provider: WhatsAppProvider = createTwilioProvider({
    accountSid: 'AC_test',
    authToken: 'token',
    fromNumber: '+15551234567',
  })

  const mockLogger: CommunicationLogger = {
    log: async () => {},
  }

  it('sendNotification logs and returns result', async () => {
    let loggedEntry: unknown = null
    const logger: CommunicationLogger = {
      log: async (entry) => { loggedEntry = entry },
    }

    const result = await sendNotification(provider, {
      clientId: 'client-1',
      caseId: 'case-1',
      recipientPhone: '+1234567890',
      messageType: 'case_status',
      body: 'Your case is approved',
    }, 'org-1', logger)

    expect(result.clientId).toBe('client-1')
    expect(result.sendResult.status).toBe('queued')
    expect(loggedEntry).not.toBeNull()
  })

  it('sendCaseStatusUpdate sends status message', async () => {
    const result = await sendCaseStatusUpdate(
      provider, 'client-1', 'case-1', '+1234567890',
      'Application submitted', 'org-1', mockLogger,
    )

    expect(result.messageType).toBe('case_status')
  })

  it('sendDocumentRequest formats document list', async () => {
    const result = await sendDocumentRequest(
      provider, 'client-1', 'case-1', '+1234567890',
      ['Passport', 'Bank statement', 'Police clearance'],
      'org-1', mockLogger,
    )

    expect(result.messageType).toBe('document_request')
  })
})
