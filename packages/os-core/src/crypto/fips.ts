/**
 * @nzila/os-core — FIPS 140-3 Crypto Boundary
 *
 * Enforces FIPS-validated cryptographic primitives in production.
 * Node.js must be compiled with OpenSSL FIPS provider or run
 * with --openssl-config pointing to a FIPS-enabled config.
 *
 * Environment Variables:
 *   NZILA_FIPS_REQUIRED  — 'true' to enforce FIPS mode (default in production)
 *   NZILA_FIPS_STRICT    — 'true' to abort on any non-FIPS algorithm usage
 *
 * How it works:
 *   1. `assertFipsMode()` should be called at process boot (see boot-assert.ts)
 *   2. All crypto wrappers in this module only use FIPS-approved algorithms
 *   3. `createFipsHash()` / `createFipsHmac()` / `fipsRandomBytes()` are
 *      drop-in replacements for `crypto.createHash()` etc.
 *
 * FIPS-approved algorithms exposed:
 *   - SHA-256, SHA-384, SHA-512  (hashing)
 *   - HMAC-SHA-256               (message authentication)
 *   - AES-256-GCM                (authenticated encryption)
 *   - PBKDF2 with SHA-256        (key derivation)
 *   - ECDSA P-256                (digital signatures, future)
 *
 * Non-approved algorithms BLOCKED:
 *   - MD5, SHA-1, RC4, DES, 3DES, Blowfish
 *
 * References:
 *   - NIST SP 800-140B (FIPS 140-3 testing)
 *   - Node.js FIPS: https://nodejs.org/api/crypto.html#fips-mode
 *   - Azure Key Vault Premium uses FIPS 140-2 Level 2 HSMs
 *
 * @module @nzila/os-core/crypto/fips
 */
import crypto from 'node:crypto'

// ── FIPS Status ─────────────────────────────────────────────────────────────

export interface FipsStatus {
  /** Whether OpenSSL FIPS provider is active */
  fipsEnabled: boolean
  /** Whether FIPS is required by configuration */
  fipsRequired: boolean
  /** Whether strict mode blocks non-FIPS algorithms */
  strictMode: boolean
  /** OpenSSL version string */
  opensslVersion: string
  /** Node.js version */
  nodeVersion: string
}

/**
 * Algorithms approved under FIPS 140-3.
 * Only these may be used in production when FIPS is enforced.
 */
export const FIPS_APPROVED_HASH_ALGORITHMS = [
  'sha256',
  'sha384',
  'sha512',
  'sha3-256',
  'sha3-384',
  'sha3-512',
] as const

export const FIPS_APPROVED_CIPHER_ALGORITHMS = [
  'aes-256-gcm',
  'aes-128-gcm',
  'aes-256-cbc',
  'aes-128-cbc',
] as const

const BLOCKED_ALGORITHMS = new Set([
  'md5',
  'sha1',
  'rc4',
  'des',
  'des3',
  'des-ede3',
  'blowfish',
  'bf',
  'rc2',
])

type FipsHashAlgorithm = (typeof FIPS_APPROVED_HASH_ALGORITHMS)[number]
type FipsCipherAlgorithm = (typeof FIPS_APPROVED_CIPHER_ALGORITHMS)[number]

// ── Detection ───────────────────────────────────────────────────────────────

function isFipsRequired(): boolean {
  if (process.env.NZILA_FIPS_REQUIRED === 'true') return true
  if (process.env.NODE_ENV === 'production') return true
  return false
}

function isStrictMode(): boolean {
  return process.env.NZILA_FIPS_STRICT === 'true'
}

/**
 * Check if the Node.js runtime has FIPS mode enabled.
 * Works with both OpenSSL 3.x FIPS provider and legacy fipsMode.
 */
export function isFipsEnabled(): boolean {
  try {
    return crypto.getFips() === 1
  } catch {
    return false
  }
}

/**
 * Attempt to enable FIPS mode programmatically.
 * Only works if Node.js was built with FIPS support (OpenSSL 3.x with FIPS provider).
 */
export function enableFips(): boolean {
  try {
    crypto.setFips(1 as unknown as boolean)
    return crypto.getFips() === 1
  } catch {
    return false
  }
}

/**
 * Return current FIPS status for diagnostics / boot logging.
 */
export function getFipsStatus(): FipsStatus {
  return {
    fipsEnabled: isFipsEnabled(),
    fipsRequired: isFipsRequired(),
    strictMode: isStrictMode(),
    opensslVersion: (crypto.constants as Record<string, unknown>)?.OPENSSL_VERSION_TEXT as string
      ?? (process as unknown as { versions?: { openssl?: string } }).versions?.openssl
      ?? 'unknown',
    nodeVersion: process.version,
  }
}

// ── Boot Assertion ──────────────────────────────────────────────────────────

/**
 * Assert FIPS mode at process startup.
 *
 * - In production (or when NZILA_FIPS_REQUIRED=true): attempts to enable FIPS.
 *   If it cannot be enabled, logs a critical warning. If NZILA_FIPS_STRICT=true,
 *   the process will exit.
 * - In dev/test: logs the FIPS status but does not block startup.
 *
 * Call this from `boot-assert.ts` or the application entry point.
 */
export function assertFipsMode(): FipsStatus {
  const status = getFipsStatus()

  if (status.fipsRequired && !status.fipsEnabled) {
    // Try to enable programmatically
    const enabled = enableFips()
    status.fipsEnabled = enabled

    if (!enabled) {
      const msg = [
        'FIPS 140-3 CRYPTO BOUNDARY VIOLATION',
        `  FIPS required: ${status.fipsRequired}`,
        `  FIPS enabled:  false`,
        `  OpenSSL:       ${status.opensslVersion}`,
        `  Node.js:       ${status.nodeVersion}`,
        '',
        'To resolve:',
        '  1. Use a Node.js build with OpenSSL FIPS provider',
        '  2. Set --openssl-config=/path/to/fips-enabled-config',
        '  3. Or use Azure Container Apps with FIPS-enabled base image',
      ].join('\n')

      if (status.strictMode) {
        console.error(`[FATAL] ${msg}`)
        process.exit(78) // EX_CONFIG
      } else {
        console.warn(`[WARN] ${msg}`)
        console.warn('[WARN] Running with degraded FIPS compliance — NOT suitable for IL4/IL5')
      }
    }
  }

  return status
}

// ── FIPS-Safe Crypto Wrappers ───────────────────────────────────────────────

function assertApprovedHash(algorithm: string): asserts algorithm is FipsHashAlgorithm {
  if (BLOCKED_ALGORITHMS.has(algorithm.toLowerCase())) {
    throw new Error(
      `[FIPS] Blocked algorithm: "${algorithm}" is not FIPS 140-3 approved. ` +
        `Use one of: ${FIPS_APPROVED_HASH_ALGORITHMS.join(', ')}`,
    )
  }
}

function assertApprovedCipher(algorithm: string): asserts algorithm is FipsCipherAlgorithm {
  const lower = algorithm.toLowerCase()
  const approved = FIPS_APPROVED_CIPHER_ALGORITHMS as readonly string[]
  if (!approved.includes(lower)) {
    throw new Error(
      `[FIPS] Blocked cipher: "${algorithm}" is not FIPS 140-3 approved. ` +
        `Use one of: ${FIPS_APPROVED_CIPHER_ALGORITHMS.join(', ')}`,
    )
  }
}

/**
 * Create a FIPS-approved hash instance. Blocks MD5, SHA-1, etc.
 */
export function createFipsHash(
  algorithm: FipsHashAlgorithm = 'sha256',
): crypto.Hash {
  assertApprovedHash(algorithm)
  return crypto.createHash(algorithm)
}

/**
 * Create a FIPS-approved HMAC instance. Blocks non-approved algorithms.
 */
export function createFipsHmac(
  algorithm: FipsHashAlgorithm,
  key: crypto.BinaryLike | crypto.KeyObject,
): crypto.Hmac {
  assertApprovedHash(algorithm)
  return crypto.createHmac(algorithm, key)
}

/**
 * Generate cryptographically secure random bytes.
 * In FIPS mode, uses the FIPS-approved DRBG from OpenSSL.
 */
export function fipsRandomBytes(size: number): Buffer {
  return crypto.randomBytes(size)
}

/**
 * FIPS-approved PBKDF2 key derivation.
 */
export function fipsPbkdf2(
  password: crypto.BinaryLike,
  salt: crypto.BinaryLike,
  iterations: number,
  keyLength: number,
  digest: FipsHashAlgorithm = 'sha256',
): Promise<Buffer> {
  assertApprovedHash(digest)
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keyLength, digest, (err, key) => {
      if (err) reject(err)
      else resolve(key)
    })
  })
}

// ── AES-256-GCM (FIPS) ─────────────────────────────────────────────────────

export interface FipsEncryptResult {
  /** Base64-encoded ciphertext */
  ciphertext: string
  /** Base64-encoded 96-bit IV */
  iv: string
  /** Base64-encoded 128-bit auth tag */
  authTag: string
  /** Algorithm used */
  algorithm: 'aes-256-gcm'
  /** FIPS mode at time of encryption */
  fipsMode: boolean
}

/**
 * Encrypt plaintext with AES-256-GCM (FIPS-approved).
 *
 * @param plaintext  UTF-8 string to encrypt
 * @param key       32-byte (256-bit) key
 * @param aad       Optional additional authenticated data
 */
export function fipsEncrypt(
  plaintext: string,
  key: Buffer,
  aad?: Buffer,
): FipsEncryptResult {
  if (key.length !== 32) {
    throw new Error('[FIPS] AES-256-GCM requires a 256-bit (32-byte) key')
  }

  // 96-bit IV as recommended by NIST SP 800-38D
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

  if (aad) cipher.setAAD(aad)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
    algorithm: 'aes-256-gcm',
    fipsMode: isFipsEnabled(),
  }
}

/**
 * Decrypt AES-256-GCM ciphertext (FIPS-approved).
 */
export function fipsDecrypt(
  encrypted: FipsEncryptResult,
  key: Buffer,
  aad?: Buffer,
): string {
  if (key.length !== 32) {
    throw new Error('[FIPS] AES-256-GCM requires a 256-bit (32-byte) key')
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(encrypted.iv, 'base64'),
  )

  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'base64'))
  if (aad) decipher.setAAD(aad)

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, 'base64')),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}

// ── Algorithm Audit ─────────────────────────────────────────────────────────

export interface CryptoAuditResult {
  timestamp: string
  fipsStatus: FipsStatus
  availableHashes: string[]
  availableCiphers: string[]
  blockedHashesInUse: string[]
  blockedCiphersInUse: string[]
  compliant: boolean
}

/**
 * Audit the runtime for FIPS compliance.
 * Lists available algorithms and flags any non-approved ones.
 */
export function auditCryptoCompliance(): CryptoAuditResult {
  const hashes = crypto.getHashes()
  const ciphers = crypto.getCiphers()
  const approved = new Set([
    ...FIPS_APPROVED_HASH_ALGORITHMS,
    ...FIPS_APPROVED_CIPHER_ALGORITHMS,
  ] as string[])

  const blockedHashes = hashes.filter((h) => BLOCKED_ALGORITHMS.has(h.toLowerCase()))
  const blockedCiphers = ciphers.filter((c) =>
    c.toLowerCase().includes('des') ||
    c.toLowerCase().includes('rc4') ||
    c.toLowerCase().includes('blowfish') ||
    c.toLowerCase().includes('bf-'),
  )

  const status = getFipsStatus()

  return {
    timestamp: new Date().toISOString(),
    fipsStatus: status,
    availableHashes: hashes.filter((h) => approved.has(h)),
    availableCiphers: ciphers.filter((c) => approved.has(c)),
    blockedHashesInUse: blockedHashes,
    blockedCiphersInUse: blockedCiphers,
    compliant: status.fipsEnabled && blockedHashes.length === 0,
  }
}
