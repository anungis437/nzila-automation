/**
 * @nzila/secrets — Secret Management
 *
 * Provides:
 * - Azure Key Vault integration with managed identity
 * - Automatic secret rotation with evidence trails
 * - Runtime secret injection (no env vars in production)
 * - Secret scanning utilities for CI
 */

export { KeyVaultClient, getSecret, setSecret } from './keyvault.js';
export {
  SecretRotationManager,
  type RotationPolicy,
  type RotationEvent,
} from './rotation.js';
export {
  SecretScanner,
  type ScanResult,
  type SecretPattern,
} from './scanner.js';
