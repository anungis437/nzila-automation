/**
 * Contract Tests: Platform Package API Surface
 *
 * Validates that every platform-* package:
 *   1. Has a valid package.json with @nzila/platform-* name.
 *   2. Declares at least a "." export (public entry point).
 *   3. The file referenced by the "." export exists on disk.
 *   4. Has an owner declared in governance/platform-package-owners.yaml.
 *
 * This prevents silent API surface regressions and ensures all 31
 * platform packages remain discoverable and importable.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const REPO_ROOT = join(__dirname, '../..')
const PACKAGES_DIR = join(REPO_ROOT, 'packages')

/** Discover all platform-* package directories. */
function discoverPlatformPackages(): string[] {
  return readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('platform-'))
    .map((d) => d.name)
    .sort()
}

function readPkg(packageName: string) {
  const pkgPath = join(PACKAGES_DIR, packageName, 'package.json')
  return JSON.parse(readFileSync(pkgPath, 'utf-8'))
}

// Read ownership registry once
function readOwnershipRegistry(): Record<string, unknown> {
  const registryPath = join(REPO_ROOT, 'governance', 'platform-package-owners.yaml')
  if (!existsSync(registryPath)) return {}
  const content = readFileSync(registryPath, 'utf-8')
  // Simple YAML key extraction — looks for lines like "  platform-foo:"
  const entries: Record<string, unknown> = {}
  for (const match of content.matchAll(/^\s{2}(platform-[\w-]+):/gm)) {
    entries[match[1]] = true
  }
  return entries
}

const platformPackages = discoverPlatformPackages()
const ownershipRegistry = readOwnershipRegistry()

describe('Platform Package API Surface', () => {
  it('has at least 31 platform-* packages', () => {
    expect(platformPackages.length).toBeGreaterThanOrEqual(31)
  })

  describe.each(platformPackages)('%s', (pkgName) => {
    it('has a valid package.json with @nzila/ scope', () => {
      const pkg = readPkg(pkgName)
      expect(pkg.name).toBe(`@nzila/${pkgName}`)
    })

    it('declares a "." export entry point', () => {
      const pkg = readPkg(pkgName)
      expect(pkg.exports).toBeDefined()
      expect(pkg.exports['.']).toBeDefined()
    })

    it('root export file exists on disk', () => {
      const pkg = readPkg(pkgName)
      const rootExport = pkg.exports['.']
      // Handle both string and object shapes ({ import, require, default })
      const filePath =
        typeof rootExport === 'string'
          ? rootExport
          : rootExport?.import ?? rootExport?.default ?? rootExport?.require
      expect(filePath).toBeDefined()
      const fullPath = join(PACKAGES_DIR, pkgName, filePath)
      expect(existsSync(fullPath)).toBe(true)
    })

    it('has an owner in governance/platform-package-owners.yaml', () => {
      expect(ownershipRegistry[pkgName]).toBeTruthy()
    })
  })
})
