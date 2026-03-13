import { describe, it, expect, vi, beforeEach } from 'vitest'
import { slackAdapter } from './adapter'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  mockFetch.mockReset()
})

describe('slackAdapter', () => {
  it('exposes provider and channel', () => {
    expect(slackAdapter.provider).toBe('slack')
    expect(slackAdapter.channel).toBe('chatops')
  })

  describe('send — webhook mode', () => {
    const creds = { webhookUrl: 'https://hooks.slack.com/services/T/B/X' }

    it('posts to webhook and returns ok', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      const result = await slackAdapter.send({ to: '', body: 'hello' }, creds)
      expect(result.ok).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(creds.webhookUrl, expect.objectContaining({ method: 'POST' }))
    })

    it('formats subject as bold prefix', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await slackAdapter.send({ to: '', subject: 'Alert', body: 'details' }, creds)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.text).toBe('*Alert*\ndetails')
    })

    it('returns error on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 403 })
      const result = await slackAdapter.send({ to: '', body: 'x' }, creds)
      expect(result.ok).toBe(false)
      expect(result.error).toContain('403')
    })

    it('returns error on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('network'))
      const result = await slackAdapter.send({ to: '', body: 'x' }, creds)
      expect(result.ok).toBe(false)
      expect(result.error).toBe('network')
    })
  })

  describe('send — bot token mode', () => {
    const creds = { webhookUrl: 'https://hooks.slack.com/services/T/B/X', botToken: 'xoxb-test' }

    it('uses Slack Web API when botToken and to are provided', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: true, ts: '123.456' }) })
      const result = await slackAdapter.send({ to: '#general', body: 'hi' }, creds)
      expect(result.ok).toBe(true)
      expect(result.providerMessageId).toBe('123.456')
      expect(mockFetch).toHaveBeenCalledWith('https://slack.com/api/chat.postMessage', expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer xoxb-test' }),
      }))
    })

    it('returns error when Slack API returns not ok', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: false, error: 'channel_not_found' }) })
      const result = await slackAdapter.send({ to: '#nope', body: 'hi' }, creds)
      expect(result.ok).toBe(false)
      expect(result.error).toBe('channel_not_found')
    })
  })

  describe('healthCheck', () => {
    it('returns ok in webhook-only mode', async () => {
      const result = await slackAdapter.healthCheck({ webhookUrl: 'https://hooks.slack.com/services/T/B/X' })
      expect(result.status).toBe('ok')
      expect(result.provider).toBe('slack')
      expect(result.details).toContain('webhook-only')
    })

    it('calls auth.test with bot token', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: true }) })
      const result = await slackAdapter.healthCheck({ webhookUrl: 'https://hooks.slack.com/services/T/B/X', botToken: 'xoxb-test' })
      expect(result.status).toBe('ok')
      expect(mockFetch).toHaveBeenCalledWith('https://slack.com/api/auth.test', expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer xoxb-test' }),
      }))
    })

    it('returns down on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('timeout'))
      const result = await slackAdapter.healthCheck({ webhookUrl: 'https://hooks.slack.com/services/T/B/X', botToken: 'xoxb-test' })
      expect(result.status).toBe('down')
      expect(result.details).toBe('timeout')
    })
  })

  describe('parseCredentials (via send)', () => {
    it('throws on missing webhookUrl', async () => {
      await expect(slackAdapter.send({ to: '', body: 'x' }, {})).rejects.toThrow('Missing Slack webhookUrl')
    })
  })
})
