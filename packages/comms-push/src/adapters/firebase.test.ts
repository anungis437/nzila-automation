import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SendRequest } from '@nzila/integrations-core'

const mockSend = vi.fn()
const mockApp = vi.fn()
const mockInitializeApp = vi.fn()

const adminMock = {
  app: mockApp,
  initializeApp: mockInitializeApp,
  credential: { cert: vi.fn(() => 'mock-credential') },
  messaging: () => ({ send: mockSend }),
}

vi.mock('firebase-admin', () => ({
  default: adminMock,
  app: adminMock.app,
  initializeApp: adminMock.initializeApp,
  credential: adminMock.credential,
  messaging: adminMock.messaging,
}))

const { firebaseAdapter } = await import('./firebase')

function req(overrides: Partial<SendRequest> = {}): SendRequest {
  return { orgId: 'org-1', channel: 'push', to: 'device-token-xyz', correlationId: 'corr-1', body: 'Hello', ...overrides }
}

const creds = { projectId: 'proj-1', clientEmail: 'svc@proj.iam.gserviceaccount.com', privateKey: '-----BEGIN-----' }

beforeEach(() => {
  mockSend.mockReset()
  mockApp.mockReset()
  mockInitializeApp.mockReset()
})

describe('firebaseAdapter', () => {
  it('exposes provider and channel', () => {
    expect(firebaseAdapter.provider).toBe('firebase')
    expect(firebaseAdapter.channel).toBe('push')
  })

  describe('send', () => {
    it('sends push notification and returns message ID', async () => {
      mockApp.mockReturnValueOnce({}) // app already exists
      mockSend.mockResolvedValueOnce('projects/proj-1/messages/abc123')
      const result = await firebaseAdapter.send(req(), creds)
      expect(result.ok).toBe(true)
      expect(result.providerMessageId).toBe('projects/proj-1/messages/abc123')
    })

    it('initializes app when not found', async () => {
      mockApp.mockImplementationOnce(() => { throw new Error('app not found') })
      mockInitializeApp.mockReturnValueOnce({})
      mockSend.mockResolvedValueOnce('msg-id')
      const result = await firebaseAdapter.send(req(), creds)
      expect(result.ok).toBe(true)
      expect(mockInitializeApp).toHaveBeenCalled()
    })

    it('uses default title when subject is undefined', async () => {
      mockApp.mockReturnValueOnce({})
      mockSend.mockResolvedValueOnce('msg-id')
      await firebaseAdapter.send(req({ subject: undefined }), creds)
      const sendArg = mockSend.mock.calls[0]![0] as { notification: { title: string } }
      expect(sendArg.notification.title).toBe('Notification')
    })

    it('converts variables to string data map', async () => {
      mockApp.mockReturnValueOnce({})
      mockSend.mockResolvedValueOnce('msg-id')
      await firebaseAdapter.send(req({ variables: { count: 42, flag: true } }), creds)
      const sendArg = mockSend.mock.calls[0]![0] as { data: Record<string, string> }
      expect(sendArg.data).toEqual({ count: '42', flag: 'true' })
    })

    it('returns error on send failure', async () => {
      mockApp.mockReturnValueOnce({})
      mockSend.mockRejectedValueOnce(new Error('invalid token'))
      const result = await firebaseAdapter.send(req(), creds)
      expect(result.ok).toBe(false)
      expect(result.error).toBe('invalid token')
    })
  })

  describe('healthCheck', () => {
    it('returns ok with valid credentials', async () => {
      const result = await firebaseAdapter.healthCheck(creds)
      expect(result.status).toBe('ok')
      expect(result.provider).toBe('firebase')
    })

    it('returns down with missing credentials', async () => {
      const result = await firebaseAdapter.healthCheck({})
      expect(result.status).toBe('down')
      expect(result.details).toContain('Missing Firebase projectId')
    })
  })

  describe('parseCredentials (via send)', () => {
    it('throws on missing projectId', async () => {
      await expect(firebaseAdapter.send(req(), {})).rejects.toThrow('Missing Firebase projectId')
    })

    it('throws on missing clientEmail', async () => {
      await expect(firebaseAdapter.send(req(), { projectId: 'p' })).rejects.toThrow('Missing Firebase clientEmail')
    })

    it('throws on missing privateKey', async () => {
      await expect(firebaseAdapter.send(req(), { projectId: 'p', clientEmail: 'e' })).rejects.toThrow('Missing Firebase privateKey')
    })
  })
})
