/**
 * @nzila/platform-marketplace — Provider Registry
 *
 * Manages provider manifest registration and lookup.
 *
 * @module @nzila/platform-marketplace/registry
 */
import { createLogger } from '@nzila/os-core/telemetry'
import type { ProviderManifest } from './types'
import { providerManifestSchema } from './types'

const logger = createLogger('marketplace-registry')

export class ProviderRegistry {
  private readonly manifests = new Map<string, ProviderManifest>()

  /**
   * Register a provider manifest after Zod validation.
   */
  register(manifest: ProviderManifest): void {
    const validated = providerManifestSchema.parse(manifest)
    if (this.manifests.has(validated.providerKey)) {
      throw new Error(`Provider already registered: ${validated.providerKey}`)
    }
    this.manifests.set(validated.providerKey, validated)
    logger.info('Provider registered', { providerKey: validated.providerKey })
  }

  get(providerKey: string): ProviderManifest | undefined {
    return this.manifests.get(providerKey)
  }

  getOrThrow(providerKey: string): ProviderManifest {
    const manifest = this.get(providerKey)
    if (!manifest) {
      throw new Error(`Provider not found: ${providerKey}`)
    }
    return manifest
  }

  has(providerKey: string): boolean {
    return this.manifests.has(providerKey)
  }

  list(): readonly ProviderManifest[] {
    return [...this.manifests.values()]
  }

  listByCategory(category: string): readonly ProviderManifest[] {
    return [...this.manifests.values()].filter((m) => m.category === category)
  }

  clear(): void {
    this.manifests.clear()
  }
}

/** Singleton registry for the marketplace */
export const providerRegistry = new ProviderRegistry()
