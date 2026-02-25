/**
 * COMMERCE_001 — Commerce Engine Structural Invariants
 *
 * Contract tests for the commerce engine packages. These enforce
 * architectural invariants that must hold across all commerce packages.
 *
 * Rules:
 *   - All commerce state machines must validate cleanly
 *   - All commerce enum values must be lowercase strings
 *   - All commerce packages must have proper barrel exports
 *   - All governance-governed machines must remain valid
 *   - Commerce services must not import DB directly (port pattern)
 *   - Every commerce package must have vitest.config.ts
 *
 * @invariant COMMERCE_001
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(__dirname, '../..')

function readContent(path: string): string {
  try { return readFileSync(path, 'utf-8') } catch { return '' }
}

// ── Commerce packages under governance ──────────────────────────────────────

const COMMERCE_PACKAGES = [
  'packages/commerce-core',
  'packages/pricing-engine',
  'packages/commerce-state',
  'packages/commerce-audit',
  'packages/commerce-db',
  'packages/commerce-events',
  'packages/commerce-evidence',
  'packages/commerce-governance',
  'packages/commerce-services',
]

// ═══════════════════════════════════════════════════════════════════════════
// 1. Package Structure
// ═══════════════════════════════════════════════════════════════════════════

describe('COMMERCE_001a — Commerce package structure', () => {
  for (const pkg of COMMERCE_PACKAGES) {
    describe(pkg, () => {
      it('has package.json', () => {
        expect(existsSync(join(ROOT, pkg, 'package.json'))).toBe(true)
      })

      it('has tsconfig.json', () => {
        expect(existsSync(join(ROOT, pkg, 'tsconfig.json'))).toBe(true)
      })

      it('has vitest.config.ts', () => {
        expect(existsSync(join(ROOT, pkg, 'vitest.config.ts'))).toBe(true)
      })

      it('has src/ directory or index barrel', () => {
        const hasSrc = existsSync(join(ROOT, pkg, 'src'))
        expect(hasSrc).toBe(true)
      })

      it('has barrel index.ts in src/', () => {
        const indexPath = join(ROOT, pkg, 'src', 'index.ts')
        expect(existsSync(indexPath)).toBe(true)
      })

      it('package.json has workspace: protocol dependencies for sibling commerce packages', () => {
        const pkgJson = JSON.parse(readContent(join(ROOT, pkg, 'package.json')) || '{}')
        const allDeps = {
          ...pkgJson.dependencies,
          ...pkgJson.devDependencies,
        }
        for (const [dep, version] of Object.entries(allDeps)) {
          if (typeof version !== 'string') continue
          if ((dep as string).startsWith('@nzila/commerce-') || dep === '@nzila/pricing-engine') {
            expect(
              version.startsWith('workspace:'),
              `${pkg}: ${dep} must use workspace: protocol, got "${version}"`,
            ).toBe(true)
          }
        }
      })
    })
  }
})

// ═══════════════════════════════════════════════════════════════════════════
// 2. Enum Value Format
// ═══════════════════════════════════════════════════════════════════════════

describe('COMMERCE_001b — Enum values are lowercase strings', () => {
  it('commerce-core enums.ts values are all lowercase', () => {
    const enumsPath = join(ROOT, 'packages/commerce-core/src/enums.ts')
    const content = readContent(enumsPath)
    expect(content.length).toBeGreaterThan(0)

    // Extract all string values assigned in const objects
    const valuePattern = /:\s*'([^']+)'/g
    let match: RegExpExecArray | null
    const values: string[] = []
    while ((match = valuePattern.exec(content)) !== null) {
      values.push(match[1]!)
    }

    expect(values.length).toBeGreaterThan(0)
    for (const value of values) {
      expect(
        value === value.toLowerCase(),
        `Enum value "${value}" must be lowercase`,
      ).toBe(true)
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 3. State Machine Definitions
// ═══════════════════════════════════════════════════════════════════════════

describe('COMMERCE_001c — State machine definitions are consistent', () => {
  it('commerce-state exports all 4 machine definitions', () => {
    const indexPath = join(ROOT, 'packages/commerce-state/src/index.ts')
    const content = readContent(indexPath)
    expect(content).toContain('quoteMachine')
    expect(content).toContain('orderMachine')
    expect(content).toContain('invoiceMachine')
    expect(content).toContain('fulfillmentMachine')
  })

  it('each machine file is in machines/ subdirectory', () => {
    const machineDir = join(ROOT, 'packages/commerce-state/src/machines')
    expect(existsSync(machineDir)).toBe(true)

    const expected = ['quote.ts', 'order.ts', 'invoice.ts', 'fulfillment.ts']
    for (const file of expected) {
      expect(
        existsSync(join(machineDir, file)),
        `Missing machine file: ${file}`,
      ).toBe(true)
    }
  })

  it('machine files import OrgRole from commerce-core', () => {
    const machineDir = join(ROOT, 'packages/commerce-state/src/machines')
    const files = ['quote.ts', 'order.ts', 'invoice.ts', 'fulfillment.ts']
    for (const file of files) {
      const content = readContent(join(machineDir, file))
      expect(
        content.includes('@nzila/commerce-core/enums'),
        `${file} must import from @nzila/commerce-core/enums`,
      ).toBe(true)
    }
  })

  it('every transition has a non-empty label', () => {
    const machineDir = join(ROOT, 'packages/commerce-state/src/machines')
    const files = ['quote.ts', 'order.ts', 'invoice.ts', 'fulfillment.ts']
    for (const file of files) {
      const content = readContent(join(machineDir, file))
      // Look for empty label patterns like label: ''
      expect(
        !content.includes("label: ''"),
        `${file} must not have empty labels`,
      ).toBe(true)
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 4. Governance Gates Coverage
// ═══════════════════════════════════════════════════════════════════════════

describe('COMMERCE_001d — Governance gates cover all machine types', () => {
  it('governance exports governed machine factories for quote, order, invoice', () => {
    const indexPath = join(ROOT, 'packages/commerce-governance/src/index.ts')
    const content = readContent(indexPath)
    expect(content).toContain('createGovernedQuoteMachine')
    expect(content).toContain('createGovernedOrderMachine')
    expect(content).toContain('createGovernedInvoiceMachine')
  })

  it('governance exports evaluateGates for diagnostics', () => {
    const indexPath = join(ROOT, 'packages/commerce-governance/src/index.ts')
    const content = readContent(indexPath)
    expect(content).toContain('evaluateGates')
  })

  it('governance exports withGovernanceGates enhancer', () => {
    const indexPath = join(ROOT, 'packages/commerce-governance/src/index.ts')
    const content = readContent(indexPath)
    expect(content).toContain('withGovernanceGates')
  })

  it('governance gates.ts has no side effects (no console.log, no fetch, no fs)', () => {
    const gatesPath = join(ROOT, 'packages/commerce-governance/src/gates.ts')
    const content = readContent(gatesPath)
    expect(content).not.toContain('console.log')
    expect(content).not.toContain('console.warn')
    expect(content).not.toContain('console.error')
    expect(content).not.toContain("from 'node:fs'")
    expect(content).not.toContain("from 'fs'")
    expect(content).not.toContain('fetch(')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 5. Commerce Services Port Pattern
// ═══════════════════════════════════════════════════════════════════════════

describe('COMMERCE_001e — Commerce services follow port pattern', () => {
  it('commerce-services does not import @nzila/db directly', () => {
    const srcDir = join(ROOT, 'packages/commerce-services/src')
    if (!existsSync(srcDir)) return

    const tsFiles: string[] = []
    const stack = [srcDir]
    while (stack.length > 0) {
      const dir = stack.pop()!
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory() && entry.name !== 'node_modules') stack.push(full)
        else if (entry.isFile() && entry.name.endsWith('.ts')) tsFiles.push(full)
      }
    }

    for (const file of tsFiles) {
      const content = readContent(file)
      // Services must not import DB schemas directly — they use commerce-db ports
      expect(
        !content.includes("from '@nzila/db/schema'"),
        `${file} must not import @nzila/db/schema directly (use commerce-db ports)`,
      ).toBe(true)
    }
  })

  it('commerce-services uses dependency injection for DB access', () => {
    // Check that service factories accept ports as parameters
    const srcDir = join(ROOT, 'packages/commerce-services/src')
    if (!existsSync(srcDir)) return

    const needsPortInjection = ['quote-service.ts', 'order-service.ts', 'invoice-service.ts']
    for (const file of needsPortInjection) {
      const content = readContent(join(srcDir, file))
      if (content.length === 0) continue

      // Service files should define a Ports type and a factory function
      const hasPortsType = content.includes('Ports') || content.includes('ports')
      expect(
        hasPortsType,
        `${file} should define and accept Ports for dependency injection`,
      ).toBe(true)
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 6. Commerce Audit — Complete Coverage
// ═══════════════════════════════════════════════════════════════════════════

describe('COMMERCE_001f — Commerce audit module completeness', () => {
  it('audit exports buildTransitionAuditEntry', () => {
    const indexPath = join(ROOT, 'packages/commerce-audit/src/index.ts')
    const content = readContent(indexPath)
    expect(content).toContain('buildTransitionAuditEntry')
  })

  it('audit exports buildActionAuditEntry', () => {
    const indexPath = join(ROOT, 'packages/commerce-audit/src/index.ts')
    const content = readContent(indexPath)
    expect(content).toContain('buildActionAuditEntry')
  })

  it('audit exports validateAuditEntry', () => {
    const indexPath = join(ROOT, 'packages/commerce-audit/src/index.ts')
    const content = readContent(indexPath)
    expect(content).toContain('validateAuditEntry')
  })

  it('audit has no side effects in builder functions', () => {
    const auditPath = join(ROOT, 'packages/commerce-audit/src/audit.ts')
    const content = readContent(auditPath)
    expect(content).not.toContain('console.log')
    expect(content).not.toContain('fetch(')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 7. Commerce Events — Event Type Constants
// ═══════════════════════════════════════════════════════════════════════════

describe('COMMERCE_001g — Commerce events module completeness', () => {
  it('events exports CommerceEventTypes constants', () => {
    const indexPath = join(ROOT, 'packages/commerce-events/src/index.ts')
    const content = readContent(indexPath)
    expect(content).toContain('CommerceEventTypes')
  })

  it('events exports InMemoryEventBus', () => {
    const indexPath = join(ROOT, 'packages/commerce-events/src/index.ts')
    const content = readContent(indexPath)
    expect(content).toContain('InMemoryEventBus')
  })

  it('events exports createSagaOrchestrator', () => {
    const indexPath = join(ROOT, 'packages/commerce-events/src/index.ts')
    const content = readContent(indexPath)
    expect(content).toContain('createSagaOrchestrator')
  })

  it('event-types.ts has quote/order/invoice event type constants', () => {
    const eventTypesPath = join(ROOT, 'packages/commerce-events/src/event-types.ts')
    const content = readContent(eventTypesPath)
    expect(content).toContain('QUOTE_')
    expect(content).toContain('ORDER_')
    expect(content).toContain('INVOICE_')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 8. Root vitest.config.ts — All commerce packages registered
// ═══════════════════════════════════════════════════════════════════════════

describe('COMMERCE_001h — All commerce packages in root vitest config', () => {
  it('root vitest.config.ts includes all commerce packages', () => {
    const vitestConfigPath = join(ROOT, 'vitest.config.ts')
    const content = readContent(vitestConfigPath)

    for (const pkg of COMMERCE_PACKAGES) {
      expect(
        content.includes(`'${pkg}'`) || content.includes(`"${pkg}"`),
        `Root vitest.config.ts must include "${pkg}"`,
      ).toBe(true)
    }
  })
})
