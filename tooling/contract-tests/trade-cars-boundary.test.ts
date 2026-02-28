/**
 * Contract Test — Trade Cars Boundary
 *
 * TRADE_CARS_BOUNDARY_005:
 *   1. trade-cars depends on trade-core (enums + types only)
 *   2. trade-cars does NOT import from @nzila/db or @nzila/trade-db
 *   3. trade-cars does NOT import from apps/trade
 *   4. trade-cars exports components, helpers, types, and schemas
 *   5. Cars vertical adapter exists in trade-adapters/src/legacy-eexports
 *
 * @invariant TRADE_CARS_BOUNDARY_005
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '../..')
const TRADE_CARS = join(ROOT, 'packages', 'trade-cars')
const TRADE_CARS_SRC = join(TRADE_CARS, 'src')

describe('TRADE-CARS-01 — Package structure', () => {
  it('package.json exists', () => {
    expect(existsSync(join(TRADE_CARS, 'package.json'))).toBe(true)
  })

  it('package name is @nzila/trade-cars', () => {
    const pkg = JSON.parse(readFileSync(join(TRADE_CARS, 'package.json'), 'utf-8'))
    expect(pkg.name).toBe('@nzila/trade-cars')
  })

  it('has required src files', () => {
    expect(existsSync(join(TRADE_CARS_SRC, 'index.ts'))).toBe(true)
    expect(existsSync(join(TRADE_CARS_SRC, 'types.ts'))).toBe(true)
    expect(existsSync(join(TRADE_CARS_SRC, 'schemas.ts'))).toBe(true)
  })

  it('has components directory', () => {
    expect(existsSync(join(TRADE_CARS_SRC, 'components'))).toBe(true)
  })

  it('has helpers directory', () => {
    expect(existsSync(join(TRADE_CARS_SRC, 'helpers'))).toBe(true)
  })
})

describe('TRADE-CARS-02 — Dependency boundary enforcement', () => {
  function getAllSourceFiles(dir: string): string[] {
    const files: string[] = []
    if (!existsSync(dir)) return files
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...getAllSourceFiles(full))
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        if (!entry.name.endsWith('.test.ts') && !entry.name.endsWith('.test.tsx')) {
          files.push(full)
        }
      }
    }
    return files
  }

  const srcFiles = getAllSourceFiles(TRADE_CARS_SRC)

  for (const filePath of srcFiles) {
    const relPath = filePath.replace(TRADE_CARS_SRC + '\\', '').replace(TRADE_CARS_SRC + '/', '')

    it(`${relPath} does not import from @nzila/db`, () => {
      const content = readFileSync(filePath, 'utf-8')
      expect(content).not.toContain("from '@nzila/db")
    })

    it(`${relPath} does not import from @nzila/trade-db`, () => {
      const content = readFileSync(filePath, 'utf-8')
      expect(content).not.toContain("from '@nzila/trade-db")
    })

    it(`${relPath} does not import from apps/trade`, () => {
      const content = readFileSync(filePath, 'utf-8')
      expect(content).not.toContain("from '@nzila/trade'")
      expect(content).not.toMatch(/from\s+['"]@\//)
    })
  }
})

describe('TRADE-CARS-03 — trade-cars only imports from trade-core', () => {
  it('types.ts imports from @nzila/trade-core', () => {
    const content = readFileSync(join(TRADE_CARS_SRC, 'types.ts'), 'utf-8')
    const imports = content.match(/from\s+['"]@nzila\/[^'"]+['"]/g) ?? []
    for (const imp of imports) {
      expect(imp).toMatch(/@nzila\/trade-core/)
    }
  })
})

describe('TRADE-CARS-04 — Legacy adapter exists', () => {
  it('trade-adapters/src/legacy-eexports/index.ts exists', () => {
    const path = join(
      ROOT,
      'packages',
      'trade-adapters',
      'src',
      'legacy-eexports',
      'index.ts',
    )
    expect(existsSync(path)).toBe(true)
  })

  it('adapter exports mapping functions', () => {
    const path = join(
      ROOT,
      'packages',
      'trade-adapters',
      'src',
      'legacy-eexports',
      'index.ts',
    )
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('mapLegacyVehicle')
    expect(content).toContain('mapLegacyDoc')
  })
})
