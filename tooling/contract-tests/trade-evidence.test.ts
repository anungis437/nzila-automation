/**
 * Contract Test — Trade Evidence Required for Terminal States
 *
 * TRADE_EVIDENCE_REQUIRED_FOR_TERMINAL_STATES_004:
 *   1. Evidence pack builders exist for quote acceptance, shipment docs, commission settlement
 *   2. Deal machine marks terminal-bound transitions as evidenceRequired
 *   3. Evidence module imports from @nzila/evidence
 *   4. Evidence packs include Merkle root computation
 *
 * @invariant TRADE_EVIDENCE_REQUIRED_FOR_TERMINAL_STATES_004
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '../..')

describe('TRADE-EV-01 — Evidence pack builders exist', () => {
  it('trade-evidence-packs.ts exists', () => {
    const path = join(
      ROOT,
      'apps',
      'trade',
      'lib',
      'evidence',
      'trade-evidence-packs.ts',
    )
    expect(existsSync(path)).toBe(true)
  })

  it('exports all three pack builders', () => {
    const path = join(
      ROOT,
      'apps',
      'trade',
      'lib',
      'evidence',
      'trade-evidence-packs.ts',
    )
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('buildQuoteAcceptancePack')
    expect(content).toContain('buildShipmentDocsPack')
    expect(content).toContain('buildCommissionSettlementPack')
  })
})

describe('TRADE-EV-02 — Evidence packs use @nzila/evidence', () => {
  it('imports computeMerkleRoot from @nzila/evidence', () => {
    const path = join(
      ROOT,
      'apps',
      'trade',
      'lib',
      'evidence',
      'trade-evidence-packs.ts',
    )
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain("from '@nzila/evidence'")
    expect(content).toContain('computeMerkleRoot')
  })

  it('imports generateSeal from @nzila/evidence', () => {
    const path = join(
      ROOT,
      'apps',
      'trade',
      'lib',
      'evidence',
      'trade-evidence-packs.ts',
    )
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('generateSeal')
  })
})

describe('TRADE-EV-03 — Deal machine marks evidence-required transitions', () => {
  it('deal.ts references evidenceRequired', () => {
    const path = join(ROOT, 'packages', 'trade-core', 'src', 'machines', 'deal.ts')
    expect(existsSync(path)).toBe(true)
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('evidenceRequired')
  })
})

describe('TRADE-EV-04 — Org export builder exists', () => {
  it('buildOrgTradeExport is exported', () => {
    const indexPath = join(
      ROOT,
      'apps',
      'trade',
      'lib',
      'evidence',
      'index.ts',
    )
    expect(existsSync(indexPath)).toBe(true)
    const content = readFileSync(indexPath, 'utf-8')
    expect(content).toContain('buildOrgTradeExport')
  })
})
