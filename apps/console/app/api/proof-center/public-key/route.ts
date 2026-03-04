/**
 * API — Procurement Pack Public Key
 * GET /api/proof-center/public-key — returns Ed25519 public key for signature verification
 *
 * Consumers of procurement packs use this endpoint to retrieve the
 * public key needed to verify Ed25519 signatures in exported ZIPs.
 */
import { NextResponse } from 'next/server'
import { getSigningKeyPair } from '@nzila/platform-procurement-proof'
import { authenticateUser } from '@/lib/api-guards'
import { createLogger } from '@nzila/os-core'

const logger = createLogger('api:proof-center-public-key')

export async function GET() {
  try {
    const auth = await authenticateUser()
    if (!auth.ok) return auth.response

    const { keyId, publicKey } = getSigningKeyPair()

    logger.info('Public key retrieved', { userId: auth.userId, keyId })

    return NextResponse.json({
      keyId,
      algorithm: 'Ed25519',
      publicKey: Buffer.from(publicKey).toString('base64'),
      encoding: 'base64',
      createdAt: new Date().toISOString(),
      usage: 'Verify procurement pack signatures (signatures.json) against MANIFEST hash.',
      verificationDocs: '/docs/procurement-pack.md#verification',
    })
  } catch (err) {
    logger.error('[Public Key Error]', err instanceof Error ? err : { detail: err })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
