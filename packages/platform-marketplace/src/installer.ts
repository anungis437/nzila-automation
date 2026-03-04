/**
 * @nzila/platform-marketplace — Installer
 *
 * Handles the provider installation lifecycle:
 * 1. Load manifest
 * 2. Validate required secrets
 * 3. Run test API call
 * 4. Save installation to org registry
 *
 * @module @nzila/platform-marketplace/installer
 */
import { randomUUID } from 'node:crypto'
import { createLogger } from '@nzila/os-core/telemetry'
import type {
  MarketplacePorts,
  ProviderInstallation,
  InstallationStatus,
} from './types'
import { providerRegistry } from './registry'

const logger = createLogger('marketplace-installer')

export interface InstallRequest {
  readonly orgId: string
  readonly providerKey: string
  readonly installedBy: string
  readonly secrets: Record<string, string>
  readonly configuration?: Record<string, string>
}

export interface InstallResult {
  readonly ok: boolean
  readonly installation?: ProviderInstallation
  readonly error?: string
}

/**
 * Install a provider for an organisation.
 * Validates secrets, runs a test call, and persists the installation.
 */
export async function installProvider(
  request: InstallRequest,
  ports: MarketplacePorts,
): Promise<InstallResult> {
  const { orgId, providerKey, installedBy, secrets, configuration } = request

  logger.info('Installing provider', { orgId, providerKey, installedBy })

  // 1. Resolve manifest (registry first, then ports)
  const manifest = providerRegistry.get(providerKey) ?? await ports.loadManifest(providerKey)
  if (!manifest) {
    return { ok: false, error: `Provider not found: ${providerKey}` }
  }

  // 2. Check required secrets
  const missingSecrets = manifest.requiredSecrets
    .filter((s) => s.required && !secrets[s.key])
    .map((s) => s.key)

  if (missingSecrets.length > 0) {
    return {
      ok: false,
      error: `Missing required secrets: ${missingSecrets.join(', ')}`,
    }
  }

  // 3. Validate secrets
  const secretsValid = await ports.validateSecrets(providerKey, secrets)
  if (!secretsValid) {
    return { ok: false, error: 'Secret validation failed' }
  }

  // 4. Run test call
  const testResult = await ports.runTestCall(providerKey, secrets)

  const now = new Date().toISOString()
  const installation: ProviderInstallation = {
    installationId: randomUUID(),
    orgId,
    providerKey,
    status: testResult.ok ? 'active' : ('failed' as InstallationStatus),
    installedBy,
    installedAt: now,
    secretsValidated: true,
    testCallSucceeded: testResult.ok,
    testCallAt: now,
    configuration: configuration ?? {},
    lastError: testResult.error,
  }

  // 5. Persist
  await ports.saveInstallation(installation)

  logger.info('Provider installation complete', {
    orgId,
    providerKey,
    status: installation.status,
  })

  return { ok: testResult.ok, installation }
}

/**
 * Uninstall a provider for an organisation.
 */
export async function uninstallProvider(
  orgId: string,
  providerKey: string,
  ports: MarketplacePorts,
): Promise<void> {
  const existing = await ports.loadInstallation(orgId, providerKey)
  if (!existing) {
    throw new Error(`No installation found for ${providerKey} in org ${orgId}`)
  }

  const updated: ProviderInstallation = {
    ...existing,
    status: 'uninstalled',
  }

  await ports.saveInstallation(updated)

  logger.info('Provider uninstalled', { orgId, providerKey })
}
