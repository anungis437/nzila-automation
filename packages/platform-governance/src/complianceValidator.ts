import * as fs from 'node:fs'
import * as path from 'node:path'
import type { AppComplianceStatus } from './types'
import { assessAppCompliance } from './governanceStatus'

export interface ComplianceValidationConfig {
  rootDir: string
  apps: string[]
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath)
}

function dirHasFiles(dirPath: string, pattern: RegExp): boolean {
  if (!fs.existsSync(dirPath)) return false
  const files = fs.readdirSync(dirPath, { recursive: true }) as string[]
  return files.some((f) => pattern.test(f))
}

export function validateAppCompliance(
  rootDir: string,
  appName: string,
): AppComplianceStatus {
  const appDir = path.join(rootDir, 'apps', appName)

  const hasSbom =
    fileExists(path.join(appDir, 'sbom.json')) ||
    fileExists(path.join(rootDir, 'sbom.json'))

  const hasPolicyEngine =
    fileExists(path.join(appDir, 'lib', 'policy-enforcement.ts')) ||
    fileExists(path.join(appDir, 'lib', 'policyEnforcement.ts'))

  const hasEvidencePack =
    fileExists(path.join(appDir, 'app', 'api', 'evidence', 'export', 'route.ts'))

  const hasHealthEndpoint =
    fileExists(path.join(appDir, 'app', 'api', 'health', 'route.ts'))

  const hasMetricsEndpoint =
    fileExists(path.join(appDir, 'app', 'api', 'metrics', 'route.ts'))

  const hasTests =
    dirHasFiles(path.join(appDir, 'tests'), /\.test\.ts$/) ||
    dirHasFiles(path.join(appDir, 'lib'), /\.test\.ts$/) ||
    dirHasFiles(path.join(appDir, '__tests__'), /\.test\.ts$/)

  return assessAppCompliance({
    name: appName,
    hasSbom,
    hasPolicyEngine,
    hasEvidencePack,
    hasHealthEndpoint,
    hasMetricsEndpoint,
    hasTests,
  })
}

export function validateAllApps(
  config: ComplianceValidationConfig,
): AppComplianceStatus[] {
  return config.apps.map((app) => validateAppCompliance(config.rootDir, app))
}
