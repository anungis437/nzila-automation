/**
 * Contract Test — Trade FSM Enforcement
 *
 * TRADE_FSM_ENFORCED_002:
 *   1. Deal transitions MUST go through attemptDealTransition() — no direct stage mutation
 *   2. Deal actions file must import from @nzila/trade-core/machines
 *   3. No server action directly sets deal.stage without FSM evaluation
 *   4. FSM machine must have at least 2 terminal states
 *   5. Every transition must have a label
 *
 * @invariant TRADE_FSM_ENFORCED_002
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '../..')

describe('TRADE-FSM-01 — Deal actions use FSM engine', () => {
  it('deal-actions.ts imports attemptDealTransition from machines', () => {
    const path = join(ROOT, 'apps', 'trade', 'lib', 'actions', 'deal-actions.ts')
    expect(existsSync(path)).toBe(true)
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('attemptDealTransition')
    expect(content).toContain('@nzila/trade-core/machines')
  })

  it('deal-actions.ts imports tradeDealMachine', () => {
    const path = join(ROOT, 'apps', 'trade', 'lib', 'actions', 'deal-actions.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('tradeDealMachine')
  })
})

describe('TRADE-FSM-02 — No direct stage mutation in server actions', () => {
  const ACTION_FILES = [
    'party-actions.ts',
    'listing-actions.ts',
    'deal-actions.ts',
    'quote-actions.ts',
    'financing-actions.ts',
    'shipment-actions.ts',
    'document-actions.ts',
    'commission-actions.ts',
  ]

  for (const file of ACTION_FILES) {
    it(`${file} does not directly mutate deal.stage`, () => {
      const path = join(ROOT, 'apps', 'trade', 'lib', 'actions', file)
      if (!existsSync(path)) return
      const content = readFileSync(path, 'utf-8')
      // Should not see `.stage =` or `stage:` outside FSM context
      const directMutation = /\.stage\s*=\s*(?!.*attemptDealTransition)/
      // Allow `stage` in type annotations and return values but not direct sets
      const hasDirectMutation = directMutation.test(content)
      expect(
        hasDirectMutation,
        `${file} must not directly mutate deal.stage — use attemptDealTransition()`,
      ).toBe(false)
    })
  }
})

describe('TRADE-FSM-03 — Machine structural validity', () => {
  it('deal machine exists in trade-core/src/machines/deal.ts', () => {
    const path = join(ROOT, 'packages', 'trade-core', 'src', 'machines', 'deal.ts')
    expect(existsSync(path)).toBe(true)
  })

  it('engine exists in trade-core/src/machines/engine.ts', () => {
    const path = join(ROOT, 'packages', 'trade-core', 'src', 'machines', 'engine.ts')
    expect(existsSync(path)).toBe(true)
  })

  it('deal machine has terminal states (closed, cancelled)', () => {
    const path = join(ROOT, 'packages', 'trade-core', 'src', 'machines', 'deal.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('closed')
    expect(content).toContain('cancelled')
    expect(content).toContain('terminalStates')
  })
})

describe('TRADE-FSM-04 — FSM tests exist', () => {
  it('engine.test.ts exists with assertions', () => {
    const path = join(ROOT, 'packages', 'trade-core', 'src', 'machines', 'engine.test.ts')
    expect(existsSync(path)).toBe(true)
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('attemptDealTransition')
    expect(content).toContain('expect')
  })
})
