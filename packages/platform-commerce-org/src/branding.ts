/**
 * @nzila/platform-commerce-org — Branding utilities
 *
 * Resolves org branding config for customer-facing surfaces.
 */
import type { OrgBrandingConfig } from './types'

export function resolveLogoInitials(branding: OrgBrandingConfig): string {
  if (branding.logoInitials) return branding.logoInitials
  return branding.displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function resolveCopyrightNotice(branding: OrgBrandingConfig, year: number): string {
  return `© ${year} ${branding.companyLegalName}. All rights reserved.`
}

export function resolveFooterText(branding: OrgBrandingConfig): string {
  return branding.quoteFooterText ?? `Thank you for your business. — ${branding.displayName}`
}
