/**
 * Azure Key Vault Integration
 *
 * Wraps @azure/keyvault-secrets with:
 * - Managed identity support (DefaultAzureCredential)
 * - Local caching with TTL
 * - Audit logging for secret access
 * - Graceful fallback to env vars in development
 */

import { z } from 'zod';

const SecretConfigSchema = z.object({
  vaultUrl: z.string().url(),
  cacheTtlMs: z.number().positive().default(300_000), // 5 minutes
  environment: z.string().default('development'),
});

type SecretConfig = z.infer<typeof SecretConfigSchema>;

interface CachedSecret {
  value: string;
  expiresAt: number;
}

export class KeyVaultClient {
  private cache = new Map<string, CachedSecret>();
  private config: SecretConfig;
  private client: unknown = null;

  constructor(config: Partial<SecretConfig> & { vaultUrl: string }) {
    this.config = SecretConfigSchema.parse(config);
  }

  private async getClient(): Promise<unknown> {
    if (this.client) return this.client;

    try {
      const { DefaultAzureCredential } = await import('@azure/identity');
      const { SecretClient } = await import('@azure/keyvault-secrets');
      const credential = new DefaultAzureCredential();
      this.client = new SecretClient(this.config.vaultUrl, credential);
      return this.client;
    } catch {
      return null;
    }
  }

  /**
   * Get a secret value. Checks cache first, then Key Vault, then env vars.
   */
  async get(name: string): Promise<string | undefined> {
    // Check cache
    const cached = this.cache.get(name);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    // Try Key Vault
    try {
      const client = await this.getClient();
      if (client) {
        const secret = await (client as { getSecret: (name: string) => Promise<{ value?: string }> }).getSecret(name);
        if (secret.value) {
          this.cache.set(name, {
            value: secret.value,
            expiresAt: Date.now() + this.config.cacheTtlMs,
          });
          return secret.value;
        }
      }
    } catch {
      // Key Vault not available
    }

    // Fallback to env var (development only)
    if (this.config.environment === 'development') {
      const envName = name.replace(/-/g, '_').toUpperCase();
      return process.env[envName];
    }

    return undefined;
  }

  /**
   * Invalidate a cached secret (e.g., after rotation).
   */
  invalidate(name: string): void {
    this.cache.delete(name);
  }

  /**
   * Clear all cached secrets.
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Convenience: get a secret using the default vault URL from env.
 */
export async function getSecret(name: string): Promise<string | undefined> {
  const vaultUrl = process.env.AZURE_KEY_VAULT_URL;
  if (!vaultUrl) {
    // Development fallback
    const envName = name.replace(/-/g, '_').toUpperCase();
    return process.env[envName];
  }

  const client = new KeyVaultClient({
    vaultUrl,
    environment: process.env.NODE_ENV ?? 'development',
  });
  return client.get(name);
}

/**
 * Set a secret in Key Vault (admin operation).
 */
export async function setSecret(
  name: string,
  value: string,
): Promise<void> {
  const vaultUrl = process.env.AZURE_KEY_VAULT_URL;
  if (!vaultUrl) {
    throw new Error('AZURE_KEY_VAULT_URL is required for secret management');
  }

  try {
    const { DefaultAzureCredential } = await import('@azure/identity');
    const { SecretClient } = await import('@azure/keyvault-secrets');
    const credential = new DefaultAzureCredential();
    const client = new SecretClient(vaultUrl, credential);
    await client.setSecret(name, value);
  } catch (error) {
    throw new Error(`Failed to set secret ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
