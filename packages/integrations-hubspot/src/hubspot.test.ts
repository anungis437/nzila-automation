import { describe, it, expect } from 'vitest'
import {
  mapHubspotStageToCaseStatus,
  mapCaseStatusToHubspotStage,
  HUBSPOT_STAGE_TO_CASE_STATUS,
  CASE_STATUS_TO_HUBSPOT_STAGE,
} from './stage-mapping'
import {
  syncHubspotContact,
  hubspotContactSchema,
} from './contacts'
import type { HubspotClient } from './contacts'
import {
  ingestHubspotWebhook,
  SUPPORTED_WEBHOOK_TYPES,
} from './webhooks'

describe('stage mapping', () => {
  it('maps HubSpot stages to case status', () => {
    expect(mapHubspotStageToCaseStatus('qualifiedtobuy')).toBe('intake')
    expect(mapHubspotStageToCaseStatus('closedwon')).toBe('submitted')
    expect(mapHubspotStageToCaseStatus('closedlost')).toBe('rejected')
  })

  it('returns null for unknown stage', () => {
    expect(mapHubspotStageToCaseStatus('nonexistent')).toBeNull()
  })

  it('maps case status to HubSpot stages', () => {
    expect(mapCaseStatusToHubspotStage('draft')).toBe('qualifiedtobuy')
    expect(mapCaseStatusToHubspotStage('approved')).toBe('closedwon')
    expect(mapCaseStatusToHubspotStage('rejected')).toBe('closedlost')
  })

  it('returns null for unmapped case status', () => {
    expect(mapCaseStatusToHubspotStage('processing')).toBeNull()
  })

  it('has bidirectional mappings', () => {
    for (const [stage, status] of Object.entries(HUBSPOT_STAGE_TO_CASE_STATUS)) {
      const roundTrip = CASE_STATUS_TO_HUBSPOT_STAGE[status]
      // At least one HubSpot stage should map back
      expect(roundTrip).toBeDefined()
    }
  })
})

describe('hubspotContactSchema', () => {
  it('parses valid contact', () => {
    const result = hubspotContactSchema.parse({
      id: '123',
      properties: {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        country: 'NG',
        lifecyclestage: 'lead',
      },
    })
    expect(result.id).toBe('123')
    expect(result.properties.email).toBe('john@example.com')
  })

  it('defaults null for missing optional properties', () => {
    const result = hubspotContactSchema.parse({
      id: '123',
      properties: {},
    })
    expect(result.properties.firstname).toBeNull()
    expect(result.properties.email).toBeNull()
  })
})

describe('syncHubspotContact', () => {
  it('syncs a contact via the client', async () => {
    const mockClient: HubspotClient = {
      async getContact(id) {
        return {
          id,
          properties: {
            firstname: 'Jane',
            lastname: 'Doe',
            email: 'jane@example.com',
            phone: null,
            country: null,
            lifecyclestage: null,
          },
        }
      },
      async listContacts() {
        return { results: [] }
      },
    }

    const result = await syncHubspotContact(mockClient, '42', async (contact) => ({
      clientId: 'client-1',
      action: 'created' as const,
    }))

    expect(result.hubspotContactId).toBe('42')
    expect(result.clientId).toBe('client-1')
    expect(result.action).toBe('created')
  })
})

describe('ingestHubspotWebhook', () => {
  it('routes contact.creation to handler', async () => {
    let createdId: number | null = null

    const results = await ingestHubspotWebhook(
      [{
        subscriptionType: 'contact.creation',
        objectId: 123,
        occurredAt: Date.now(),
        eventId: 1,
        subscriptionId: 1,
        portalId: 1,
        appId: 1,
        attemptNumber: 0,
      }],
      {
        onContactCreated: async (id) => { createdId = id },
      },
    )

    expect(createdId).toBe(123)
    expect(results).toHaveLength(1)
    expect(results[0].processed).toBe(true)
  })

  it('returns unprocessed for unhandled event types', async () => {
    const results = await ingestHubspotWebhook(
      [{
        subscriptionType: 'contact.creation',
        objectId: 1,
        occurredAt: Date.now(),
        eventId: 1,
        subscriptionId: 1,
        portalId: 1,
        appId: 1,
        attemptNumber: 0,
      }],
      {},
    )

    expect(results[0].processed).toBe(false)
  })

  it('supports all documented webhook types', () => {
    expect(SUPPORTED_WEBHOOK_TYPES).toContain('contact.creation')
    expect(SUPPORTED_WEBHOOK_TYPES).toContain('deal.creation')
    expect(SUPPORTED_WEBHOOK_TYPES).toContain('deal.propertyChange')
  })
})
