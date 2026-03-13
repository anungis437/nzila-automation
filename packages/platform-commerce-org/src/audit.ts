/**
 * @nzila/platform-commerce-org — Audit integration
 *
 * Emits structured audit events for org config changes.
 */
import type { OrgConfigChangeEvent, OrgCommerceConfig } from './types'

export type OrgConfigEventType =
  | 'org_commerce_config_updated'
  | 'org_quote_policy_updated'
  | 'org_payment_policy_updated'
  | 'org_supplier_policy_updated'
  | 'org_branding_updated'
  | 'org_template_updated'
  | 'org_catalog_policy_updated'

const CONFIG_TYPE_TO_EVENT: Record<keyof OrgCommerceConfig, OrgConfigEventType> = {
  settings: 'org_commerce_config_updated',
  quotePolicy: 'org_quote_policy_updated',
  paymentPolicy: 'org_payment_policy_updated',
  supplierPolicy: 'org_supplier_policy_updated',
  catalogPolicy: 'org_catalog_policy_updated',
  branding: 'org_branding_updated',
  communicationTemplates: 'org_template_updated',
}

export function buildConfigChangeEvent(
  orgId: string,
  configType: keyof OrgCommerceConfig,
  actorId: string,
  previousValue: unknown,
  newValue: unknown,
): OrgConfigChangeEvent {
  return {
    orgId,
    configType,
    actorId,
    timestamp: new Date(),
    previousValue,
    newValue,
  }
}

export function getEventType(configType: keyof OrgCommerceConfig): OrgConfigEventType {
  return CONFIG_TYPE_TO_EVENT[configType]
}

export interface PolicySensitivityCheck {
  field: string
  reason: string
  requiresPolicyEvaluation: boolean
}

const SENSITIVE_FIELDS: Record<string, PolicySensitivityCheck> = {
  depositRequired: {
    field: 'depositRequired',
    reason: 'Changing deposit rules affects production gating',
    requiresPolicyEvaluation: true,
  },
  defaultDepositPercent: {
    field: 'defaultDepositPercent',
    reason: 'Deposit percentage change affects cash flow controls',
    requiresPolicyEvaluation: true,
  },
  minMarginPercent: {
    field: 'minMarginPercent',
    reason: 'Lowering margin thresholds affects profitability controls',
    requiresPolicyEvaluation: true,
  },
  allowManualPriceOverride: {
    field: 'allowManualPriceOverride',
    reason: 'Enabling manual price override bypasses pricing controls',
    requiresPolicyEvaluation: true,
  },
  supplierSelectionStrategy: {
    field: 'supplierSelectionStrategy',
    reason: 'Changing supplier strategy affects procurement governance',
    requiresPolicyEvaluation: true,
  },
  approvalThreshold: {
    field: 'approvalThreshold',
    reason: 'Changing approval threshold affects financial governance',
    requiresPolicyEvaluation: true,
  },
}

export function getSensitiveFields(changedFields: string[]): PolicySensitivityCheck[] {
  return changedFields
    .filter((f) => f in SENSITIVE_FIELDS)
    .map((f) => SENSITIVE_FIELDS[f]!)
}
