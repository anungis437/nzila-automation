/**
 * @nzila/os-core — mTLS (Mutual TLS) Service Mesh Utilities
 *
 * Provides service-to-service authentication using mutual TLS certificates.
 * Designed for Azure Container Apps with Envoy sidecar or standalone Node.js.
 *
 * Architecture:
 *   ┌─────────┐  mTLS  ┌─────────┐  mTLS  ┌─────────┐
 *   │ Service │◄──────►│ Service │◄──────►│ Service │
 *   │  (web)  │        │(console)│        │  (api)  │
 *   └────┬────┘        └────┬────┘        └────┬────┘
 *        │                  │                  │
 *        └──────────────────┼──────────────────┘
 *                    ┌──────▼──────┐
 *                    │  CA / Vault │
 *                    │ (Azure KV)  │
 *                    └─────────────┘
 *
 * Environment Variables:
 *   MTLS_ENABLED             — 'true' to enforce mTLS (default: false)
 *   MTLS_CA_CERT_PATH        — Path to CA certificate PEM
 *   MTLS_SERVICE_CERT_PATH   — Path to service certificate PEM
 *   MTLS_SERVICE_KEY_PATH    — Path to service private key PEM
 *   MTLS_ALLOWED_SERVICES    — Comma-separated list of allowed CN/SAN values
 *   MTLS_REJECT_UNAUTHORIZED — 'true' to reject unknown certs (default: true)
 *
 * In Azure Container Apps:
 *   - Certificates managed by Azure Key Vault
 *   - Envoy sidecar handles mTLS termination
 *   - This module validates the X-Forwarded-Client-Cert header
 *
 * @module @nzila/os-core/mtls
 */
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

// ── Types ─────────────────────────────────────────────────────────────────

export interface MtlsConfig {
  enabled: boolean
  caCertPath?: string
  serviceCertPath?: string
  serviceKeyPath?: string
  allowedServices: string[]
  rejectUnauthorized: boolean
}

export interface ServiceIdentity {
  /** Common Name from the client certificate */
  commonName: string
  /** Subject Alternative Names */
  sans: string[]
  /** Certificate fingerprint (SHA-256) */
  fingerprint: string
  /** Certificate serial number */
  serialNumber: string
  /** Certificate not-after date */
  validUntil: Date
  /** Whether the peer is in the allow-list */
  authorized: boolean
}

export interface MtlsVerificationResult {
  /** Whether mTLS verification passed */
  verified: boolean
  /** Service identity if verification passed */
  identity?: ServiceIdentity
  /** Reason for failure */
  reason?: string
  /** Timestamp of verification */
  timestamp: string
}

// ── Configuration ─────────────────────────────────────────────────────────

export function getMtlsConfig(): MtlsConfig {
  const allowedRaw = process.env.MTLS_ALLOWED_SERVICES ?? ''
  return {
    enabled: process.env.MTLS_ENABLED === 'true',
    caCertPath: process.env.MTLS_CA_CERT_PATH,
    serviceCertPath: process.env.MTLS_SERVICE_CERT_PATH,
    serviceKeyPath: process.env.MTLS_SERVICE_KEY_PATH,
    allowedServices: allowedRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    rejectUnauthorized: process.env.MTLS_REJECT_UNAUTHORIZED !== 'false',
  }
}

/**
 * Load TLS options for Node.js https.createServer() or tls.createServer().
 * Returns undefined if mTLS is not enabled.
 */
export function getTlsServerOptions(): Record<string, unknown> | undefined {
  const config = getMtlsConfig()
  if (!config.enabled) return undefined

  if (!config.caCertPath || !config.serviceCertPath || !config.serviceKeyPath) {
    throw new Error(
      '[mTLS] MTLS_ENABLED=true but certificate paths not configured. ' +
        'Set MTLS_CA_CERT_PATH, MTLS_SERVICE_CERT_PATH, MTLS_SERVICE_KEY_PATH.',
    )
  }

  return {
    ca: readFileSync(config.caCertPath),
    cert: readFileSync(config.serviceCertPath),
    key: readFileSync(config.serviceKeyPath),
    requestCert: true,
    rejectUnauthorized: config.rejectUnauthorized,
    minVersion: 'TLSv1.2',
  }
}

// ── XFCC Header Parsing (Azure Container Apps / Envoy) ────────────────────

/**
 * Parse the X-Forwarded-Client-Cert (XFCC) header set by Envoy/Azure.
 *
 * Format: `Hash=<hash>;Cert=<url-encoded-pem>;Subject="CN=svc-name,...";URI=spiffe://...`
 *
 * @param xfccHeader  Value of the X-Forwarded-Client-Cert header
 */
export function parseXFCC(xfccHeader: string): {
  hash?: string
  subject?: string
  cn?: string
  uri?: string
  dns?: string[]
} {
  const parts: Record<string, string> = {}
  const dnsNames: string[] = []

  for (const segment of xfccHeader.split(';')) {
    const eqIndex = segment.indexOf('=')
    if (eqIndex === -1) continue
    const key = segment.slice(0, eqIndex).trim().toLowerCase()
    const value = segment.slice(eqIndex + 1).trim().replace(/^"|"$/g, '')
    if (key === 'dns') {
      dnsNames.push(value)
    } else {
      parts[key] = value
    }
  }

  // Extract CN from Subject
  let cn: string | undefined
  if (parts.subject) {
    const cnMatch = parts.subject.match(/CN=([^,]+)/i)
    if (cnMatch) cn = cnMatch[1].trim()
  }

  return {
    hash: parts.hash,
    subject: parts.subject,
    cn,
    uri: parts.uri,
    dns: dnsNames.length > 0 ? dnsNames : undefined,
  }
}

/**
 * Verify a service identity from the XFCC header against the allow-list.
 */
export function verifyServiceIdentity(
  xfccHeader: string | undefined | null,
  config?: MtlsConfig,
): MtlsVerificationResult {
  const cfg = config ?? getMtlsConfig()
  const timestamp = new Date().toISOString()

  if (!cfg.enabled) {
    return { verified: true, reason: 'mTLS not enabled (passthrough)', timestamp }
  }

  if (!xfccHeader) {
    return { verified: false, reason: 'Missing X-Forwarded-Client-Cert header', timestamp }
  }

  const parsed = parseXFCC(xfccHeader)

  if (!parsed.cn) {
    return { verified: false, reason: 'No CN found in XFCC header', timestamp }
  }

  const fingerprint = parsed.hash
    ? parsed.hash
    : createHash('sha256').update(xfccHeader).digest('hex')

  const authorized =
    cfg.allowedServices.length === 0 ||
    cfg.allowedServices.includes(parsed.cn) ||
    (parsed.dns?.some((d) => cfg.allowedServices.includes(d)) ?? false)

  const identity: ServiceIdentity = {
    commonName: parsed.cn,
    sans: parsed.dns ?? [],
    fingerprint,
    serialNumber: 'proxy-terminated',
    validUntil: new Date('2099-12-31'), // Proxy handles cert lifecycle
    authorized,
  }

  if (!authorized) {
    return {
      verified: false,
      identity,
      reason: `Service "${parsed.cn}" not in allow-list: [${cfg.allowedServices.join(', ')}]`,
      timestamp,
    }
  }

  return { verified: true, identity, timestamp }
}

// ── Middleware Helper ────────────────────────────────────────────────────

/**
 * Express/Fastify-compatible middleware function type.
 * Returns the verification result for use in request context.
 */
export function createMtlsMiddleware(config?: MtlsConfig) {
  const cfg = config ?? getMtlsConfig()

  return function mtlsMiddleware(
    req: { headers: Record<string, string | string[] | undefined> },
  ): MtlsVerificationResult {
    const xfcc =
      (req.headers['x-forwarded-client-cert'] as string) ??
      (req.headers['x-client-cert-cn'] as string)

    return verifyServiceIdentity(xfcc, cfg)
  }
}

// ── Health Check ────────────────────────────────────────────────────────

export interface MtlsHealthStatus {
  enabled: boolean
  configured: boolean
  allowedServiceCount: number
  certPaths: {
    ca: boolean
    cert: boolean
    key: boolean
  }
}

/**
 * Check mTLS configuration health for diagnostics endpoints.
 */
export function getMtlsHealth(): MtlsHealthStatus {
  const config = getMtlsConfig()
  return {
    enabled: config.enabled,
    configured: !!(config.caCertPath && config.serviceCertPath && config.serviceKeyPath),
    allowedServiceCount: config.allowedServices.length,
    certPaths: {
      ca: !!config.caCertPath,
      cert: !!config.serviceCertPath,
      key: !!config.serviceKeyPath,
    },
  }
}
