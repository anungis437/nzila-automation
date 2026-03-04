/**
 * @nzila/platform-integrations-control-plane — Webhook Verification
 *
 * HMAC-SHA256 webhook signature verification for inbound webhooks.
 * Supports multiple provider signature schemes.
 *
 * @module @nzila/platform-integrations-control-plane/webhook-verify
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import { createLogger } from '@nzila/os-core/telemetry'
import type { WebhookVerificationResult } from './types'

const logger = createLogger('integrations-webhook-verify')

// ── Verification ────────────────────────────────────────────────────────────

export interface WebhookVerifyOptions {
  /** Raw request body (string or Buffer) */
  body: string | Buffer
  /** Signature from the webhook header */
  signature: string
  /** HMAC secret for the provider */
  secret: string
  /** Provider name (for logging and scheme selection) */
  provider: string
  /** Optional timestamp for replay protection (ISO 8601) */
  timestamp?: string
  /** Max age in seconds for replay protection (default: 300 = 5 min) */
  maxAgeSeconds?: number
}

/**
 * Verify a webhook signature using HMAC-SHA256.
 * Supports:
 *   - Raw HMAC hex digest (default)
 *   - `sha256=<hex>` prefix (GitHub/Stripe style)
 *   - `v1=<hex>` prefix (Slack style)
 *
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyWebhookSignature(options: WebhookVerifyOptions): WebhookVerificationResult {
  const { body, signature, secret, provider, timestamp, maxAgeSeconds = 300 } = options

  // Replay protection: check timestamp freshness
  if (timestamp) {
    const ts = new Date(timestamp).getTime()
    const now = Date.now()
    const ageSeconds = Math.abs(now - ts) / 1000

    if (ageSeconds > maxAgeSeconds) {
      logger.warn('Webhook timestamp too old', { provider, ageSeconds, maxAgeSeconds })
      return {
        valid: false,
        provider,
        reason: `Timestamp too old: ${ageSeconds}s exceeds max ${maxAgeSeconds}s`,
        verifiedAt: new Date().toISOString(),
      }
    }
  }

  try {
    const bodyStr = typeof body === 'string' ? body : body.toString('utf-8')
    const computedHmac = createHmac('sha256', secret).update(bodyStr).digest('hex')

    // Normalize signature — strip common prefixes
    const normalizedSig = normalizeSignature(signature)

    const sigBuf = Buffer.from(normalizedSig, 'hex')
    const compBuf = Buffer.from(computedHmac, 'hex')

    if (sigBuf.length !== compBuf.length) {
      logger.warn('Webhook signature length mismatch', { provider })
      return {
        valid: false,
        provider,
        reason: 'Signature length mismatch',
        verifiedAt: new Date().toISOString(),
      }
    }

    const valid = timingSafeEqual(sigBuf, compBuf)

    if (!valid) {
      logger.warn('Webhook signature verification failed', { provider })
    } else {
      logger.info('Webhook signature verified', { provider })
    }

    return {
      valid,
      provider,
      reason: valid ? undefined : 'Signature mismatch',
      verifiedAt: new Date().toISOString(),
    }
  } catch (err: unknown) {
    logger.error('Webhook verification error', {
      provider,
      error: err instanceof Error ? err.message : String(err),
    })
    return {
      valid: false,
      provider,
      reason: `Verification error: ${err instanceof Error ? err.message : String(err)}`,
      verifiedAt: new Date().toISOString(),
    }
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Strip known signature prefixes to get raw hex digest.
 */
function normalizeSignature(sig: string): string {
  if (sig.startsWith('sha256=')) return sig.slice(7)
  if (sig.startsWith('v1=')) return sig.slice(3)
  if (sig.startsWith('sha1=')) return sig.slice(5)
  return sig
}

/**
 * Compute HMAC-SHA256 for signing outbound webhooks.
 */
export function computeHmacSha256(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('hex')
}
