/**
 * Organization Hooks
 * 
 * Convenience hooks for accessing organization context in components.
 * These re-export the hooks from OrganizationContext for easier imports.
 */

export {
  useOrganization,
  useOrganizationId,
  useUserOrganizations,
  useSwitchOrganization,
  type Organization,
  type OrganizationMember,
  type OrganizationContextValue,
} from '@/contexts/organization-context';

