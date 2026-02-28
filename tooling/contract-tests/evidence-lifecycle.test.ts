/**
 * Contract Test — Evidence Pack Lifecycle Enforcement
 *
 * Proves that:
 *   1. Drafts are in-memory-only and cannot be persisted
 *   2. Seal-once: re-sealing a sealed pack throws
 *   3. Status transitions follow the valid state machine
 *   4. Sealed packs are immutable (no addArtifact after seal)
 *   5. Empty drafts cannot be sealed
 *   6. processEvidencePack returns seal in EvidencePackResult
 *   7. buildLocalEvidencePackIndex includes a valid seal
 *   8. Redaction produces a re-sealed copy
 *   9. verify-pack CLI correctly validates/invalidates packs
 *  10. assertSealed / isSealedEvidencePack gate persistence
 *
 * @invariant INV-14: Draft packs never leave process memory
 * @invariant INV-15: Seal-once — re-sealing a sealed pack throws
 * @invariant INV-16: Redacted packs are re-sealed
 * @invariant INV-17: verify-pack CLI available and functional
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import {
  createEvidencePackDraft,
  assertValidTransition,
  assertSealed,
  isSealedEvidencePack,
  LifecycleTransitionError,
  SealOnceViolationError,
  DraftMutationError,
  type EvidencePackDraft,
  type SealedEvidencePack,
  type EvidencePackStatus,
} from '../../packages/os-core/src/evidence/lifecycle'
import {
  generateSeal,
  verifySeal,
  type SealablePackIndex,
} from '../../packages/os-core/src/evidence/seal'
import { buildLocalEvidencePackIndex } from '../../packages/os-core/src/evidence/generate-evidence-index'
import { redactAndReseal } from '../../packages/os-core/src/evidence/redaction'
import { verifyPackIndex } from '../../packages/os-core/src/evidence/verify-pack'

const ROOT = join(__dirname, '..', '..')
const FIXED_TIMESTAMP = '2026-02-01T00:00:00.000Z'

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeArtifact(id = 'art-1') {
  return {
    artifactId: id,
    artifactType: 'test-artifact',
    filename: `${id}.json`,
    buffer: Buffer.from(JSON.stringify({ test: true, id })),
    contentType: 'application/json',
    retentionClass: '7_YEARS' as const,
    classification: 'INTERNAL' as const,
  }
}

function makeDraft() {
  return createEvidencePackDraft({
    packId: 'TEST-001',
    orgId: '00000000-0000-0000-0000-000000000001',
    controlFamily: 'integrity',
    eventType: 'control-test',
    eventId: 'test-event-001',
    createdBy: 'test-user',
    summary: 'Test evidence pack',
  })
}

// ── INV-14: Draft packs never leave process memory ──────────────────────────

describe('INV-14 — Draft packs are in-memory only', () => {
  it('draft has status "draft"', () => {
    const draft = makeDraft()
    expect(draft.status).toBe('draft')
  })

  it('draft allows adding artifacts', () => {
    const draft = makeDraft()
    draft.addArtifact(makeArtifact('art-1'))
    draft.addArtifact(makeArtifact('art-2'))
    expect(draft.artifacts).toHaveLength(2)
  })

  it('isSealedEvidencePack returns false for drafts', () => {
    const draft = makeDraft()
    expect(isSealedEvidencePack(draft)).toBe(false)
  })

  it('assertSealed throws for drafts', () => {
    const draft = makeDraft()
    expect(() => assertSealed(draft)).toThrow(DraftMutationError)
  })

  it('cannot seal an empty draft', () => {
    const draft = makeDraft()
    expect(() => draft.seal()).toThrow(DraftMutationError)
    expect(() => draft.seal()).toThrow('no artifacts added')
  })

  it('generate-evidence-index.ts persists with status "sealed" (not "draft")', () => {
    const genPath = join(ROOT, 'packages', 'os-core', 'src', 'evidence', 'generate-evidence-index.ts')
    const content = readFileSync(genPath, 'utf-8')
    // The DB insert sets status to sealed
    expect(content).toContain("status: 'sealed'")
    // Seal is computed before persistence
    expect(content).toContain('generateSeal')
  })
})

// ── INV-15: Seal-once — re-sealing throws ───────────────────────────────────

describe('INV-15 — Seal-once enforcement', () => {
  it('seal() returns a SealedEvidencePack', () => {
    const draft = makeDraft()
    draft.addArtifact(makeArtifact())
    const sealed = draft.seal({ sealedAt: FIXED_TIMESTAMP })

    expect(sealed.status).toBe('sealed')
    expect(sealed.seal).toBeDefined()
    expect(sealed.seal.sealVersion).toBe('1.0')
    expect(sealed.seal.packDigest).toMatch(/^[a-f0-9]{64}$/)
    expect(sealed.seal.artifactsMerkleRoot).toMatch(/^[a-f0-9]{64}$/)
    expect(sealed.sealedAt).toBe(FIXED_TIMESTAMP)
  })

  it('calling seal() a second time throws SealOnceViolationError', () => {
    const draft = makeDraft()
    draft.addArtifact(makeArtifact())
    draft.seal({ sealedAt: FIXED_TIMESTAMP })

    expect(() => draft.seal()).toThrow(SealOnceViolationError)
    expect(() => draft.seal()).toThrow('already sealed')
  })

  it('addArtifact throws after seal', () => {
    const draft = makeDraft()
    draft.addArtifact(makeArtifact('art-1'))
    draft.seal({ sealedAt: FIXED_TIMESTAMP })

    expect(() => draft.addArtifact(makeArtifact('art-2'))).toThrow(DraftMutationError)
    expect(() => draft.addArtifact(makeArtifact('art-3'))).toThrow('sealed')
  })

  it('sealed pack is frozen (Object.isFrozen)', () => {
    const draft = makeDraft()
    draft.addArtifact(makeArtifact())
    const sealed = draft.seal()
    expect(Object.isFrozen(sealed)).toBe(true)
    expect(Object.isFrozen(sealed.artifacts)).toBe(true)
  })

  it('isSealedEvidencePack returns true for sealed packs', () => {
    const draft = makeDraft()
    draft.addArtifact(makeArtifact())
    const sealed = draft.seal()
    expect(isSealedEvidencePack(sealed)).toBe(true)
  })

  it('assertSealed passes for sealed packs', () => {
    const draft = makeDraft()
    draft.addArtifact(makeArtifact())
    const sealed = draft.seal()
    expect(() => assertSealed(sealed)).not.toThrow()
  })
})

// ── Status transition state machine ─────────────────────────────────────────

describe('Evidence pack status transitions', () => {
  const validTransitions: [EvidencePackStatus, EvidencePackStatus][] = [
    ['draft', 'sealed'],
    ['sealed', 'verified'],
    ['sealed', 'expired'],
    ['verified', 'expired'],
  ]

  const invalidTransitions: [EvidencePackStatus, EvidencePackStatus][] = [
    ['draft', 'verified'],
    ['draft', 'expired'],
    ['draft', 'draft'],
    ['sealed', 'draft'],
    ['sealed', 'sealed'],
    ['verified', 'draft'],
    ['verified', 'sealed'],
    ['verified', 'verified'],
    ['expired', 'draft'],
    ['expired', 'sealed'],
    ['expired', 'verified'],
    ['expired', 'expired'],
  ]

  for (const [from, to] of validTransitions) {
    it(`allows ${from} → ${to}`, () => {
      expect(() => assertValidTransition(from, to)).not.toThrow()
    })
  }

  for (const [from, to] of invalidTransitions) {
    it(`rejects ${from} → ${to}`, () => {
      expect(() => assertValidTransition(from, to)).toThrow(LifecycleTransitionError)
    })
  }
})

// ── INV-16: Redacted packs are re-sealed ────────────────────────────────────

describe('INV-16 — Redacted packs are re-sealed', () => {
  function makeSealedIndex(): SealablePackIndex & { seal: ReturnType<typeof generateSeal> } {
    const index: SealablePackIndex = {
      packId: 'TEST-001',
      orgId: '00000000-0000-0000-0000-000000000001',
      controlFamily: 'integrity',
      eventType: 'control-test',
      summary: 'Test',
      artifacts: [
        { sha256: 'a'.repeat(64), artifactId: 'art-1', artifactType: 'test', filename: 'art-1.json' },
        { sha256: 'b'.repeat(64), artifactId: 'art-2', artifactType: 'test', filename: 'art-2.json' },
      ],
    }
    const seal = generateSeal(index, { sealedAt: FIXED_TIMESTAMP })
    return { ...index, seal }
  }

  it('redactAndReseal returns a fresh seal for partner audience', () => {
    const sealed = makeSealedIndex()
    const { index, seal } = redactAndReseal(sealed, 'partner', { sealedAt: FIXED_TIMESTAMP })

    expect(seal).toBeDefined()
    expect(seal.sealVersion).toBe('1.0')
    expect(seal.packDigest).toMatch(/^[a-f0-9]{64}$/)
    expect(index.redactedFor).toBe('partner')
    expect(index.originalPackDigest).toBe(sealed.seal.packDigest)
  })

  it('redactAndReseal returns a fresh seal for public audience', () => {
    const sealed = makeSealedIndex()
    const { index, seal } = redactAndReseal(sealed, 'public', { sealedAt: FIXED_TIMESTAMP })

    expect(seal).toBeDefined()
    expect(index.redactedFor).toBe('public')
    expect(index.originalPackDigest).toBe(sealed.seal.packDigest)
  })

  it('redacted seal verifies correctly', () => {
    const sealed = makeSealedIndex()
    const { index, seal } = redactAndReseal(sealed, 'partner', { sealedAt: FIXED_TIMESTAMP })

    const result = verifySeal({ ...index, seal })
    expect(result.valid).toBe(true)
    expect(result.digestMatch).toBe(true)
    expect(result.merkleMatch).toBe(true)
  })

  it('redacted seal is different from original seal', () => {
    const sealed = makeSealedIndex()
    const { seal } = redactAndReseal(sealed, 'partner', { sealedAt: FIXED_TIMESTAMP })
    // Redacted content differs → different digest
    expect(seal.packDigest).not.toBe(sealed.seal.packDigest)
  })

  it('internal redaction preserves content and re-seals', () => {
    const sealed = makeSealedIndex()
    const { index, seal } = redactAndReseal(sealed, 'internal', { sealedAt: FIXED_TIMESTAMP })

    expect(index.redactedFor).toBe('internal')
    expect(index.artifacts.length).toBe(sealed.artifacts.length)

    const result = verifySeal({ ...index, seal })
    expect(result.valid).toBe(true)
  })
})

// ── buildLocalEvidencePackIndex seal presence ───────────────────────────────

describe('buildLocalEvidencePackIndex includes valid seal', () => {
  it('returns an index with a seal field', () => {
    const request = {
      packId: 'TEST-LOCAL-001',
      orgId: '00000000-0000-0000-0000-000000000001',
      controlFamily: 'integrity' as const,
      eventType: 'control-test' as const,
      eventId: 'ev-001',
      blobContainer: 'evidence' as const,
      summary: 'Test local index',
      controlsCovered: ['INT-01'],
      createdBy: 'test-user',
      artifacts: [
        {
          artifactId: 'art-1',
          artifactType: 'test',
          filename: 'test.json',
          buffer: Buffer.from('{"test":true}'),
          contentType: 'application/json',
          retentionClass: '7_YEARS' as const,
          classification: 'INTERNAL' as const,
        },
      ],
    }

    const localIndex = buildLocalEvidencePackIndex(request)
    expect(localIndex.seal).toBeDefined()
    expect(localIndex.seal.sealVersion).toBe('1.0')
    expect(localIndex.seal.packDigest).toMatch(/^[a-f0-9]{64}$/)
    expect(localIndex.seal.artifactsMerkleRoot).toMatch(/^[a-f0-9]{64}$/)
    expect(localIndex.seal.artifactCount).toBe(1)
  })

  it('local index seal verifies correctly', () => {
    const request = {
      packId: 'TEST-LOCAL-002',
      orgId: '00000000-0000-0000-0000-000000000001',
      controlFamily: 'integrity' as const,
      eventType: 'control-test' as const,
      eventId: 'ev-002',
      blobContainer: 'evidence' as const,
      summary: 'Test verify',
      controlsCovered: [],
      createdBy: 'test-user',
      artifacts: [
        {
          artifactId: 'art-1',
          artifactType: 'test',
          filename: 'data.json',
          buffer: Buffer.from('data'),
          contentType: 'application/json',
          retentionClass: '3_YEARS' as const,
          classification: 'INTERNAL' as const,
        },
      ],
    }

    const localIndex = buildLocalEvidencePackIndex(request)
    const result = verifySeal(localIndex)
    expect(result.valid).toBe(true)
    expect(result.digestMatch).toBe(true)
    expect(result.merkleMatch).toBe(true)
  })
})

// ── processEvidencePack return type includes seal ───────────────────────────

describe('processEvidencePack includes seal in result type', () => {
  it('generate-evidence-index.ts returns seal in result object', () => {
    const genPath = join(ROOT, 'packages', 'os-core', 'src', 'evidence', 'generate-evidence-index.ts')
    const content = readFileSync(genPath, 'utf-8')
    // The return statement must include seal
    expect(content).toMatch(/return\s*\{[\s\S]*seal[\s\S]*\}/)
  })

  it('EvidencePackResult type has seal field', () => {
    const typesPath = join(ROOT, 'packages', 'os-core', 'src', 'evidence', 'types.ts')
    const content = readFileSync(typesPath, 'utf-8')
    // The interface must contain a seal field
    expect(content).toMatch(/seal.*SealEnvelope/)
  })
})

// ── INV-17: verify-pack CLI ─────────────────────────────────────────────────

describe('INV-17 — verify-pack CLI is available and functional', () => {
  const tmpDir = join(ROOT, '.tmp-verify-test')

  it('verify-pack.ts exists', () => {
    const cliPath = join(ROOT, 'packages', 'os-core', 'src', 'evidence', 'verify-pack.ts')
    expect(existsSync(cliPath)).toBe(true)
  })

  it('verifyPackIndex rejects a non-existent file', () => {
    const result = verifyPackIndex('/nonexistent/path/pack.json')
    expect(result.overallValid).toBe(false)
    expect(result.errors).toContain('File not found: /nonexistent/path/pack.json')
  })

  it('verifyPackIndex validates a correct pack index', () => {
    // Create a temporary pack index file
    mkdirSync(tmpDir, { recursive: true })
    try {
      const index: SealablePackIndex = {
        packId: 'VERIFY-TEST-001',
        orgId: '00000000-0000-0000-0000-000000000001',
        artifacts: [
          { sha256: 'a'.repeat(64), filename: 'art-1.json' },
        ],
      }
      const seal = generateSeal(index, { sealedAt: FIXED_TIMESTAMP })
      const sealedIndex = { ...index, seal }

      const indexPath = join(tmpDir, 'evidence-pack-index.json')
      writeFileSync(indexPath, JSON.stringify(sealedIndex, null, 2))

      const result = verifyPackIndex(indexPath)
      expect(result.overallValid).toBe(true)
      expect(result.sealValid).toBe(true)
      expect(result.digestMatch).toBe(true)
      expect(result.merkleMatch).toBe(true)
      expect(result.packId).toBe('VERIFY-TEST-001')
    } finally {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('verifyPackIndex detects tampered pack indexes', () => {
    mkdirSync(tmpDir, { recursive: true })
    try {
      const index: SealablePackIndex = {
        packId: 'VERIFY-TEST-002',
        orgId: '00000000-0000-0000-0000-000000000001',
        artifacts: [
          { sha256: 'a'.repeat(64), filename: 'art-1.json' },
        ],
      }
      const seal = generateSeal(index, { sealedAt: FIXED_TIMESTAMP })
      // Tamper with orgId after sealing
      const tamperedIndex = { ...index, orgId: 'TAMPERED', seal }

      const indexPath = join(tmpDir, 'evidence-pack-index.json')
      writeFileSync(indexPath, JSON.stringify(tamperedIndex, null, 2))

      const result = verifyPackIndex(indexPath)
      expect(result.overallValid).toBe(false)
      expect(result.digestMatch).toBe(false)
    } finally {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('verifyPackIndex validates artifact hashes when files present', () => {
    mkdirSync(tmpDir, { recursive: true })
    try {
      const artifactContent = Buffer.from('test-artifact-content')
      const sha256 = createHash('sha256').update(artifactContent).digest('hex')

      const index: SealablePackIndex = {
        packId: 'VERIFY-TEST-003',
        artifacts: [
          { sha256, filename: 'art-1.json' },
        ],
      }
      const seal = generateSeal(index, { sealedAt: FIXED_TIMESTAMP })
      const sealedIndex = { ...index, seal }

      // Write index and artifact
      writeFileSync(join(tmpDir, 'evidence-pack-index.json'), JSON.stringify(sealedIndex, null, 2))
      writeFileSync(join(tmpDir, 'art-1.json'), artifactContent)

      const result = verifyPackIndex(join(tmpDir, 'evidence-pack-index.json'), { artifactsDir: tmpDir })
      expect(result.overallValid).toBe(true)
      expect(result.artifactsChecked).toBe(1)
      expect(result.artifactHashErrors).toHaveLength(0)
    } finally {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('verifyPackIndex detects corrupted artifact files', () => {
    mkdirSync(tmpDir, { recursive: true })
    try {
      const index: SealablePackIndex = {
        packId: 'VERIFY-TEST-004',
        artifacts: [
          { sha256: 'a'.repeat(64), filename: 'art-1.json' },
        ],
      }
      const seal = generateSeal(index, { sealedAt: FIXED_TIMESTAMP })
      const sealedIndex = { ...index, seal }

      // Write index and a CORRUPTED artifact
      writeFileSync(join(tmpDir, 'evidence-pack-index.json'), JSON.stringify(sealedIndex, null, 2))
      writeFileSync(join(tmpDir, 'art-1.json'), 'corrupted content')

      const result = verifyPackIndex(join(tmpDir, 'evidence-pack-index.json'), { artifactsDir: tmpDir })
      expect(result.overallValid).toBe(false)
      expect(result.artifactHashErrors).toHaveLength(1)
    } finally {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })
})

// ── Lifecycle module existence ──────────────────────────────────────────────

describe('Lifecycle module is exported', () => {
  it('lifecycle.ts exists', () => {
    const path = join(ROOT, 'packages', 'os-core', 'src', 'evidence', 'lifecycle.ts')
    expect(existsSync(path)).toBe(true)
  })

  it('lifecycle.ts exports all required symbols', () => {
    const path = join(ROOT, 'packages', 'os-core', 'src', 'evidence', 'lifecycle.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('export function createEvidencePackDraft')
    expect(content).toContain('export function assertValidTransition')
    expect(content).toContain('export function assertSealed')
    expect(content).toContain('export function isSealedEvidencePack')
    expect(content).toContain('export class LifecycleTransitionError')
    expect(content).toContain('export class SealOnceViolationError')
    expect(content).toContain('export class DraftMutationError')
    expect(content).toContain('export type EvidencePackStatus')
    expect(content).toContain('export interface SealedEvidencePack')
    expect(content).toContain('export interface EvidencePackDraft')
  })

  it('index.ts re-exports lifecycle symbols', () => {
    const indexPath = join(ROOT, 'packages', 'os-core', 'src', 'evidence', 'index.ts')
    const content = readFileSync(indexPath, 'utf-8')
    expect(content).toContain('createEvidencePackDraft')
    expect(content).toContain('assertValidTransition')
    expect(content).toContain('assertSealed')
    expect(content).toContain('isSealedEvidencePack')
    expect(content).toContain('lifecycle')
  })

  it('index.ts re-exports redactAndReseal', () => {
    const indexPath = join(ROOT, 'packages', 'os-core', 'src', 'evidence', 'index.ts')
    const content = readFileSync(indexPath, 'utf-8')
    expect(content).toContain('redactAndReseal')
  })

  it('index.ts re-exports verifyPackIndex', () => {
    const indexPath = join(ROOT, 'packages', 'os-core', 'src', 'evidence', 'index.ts')
    const content = readFileSync(indexPath, 'utf-8')
    expect(content).toContain('verifyPackIndex')
  })
})
