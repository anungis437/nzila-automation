/**
 * @nzila/platform-marketplace — Exporter
 *
 * Exports redacted provider configuration for inclusion in proof packs.
 * All secret values are replaced with "***".
 *
 * @module @nzila/platform-marketplace/exporter
 */
import { createLogger } from '@nzila/os-core/telemetry'
import type { MarketplacePorts, RedactedProviderConfig } from './types'
import { providerRegistry } from './registry'

const logger = createLogger('marketplace-exporter')

/**
 * Export redacted configuration for all installed providers in an org.
 */
export async function exportProviderConfigs(
  orgId: string,
  ports: MarketplacePorts,
): Promise<readonly RedactedProviderConfig[]> {
  const installations = await ports.listInstallations(orgId)
  const configs: RedactedProviderConfig[] = []

  for (const inst of installations) {
    if (inst.status === 'uninstalled') continue

    const manifest = providerRegistry.get(inst.providerKey) ??
      await ports.loadManifest(inst.providerKey)

    const redactedConfiguration: Record<string, string> = {}
    for (const key of Object.keys(inst.configuration)) {
      redactedConfiguration[key] = '***'
    }

    configs.push({
      providerKey: inst.providerKey,
      name: manifest?.name ?? inst.providerKey,
      version: manifest?.version ?? 'unknown',
      status: inst.status,
      scopes: manifest?.scopes ?? [],
      secretsConfigured: inst.secretsValidated,
      testCallSucceeded: inst.testCallSucceeded,
      installedAt: inst.installedAt,
      installedBy: inst.installedBy,
      redactedConfiguration,
    })
  }

  logger.info('Exported provider configs', { orgId, count: configs.length })
  return configs
}
