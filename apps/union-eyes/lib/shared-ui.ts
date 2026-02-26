/**
 * Shared UI bridge — Union-Eyes.
 *
 * Re-exports @nzila/ui components for gradual migration away from the
 * local components/ui/ shadcn library (~61 local components).
 *
 * Usage:
 *   import { Card, Badge } from '@/lib/shared-ui'
 *
 * TODO(platform-migration): Gradually replace local components/ui imports
 * with these shared @nzila/ui components for cross-app consistency.
 */
export {
  Button as NzilaButton,
  Card as NzilaCard,
  Badge as NzilaBadge,
  Container as NzilaContainer,
  Sidebar as NzilaSidebar,
  SidebarItem as NzilaSidebarItem,
  SidebarSection as NzilaSidebarSection,
} from '@nzila/ui'
