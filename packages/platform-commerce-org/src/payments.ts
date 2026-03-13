/**
 * @nzila/platform-commerce-org — Payment policy utilities
 *
 * Deposit calculation and payment term resolution driven by org config.
 */
import type { OrgPaymentPolicy } from './types'

export function calculateDepositAmount(
  total: number,
  policy: OrgPaymentPolicy,
): { depositRequired: boolean; depositAmount: number; depositPercent: number } {
  if (!policy.depositRequired) {
    return { depositRequired: false, depositAmount: 0, depositPercent: 0 }
  }
  const depositAmount = Math.round(total * (policy.defaultDepositPercent / 100) * 100) / 100
  return {
    depositRequired: true,
    depositAmount,
    depositPercent: policy.defaultDepositPercent,
  }
}

export function calculateDueDate(invoiceDate: Date, policy: OrgPaymentPolicy): Date {
  const due = new Date(invoiceDate)
  due.setDate(due.getDate() + policy.defaultPaymentTermsDays)
  return due
}

export function isProductionGated(policy: OrgPaymentPolicy): boolean {
  return policy.depositRequired && policy.depositRequiredBeforeProduction
}
