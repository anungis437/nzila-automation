import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SendRequest } from '@nzila/integrations-core'
import { teamsAdapter } from './adapter'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  mockFetch.mockReset()
})

function req(overrides: Partial<SendRequest> = {}): SendRequest {
  return { orgId: 'org-1', channel: 'chatops', to: '', correlationId: 'corr-1', body: 'hello', ...overrides }
}

const creds = { webhookUrl: 'https://outlook.office.com/webhook/test' }

describe('teamsAdapter', () => {
  it('exposes provider and channel', () => {
    expect(teamsAdapter.provider).toBe('teams')
    expect(teamsAdapter.channel).toBe('chatops')
  })

  describe('send', () => {
    it('posts adaptive card to webhook and returns ok', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      const result = await teamsAdapter.send(req(), creds)
      expect(result.ok).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(creds.webhookUrl, expect.objectContaining({ method: 'POST' }))
    })

    it('sends adaptive card with subject as header block', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await teamsAdapter.send(req({ subject: 'Alert', body: 'details' }), creds)
      const callArgs = mockFetch.mock.calls[0] as [string, RequestInit]
      const payload = JSON.parse(callArgs[1].body as string)
      const card = payload.attachments[0].content
      expect(card.body[0].text).toBe('Alert')
      expect(card.body[0].weight).toBe('Bolder')
      expect(card.body[1].text).toBe('details')
    })

    it('omits header block when no subject', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await teamsAdapter.send(req({ body: 'just body' }), creds)
      const callArgs = mockFetch.mock.calls[0] as [string, RequestInit]
      const payload = JSON.parse(callArgs[1].body as string)
      const card = payload.attachments[0].content
      expect(card.body).toHaveLength(1)
      expect(card.body[0].text).toBe('just body')
    })

    it('returns error on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 429, text: () => Promise.resolve('rate limited') })
      const result = await teamsAdapter.send(req(), creds)
      expect(result.ok).toBe(false)
      expect(result.error).toContain('429')
    })

    it('returns error on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('network'))
      const result = await teamsAdapter.send(req(), creds)
      expect(result.ok).toBe(false)
      expect(result.error).toBe('network')
    })
  })

  describe('healthCheck', () => {
    it('returns ok with valid credentials', async () => {
      const result = await teamsAdapter.healthCheck(creds)
      expect(result.status).toBe('ok')
      expect(result.provider).toBe('teams')
      expect(result.details).toBe('webhook-only mode')
    })

    it('returns down with missing webhookUrl', async () => {
      const result = await teamsAdapter.healthCheck({})
      expect(result.status).toBe('down')
      expect(result.details).toContain('Missing Teams webhookUrl')
    })
  })

  describe('parseCredentials (via send)', () => {
    it('throws on missing webhookUrl', async () => {
      await expect(teamsAdapter.send(req(), {})).rejects.toThrow('Missing Teams webhookUrl')
    })
  })
})
