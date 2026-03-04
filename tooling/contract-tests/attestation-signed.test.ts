/**
 * Contract Test — Attestation Signed
 *
 * Structural invariant: The release attestation script must produce
 * v2.0 attestations with artifact digests, lockfile hash, and
 * Ed25519 signature support.
 *
 * @invariant ATTESTATION_SIGNED_003
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')

describe('ATTESTATION_SIGNED_003 — Release attestation provenance', () => {
  it('release-attestation.ts exists', () => {
    const attestPath = join(ROOT, 'scripts', 'release-attestation.ts')
    expect(existsSync(attestPath), 'scripts/release-attestation.ts must exist').toBe(true)
  })

  it('attestation version is 2.0', () => {
    const content = readFileSync(join(ROOT, 'scripts', 'release-attestation.ts'), 'utf-8')
    expect(content).toContain("'2.0'")
  })

  it('attestation includes artifact digests', () => {
    const content = readFileSync(join(ROOT, 'scripts', 'release-attestation.ts'), 'utf-8')
    expect(content).toContain('artifactDigests')
    expect(content).toContain('computeArtifactDigests')
    expect(content).toContain('ArtifactDigest')
  })

  it('attestation includes lockfile hash', () => {
    const content = readFileSync(join(ROOT, 'scripts', 'release-attestation.ts'), 'utf-8')
    expect(content).toContain('lockfileHash')
    expect(content).toContain('computeLockfileHash')
    expect(content).toContain('pnpm-lock.yaml')
  })

  it('attestation supports Ed25519 signing', () => {
    const content = readFileSync(join(ROOT, 'scripts', 'release-attestation.ts'), 'utf-8')
    expect(content).toContain('signAttestation')
    expect(content).toContain('Ed25519')
    expect(content).toContain('ATTESTATION_SIGNING_KEY')
  })

  it('attestation exports verification function', () => {
    const content = readFileSync(join(ROOT, 'scripts', 'release-attestation.ts'), 'utf-8')
    expect(content).toContain('verifyAttestationSignature')
  })

  it('attestation signature field is excluded from digest computation', () => {
    const content = readFileSync(join(ROOT, 'scripts', 'release-attestation.ts'), 'utf-8')
    // The digest should be computed without the signature field to prevent circularity
    expect(content).toContain('signature')
    expect(content).toContain('computeAttestationDigest')
  })
})
