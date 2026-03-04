/**
 * @nzila/platform-marketplace — Installer + Registry Tests
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { ProviderRegistry } from '../registry'
import { installProvider, uninstallProvider } from '../installer'
import { exportProviderConfigs } from '../exporter'
import type { MarketplacePorts, ProviderManifest, ProviderInstallation } from '../types'

const slackManifest: ProviderManifest = {
  providerKey: 'slack',
  name: 'Slack',
  version: '1.0.0',
  description: 'Slack chatops',
  category: 'chatops',
  scopes: ['chat:write'],
  webhookSigning: {
    algorithm: 'hmac-sha256',
    headerName: 'X-Slack-Signature',
    toleranceSeconds: 300,
  },
  retryPolicy: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
  },
  requiredSecrets: [
    { key: 'SLACK_BOT_TOKEN', description: 'Bot token', required: true },
    { key: 'SLACK_SIGNING_SECRET', description: 'Signing secret', required: true },
  ],
  metadata: {},
}

const hubspotManifest: ProviderManifest = {
  providerKey: 'hubspot',
  name: 'HubSpot',
  version: '1.0.0',
  description: 'HubSpot CRM',
  category: 'crm',
  scopes: ['crm.objects.contacts.read'],
  webhookSigning: {
    algorithm: 'hmac-sha256',
    headerName: 'X-HubSpot-Signature-v3',
  },
  retryPolicy: {
    maxAttempts: 5,
    initialDelayMs: 2000,
    maxDelayMs: 60000,
    backoffMultiplier: 2,
  },
  requiredSecrets: [
    { key: 'HUBSPOT_ACCESS_TOKEN', description: 'Access token', required: true },
    { key: 'HUBSPOT_PORTAL_ID', description: 'Portal ID', required: true },
  ],
  metadata: {},
}

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry

  beforeEach(() => {
    registry = new ProviderRegistry()
  })

  it('registers and retrieves a provider', () => {
    registry.register(slackManifest)
    expect(registry.has('slack')).toBe(true)
    expect(registry.get('slack')?.name).toBe('Slack')
  })

  it('throws on duplicate registration', () => {
    registry.register(slackManifest)
    expect(() => registry.register(slackManifest)).toThrow('already registered')
  })

  it('lists providers by category', () => {
    registry.register(slackManifest)
    registry.register(hubspotManifest)
    expect(registry.listByCategory('chatops')).toHaveLength(1)
    expect(registry.listByCategory('crm')).toHaveLength(1)
  })
})

describe('installProvider', () => {
  const installations = new Map<string, ProviderInstallation>()

  const ports: MarketplacePorts = {
    loadManifest: async (key) =>
      key === 'slack' ? slackManifest : key === 'hubspot' ? hubspotManifest : null,
    listManifests: async () => [slackManifest, hubspotManifest],
    saveInstallation: async (inst) => { installations.set(`${inst.orgId}:${inst.providerKey}`, inst) },
    loadInstallation: async (orgId, key) => installations.get(`${orgId}:${key}`) ?? null,
    listInstallations: async (orgId) =>
      [...installations.values()].filter((i) => i.orgId === orgId),
    validateSecrets: async () => true,
    runTestCall: async () => ({ ok: true }),
  }

  beforeEach(() => {
    installations.clear()
  })

  it('installs a provider end-to-end', async () => {
    const result = await installProvider({
      orgId: 'org-1',
      providerKey: 'slack',
      installedBy: 'user-1',
      secrets: { SLACK_BOT_TOKEN: 'xoxb-test', SLACK_SIGNING_SECRET: 'secret' },
    }, ports)

    expect(result.ok).toBe(true)
    expect(result.installation?.status).toBe('active')
    expect(result.installation?.testCallSucceeded).toBe(true)
  })

  it('fails when required secrets are missing', async () => {
    const result = await installProvider({
      orgId: 'org-1',
      providerKey: 'slack',
      installedBy: 'user-1',
      secrets: { SLACK_BOT_TOKEN: 'xoxb-test' }, // missing SLACK_SIGNING_SECRET
    }, ports)

    expect(result.ok).toBe(false)
    expect(result.error).toContain('SLACK_SIGNING_SECRET')
  })

  it('installs two providers for same org', async () => {
    await installProvider({
      orgId: 'org-1',
      providerKey: 'slack',
      installedBy: 'user-1',
      secrets: { SLACK_BOT_TOKEN: 'x', SLACK_SIGNING_SECRET: 's' },
    }, ports)

    await installProvider({
      orgId: 'org-1',
      providerKey: 'hubspot',
      installedBy: 'user-1',
      secrets: { HUBSPOT_ACCESS_TOKEN: 'pat', HUBSPOT_PORTAL_ID: '123' },
    }, ports)

    const orgInstallations = await ports.listInstallations('org-1')
    expect(orgInstallations).toHaveLength(2)
  })
})

describe('exportProviderConfigs', () => {
  it('exports redacted configs', async () => {
    const installations = new Map<string, ProviderInstallation>()
    installations.set('org-1:slack', {
      installationId: 'inst-1',
      orgId: 'org-1',
      providerKey: 'slack',
      status: 'active',
      installedBy: 'user-1',
      installedAt: '2026-03-04T00:00:00.000Z',
      secretsValidated: true,
      testCallSucceeded: true,
      configuration: { channel: '#alerts' },
    })

    const ports: MarketplacePorts = {
      loadManifest: async () => slackManifest,
      listManifests: async () => [slackManifest],
      saveInstallation: async () => {},
      loadInstallation: async () => null,
      listInstallations: async (orgId) =>
        [...installations.values()].filter((i) => i.orgId === orgId),
      validateSecrets: async () => true,
      runTestCall: async () => ({ ok: true }),
    }

    const configs = await exportProviderConfigs('org-1', ports)
    expect(configs).toHaveLength(1)
    expect(configs[0].redactedConfiguration.channel).toBe('***')
    expect(configs[0].secretsConfigured).toBe(true)
  })
})
