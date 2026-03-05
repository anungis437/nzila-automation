#!/usr/bin/env tsx
/**
 * Nzila OS — Build Attestation Generator
 *
 * Generates a build-attestation.json that captures deterministic build
 * provenance suitable for procurement packs and audit trails.
 *
 * Output:
 *   ops/security/build-attestation.json
 *
 * Contents:
 *   - commit hash
 *   - build timestamp (ISO UTC, no ms)
 *   - Node.js version
 *   - pnpm version
 *   - SBOM hash
 *   - build artifact hash
 *   - Ed25519 signature (using existing signing system)
 *
 * Usage:
 *   npx tsx scripts/attest-build.ts
 *
 * @module scripts/attest-build
 */
import { execSync } from 'node:child_process'
import { createHash, sign, generateKeyPairSync } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { nowISO } from '@nzila/platform-utils/time'

// ── Types ───────────────────────────────────────────────────────────────────

interface BuildAttestation {
  readonly version: '1.0'
  readonly commitHash: string
  readonly buildTimestamp: string
  readonly nodeVersion: string
  readonly pnpmVersion: string
  readonly sbomHash: string | null
  readonly lockfileHash: string
  readonly buildArtifactHash: string | null
  readonly attestationDigest: string
  readonly signature: string | null
}

// ── Constants ───────────────────────────────────────────────────────────────

const ROOT = resolve(import.meta.dirname ?? __dirname, '..')
const OUTPUT_DIR = resolve(ROOT, 'ops', 'security')
const OUTPUT_PATH = join(OUTPUT_DIR, 'build-attestation.json')
const SBOM_PATH = join(OUTPUT_DIR, 'sbom.json')
const LOCKFILE_PATH = resolve(ROOT, 'pnpm-lock.yaml')

// ── Helpers ─────────────────────────────────────────────────────────────────

function sha256(data: string): string {
  return createHash('sha256').update(data, 'utf-8').digest('hex')
}

function cmd(command: string): string {
  try {
    return execSync(command, { encoding: 'utf-8', cwd: ROOT }).trim()
  } catch {
    return ''
  }
}

function getCommitHash(): string {
  return cmd('git rev-parse HEAD') || 'unknown'
}

function getPnpmVersion(): string {
  return cmd('pnpm --version') || 'unknown'
}

function getSbomHash(): string | null {
  if (!existsSync(SBOM_PATH)) return null
  return sha256(readFileSync(SBOM_PATH, 'utf-8'))
}

function getLockfileHash(): string {
  if (!existsSync(LOCKFILE_PATH)) return 'missing'
  return sha256(readFileSync(LOCKFILE_PATH, 'utf-8'))
}

function getBuildArtifactHash(): string | null {
  // Hash the lockfile + sbom combination as a reproducible build fingerprint
  const parts: string[] = []
  if (existsSync(LOCKFILE_PATH)) {
    parts.push(readFileSync(LOCKFILE_PATH, 'utf-8'))
  }
  if (existsSync(SBOM_PATH)) {
    parts.push(readFileSync(SBOM_PATH, 'utf-8'))
  }
  if (parts.length === 0) return null
  return sha256(parts.join('\n'))
}

function computeDigest(base: Omit<BuildAttestation, 'attestationDigest' | 'signature'>): string {
  const canonical = JSON.stringify(base, Object.keys(base).sort(), 0)
  return sha256(canonical)
}

function signDigest(digest: string): string | null {
  const key = process.env.ATTESTATION_SIGNING_KEY
  if (!key) {
    // Generate an ephemeral key pair for local/CI signing
    const { privateKey, publicKey } = generateKeyPairSync('ed25519')
    const sig = sign(null, Buffer.from(digest, 'hex'), privateKey)
    // Store public key alongside attestation for verification
    const pubPem = publicKey.export({ type: 'spki', format: 'pem' }) as string
    writeFileSync(join(OUTPUT_DIR, 'build-attestation-pubkey.pem'), pubPem, 'utf-8')
    return sig.toString('hex')
  }

  try {
    const sig = sign(null, Buffer.from(digest, 'hex'), key)
    return sig.toString('hex')
  } catch {
    return null
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

function main(): void {
  process.stdout.write('\n\u2501\u2501\u2501 Nzila OS \u2014 Build Attestation \u2501\u2501\u2501\n\n')

  mkdirSync(OUTPUT_DIR, { recursive: true })

  const base: Omit<BuildAttestation, 'attestationDigest' | 'signature'> = {
    version: '1.0',
    commitHash: getCommitHash(),
    buildTimestamp: nowISO(),
    nodeVersion: process.versions.node,
    pnpmVersion: getPnpmVersion(),
    sbomHash: getSbomHash(),
    lockfileHash: getLockfileHash(),
    buildArtifactHash: getBuildArtifactHash(),
  }

  const attestationDigest = computeDigest(base)
  const signature = signDigest(attestationDigest)

  const attestation: BuildAttestation = {
    ...base,
    attestationDigest,
    signature,
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(attestation, null, 2), 'utf-8')

  process.stdout.write(`  \u2714 Commit: ${attestation.commitHash.slice(0, 12)}\n`)
  process.stdout.write(`  \u2714 Node: v${attestation.nodeVersion}\n`)
  process.stdout.write(`  \u2714 pnpm: ${attestation.pnpmVersion}\n`)
  process.stdout.write(`  \u2714 SBOM hash: ${attestation.sbomHash?.slice(0, 16) ?? '(not generated yet)'}\u2026\n`)
  process.stdout.write(`  \u2714 Lockfile hash: ${attestation.lockfileHash.slice(0, 16)}\u2026\n`)
  process.stdout.write(`  \u2714 Signed: ${attestation.signature ? 'yes' : 'no'}\n`)
  process.stdout.write(`  \u2714 Attestation: ${OUTPUT_PATH}\n\n`)
}

main()
