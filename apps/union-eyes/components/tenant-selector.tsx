"use client";

/**
 * Organization Selector Wrapper (DEPRECATED)
 * 
 * @deprecated Use OrganizationSelector from @/components/organization/organization-selector instead
 * 
 * This component is maintained for backwards compatibility only.
 * It now wraps the new OrganizationSelector component.
 */

import { OrganizationSelector } from "@/components/organization/organization-selector";

/**
 * @deprecated Use OrganizationSelector instead
 */
export function TenantSelector() {
  // Redirect to new OrganizationSelector
  return <OrganizationSelector />;
}

// Legacy implementation removed - use OrganizationSelector instead
// See: @/components/organization/organization-selector

