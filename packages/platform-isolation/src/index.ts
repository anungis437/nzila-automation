/**
 * Nzila OS — Isolation Certification Engine
 *
 * Audits platform isolation guarantees:
 * - All org tables have RLS (org_id) enabled
 * - All server actions resolve org context
 * - No cross-org SELECT without filter
 * - No direct DB access outside scoped wrapper
 *
 * @module @nzila/platform-isolation
 */

export {
  runIsolationAudit,
  computeIsolationScore,
  type IsolationAuditResult,
  type IsolationViolation,
} from './audit'

export {
  runMultiOrgStress,
  computeStressIsolationScore,
  generateOrgProfiles,
  DEFAULT_STRESS_CONFIG,
  type StressOrgProfile,
  type StressConfig,
  type OrgStressResult,
  type CrossOrgLeakEvent,
  type MultiOrgStressResult,
} from './multi-org-stress'
