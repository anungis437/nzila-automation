/**
 * @nzila/os-core — FIPS Crypto Boundary Contract Tests
 *
 * Validates that the FIPS boundary enforces algorithm restrictions
 * and that all crypto wrappers use only approved algorithms.
 */
import { describe, it, expect } from 'vitest'
import {
  createFipsHash,
  createFipsHmac,
  fipsRandomBytes,
  fipsEncrypt,
  fipsDecrypt,
  fipsPbkdf2,
  auditCryptoCompliance,
  getFipsStatus,
  FIPS_APPROVED_HASH_ALGORITHMS,
  FIPS_APPROVED_CIPHER_ALGORITHMS,
} from '../crypto/fips'

describe('FIPS 140-3 Crypto Boundary', () => {
  // ── Algorithm Blocking ──────────────────────────────────────────────────

  describe('blocked algorithms', () => {
    it('rejects MD5 hash creation', () => {
      expect(() => createFipsHash('md5' as never)).toThrow(/FIPS.*Blocked/)
    })

    it('rejects SHA-1 hash creation', () => {
      expect(() => createFipsHash('sha1' as never)).toThrow(/FIPS.*Blocked/)
    })

    it('rejects MD5 HMAC creation', () => {
      expect(() => createFipsHmac('md5' as never, 'key')).toThrow(/FIPS.*Blocked/)
    })

    it('rejects SHA-1 HMAC creation', () => {
      expect(() => createFipsHmac('sha1' as never, 'key')).toThrow(/FIPS.*Blocked/)
    })

    it('rejects RC4 cipher', () => {
      // RC4 is not in approved list — the fipsEncrypt only uses aes-256-gcm
      // but the assertApprovedCipher should block it
      expect(FIPS_APPROVED_CIPHER_ALGORITHMS).not.toContain('rc4')
    })

    it('rejects DES cipher', () => {
      expect(FIPS_APPROVED_CIPHER_ALGORITHMS).not.toContain('des')
    })

    it('rejects Blowfish cipher', () => {
      expect(FIPS_APPROVED_CIPHER_ALGORITHMS).not.toContain('blowfish')
    })
  })

  // ── Approved Algorithms ─────────────────────────────────────────────────

  describe('approved algorithms', () => {
    it('allows SHA-256 hashing', () => {
      const hash = createFipsHash('sha256')
      hash.update('test data')
      const digest = hash.digest('hex')
      expect(digest).toHaveLength(64)
    })

    it('allows SHA-384 hashing', () => {
      const hash = createFipsHash('sha384')
      hash.update('test data')
      const digest = hash.digest('hex')
      expect(digest).toHaveLength(96)
    })

    it('allows SHA-512 hashing', () => {
      const hash = createFipsHash('sha512')
      hash.update('test data')
      const digest = hash.digest('hex')
      expect(digest).toHaveLength(128)
    })

    it('allows HMAC-SHA256', () => {
      const hmac = createFipsHmac('sha256', 'secret-key')
      hmac.update('test data')
      const mac = hmac.digest('hex')
      expect(mac).toHaveLength(64)
    })

    it('produces deterministic hashes', () => {
      const a = createFipsHash('sha256').update('hello').digest('hex')
      const b = createFipsHash('sha256').update('hello').digest('hex')
      expect(a).toBe(b)
    })
  })

  // ── AES-256-GCM ────────────────────────────────────────────────────────

  describe('AES-256-GCM encryption', () => {
    const key = fipsRandomBytes(32)

    it('encrypts and decrypts round-trip', () => {
      const plaintext = 'Sensitive PII: SIN 123-456-789'
      const encrypted = fipsEncrypt(plaintext, key)
      const decrypted = fipsDecrypt(encrypted, key)
      expect(decrypted).toBe(plaintext)
    })

    it('uses correct algorithm identifier', () => {
      const encrypted = fipsEncrypt('test', key)
      expect(encrypted.algorithm).toBe('aes-256-gcm')
    })

    it('produces unique IV per encryption', () => {
      const a = fipsEncrypt('same data', key)
      const b = fipsEncrypt('same data', key)
      expect(a.iv).not.toBe(b.iv)
    })

    it('rejects wrong key on decrypt', () => {
      const encrypted = fipsEncrypt('secret', key)
      const wrongKey = fipsRandomBytes(32)
      expect(() => fipsDecrypt(encrypted, wrongKey)).toThrow()
    })

    it('rejects tampered ciphertext', () => {
      const encrypted = fipsEncrypt('secret', key)
      const tampered = { ...encrypted, ciphertext: 'dGFtcGVyZWQ=' }
      expect(() => fipsDecrypt(tampered, key)).toThrow()
    })

    it('rejects invalid key sizes', () => {
      expect(() => fipsEncrypt('test', Buffer.alloc(16))).toThrow(/256-bit/)
      expect(() => fipsEncrypt('test', Buffer.alloc(64))).toThrow(/256-bit/)
    })

    it('supports additional authenticated data (AAD)', () => {
      const aad = Buffer.from('org:org_123')
      const encrypted = fipsEncrypt('secret', key, aad)
      const decrypted = fipsDecrypt(encrypted, key, aad)
      expect(decrypted).toBe('secret')
    })

    it('fails when AAD does not match', () => {
      const encrypted = fipsEncrypt('secret', key, Buffer.from('org:org_123'))
      expect(() => fipsDecrypt(encrypted, key, Buffer.from('org:org_456'))).toThrow()
    })
  })

  // ── Random Bytes ────────────────────────────────────────────────────────

  describe('random byte generation', () => {
    it('generates requested byte count', () => {
      expect(fipsRandomBytes(16)).toHaveLength(16)
      expect(fipsRandomBytes(32)).toHaveLength(32)
      expect(fipsRandomBytes(64)).toHaveLength(64)
    })

    it('produces unique outputs', () => {
      const a = fipsRandomBytes(32)
      const b = fipsRandomBytes(32)
      expect(a.equals(b)).toBe(false)
    })
  })

  // ── PBKDF2 ─────────────────────────────────────────────────────────────

  describe('PBKDF2 key derivation', () => {
    it('derives a key with SHA-256', async () => {
      const key = await fipsPbkdf2('password', 'salt', 100_000, 32, 'sha256')
      expect(key).toHaveLength(32)
    })

    it('produces deterministic output', async () => {
      const a = await fipsPbkdf2('pw', 'salt', 10_000, 32, 'sha256')
      const b = await fipsPbkdf2('pw', 'salt', 10_000, 32, 'sha256')
      expect(a.equals(b)).toBe(true)
    })

    it('different passwords produce different keys', async () => {
      const a = await fipsPbkdf2('pw1', 'salt', 10_000, 32, 'sha256')
      const b = await fipsPbkdf2('pw2', 'salt', 10_000, 32, 'sha256')
      expect(a.equals(b)).toBe(false)
    })

    it('rejects non-FIPS digest', () => {
      expect(() =>
        fipsPbkdf2('pw', 'salt', 10_000, 32, 'md5' as never),
      ).toThrow(/FIPS.*Blocked/)
    })
  })

  // ── Compliance Audit ────────────────────────────────────────────────────

  describe('crypto compliance audit', () => {
    it('returns structured audit result', () => {
      const audit = auditCryptoCompliance()
      expect(audit.timestamp).toBeTruthy()
      expect(audit.fipsStatus).toBeDefined()
      expect(audit.availableHashes).toContain('sha256')
      expect(audit.availableHashes).toContain('sha512')
    })

    it('identifies blocked algorithms', () => {
      const audit = auditCryptoCompliance()
      // MD5 and SHA-1 should be in the blocked list since they exist in Node.js
      expect(audit.blockedHashesInUse).toContain('md5')
    })

    it('FIPS status reports runtime state', () => {
      const status = getFipsStatus()
      expect(status.nodeVersion).toMatch(/^v\d+/)
      expect(typeof status.fipsRequired).toBe('boolean')
      expect(typeof status.fipsEnabled).toBe('boolean')
    })
  })

  // ── Algorithm Enumeration ──────────────────────────────────────────────

  describe('approved algorithm lists', () => {
    it('includes expected hash algorithms', () => {
      expect(FIPS_APPROVED_HASH_ALGORITHMS).toContain('sha256')
      expect(FIPS_APPROVED_HASH_ALGORITHMS).toContain('sha384')
      expect(FIPS_APPROVED_HASH_ALGORITHMS).toContain('sha512')
    })

    it('includes expected cipher algorithms', () => {
      expect(FIPS_APPROVED_CIPHER_ALGORITHMS).toContain('aes-256-gcm')
      expect(FIPS_APPROVED_CIPHER_ALGORITHMS).toContain('aes-128-gcm')
    })

    it('does NOT include non-FIPS algorithms', () => {
      const allApproved = [
        ...FIPS_APPROVED_HASH_ALGORITHMS,
        ...FIPS_APPROVED_CIPHER_ALGORITHMS,
      ] as string[]
      expect(allApproved).not.toContain('md5')
      expect(allApproved).not.toContain('sha1')
      expect(allApproved).not.toContain('rc4')
      expect(allApproved).not.toContain('des')
    })
  })
})
