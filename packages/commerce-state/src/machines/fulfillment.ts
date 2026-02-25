/**
 * @nzila/commerce-state — Fulfillment State Machine
 *
 * @module @nzila/commerce-state/machines
 */
import { FulfillmentStatus, OrgRole } from '@nzila/commerce-core/enums'
import type { MachineDefinition, TransitionDef } from '../engine'

type FS = FulfillmentStatus

const t = (
  from: FS,
  to: FS,
  label: string,
  opts: Partial<Pick<TransitionDef<FS>, 'allowedRoles' | 'guards' | 'events' | 'actions' | 'timeout'>> = {},
): TransitionDef<FS> => ({
  from,
  to,
  label,
  allowedRoles: opts.allowedRoles ?? [],
  guards: opts.guards ?? [],
  events: opts.events ?? [{ type: `fulfillment.${to}`, payload: {} }],
  actions: opts.actions ?? [],
  timeout: opts.timeout,
})

export const fulfillmentMachine: MachineDefinition<FS> = {
  name: 'fulfillment',
  states: [
    FulfillmentStatus.PENDING,
    FulfillmentStatus.ALLOCATED,
    FulfillmentStatus.PRODUCTION,
    FulfillmentStatus.QUALITY_CHECK,
    FulfillmentStatus.PACKAGING,
    FulfillmentStatus.SHIPPED,
    FulfillmentStatus.DELIVERED,
    FulfillmentStatus.ON_HOLD,
    FulfillmentStatus.BLOCKED,
    FulfillmentStatus.CANCELLED,
  ],
  initialState: FulfillmentStatus.PENDING,
  terminalStates: [FulfillmentStatus.DELIVERED, FulfillmentStatus.CANCELLED],
  transitions: [
    // Pending → Allocated
    t(FulfillmentStatus.PENDING, FulfillmentStatus.ALLOCATED, 'Allocate inventory', {
      allowedRoles: [OrgRole.WAREHOUSE, OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
    }),

    // Allocated → Production
    t(FulfillmentStatus.ALLOCATED, FulfillmentStatus.PRODUCTION, 'Start production', {
      allowedRoles: [OrgRole.WAREHOUSE, OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
    }),

    // Production → Quality Check
    t(FulfillmentStatus.PRODUCTION, FulfillmentStatus.QUALITY_CHECK, 'Submit for QC', {
      allowedRoles: [OrgRole.WAREHOUSE, OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
    }),

    // Quality Check → Packaging
    t(FulfillmentStatus.QUALITY_CHECK, FulfillmentStatus.PACKAGING, 'QC passed', {
      allowedRoles: [OrgRole.WAREHOUSE, OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
    }),

    // Quality Check → Blocked (QC failed)
    t(FulfillmentStatus.QUALITY_CHECK, FulfillmentStatus.BLOCKED, 'QC failed', {
      allowedRoles: [OrgRole.WAREHOUSE, OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'fulfillment.qc_failed', payload: {} }],
    }),

    // Packaging → Shipped
    t(FulfillmentStatus.PACKAGING, FulfillmentStatus.SHIPPED, 'Ship', {
      allowedRoles: [OrgRole.WAREHOUSE, OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'fulfillment.shipped', payload: {} }],
      actions: [{ type: 'notify_order_shipped', payload: {} }],
    }),

    // Shipped → Delivered
    t(FulfillmentStatus.SHIPPED, FulfillmentStatus.DELIVERED, 'Confirm delivery', {
      events: [{ type: 'fulfillment.delivered', payload: {} }],
      actions: [{ type: 'create_delivery_evidence', payload: {} }],
    }),

    // Various → On Hold
    t(FulfillmentStatus.PENDING, FulfillmentStatus.ON_HOLD, 'Put on hold', {
      allowedRoles: [OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
    }),
    t(FulfillmentStatus.ALLOCATED, FulfillmentStatus.ON_HOLD, 'Put on hold', {
      allowedRoles: [OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
    }),
    t(FulfillmentStatus.PRODUCTION, FulfillmentStatus.ON_HOLD, 'Put on hold', {
      allowedRoles: [OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
    }),

    // On Hold → Pending (resume)
    t(FulfillmentStatus.ON_HOLD, FulfillmentStatus.PENDING, 'Resume', {
      allowedRoles: [OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
    }),

    // Blocked → Production (rework)
    t(FulfillmentStatus.BLOCKED, FulfillmentStatus.PRODUCTION, 'Rework', {
      allowedRoles: [OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
    }),

    // Various → Cancelled
    t(FulfillmentStatus.PENDING, FulfillmentStatus.CANCELLED, 'Cancel', {
      allowedRoles: [OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
    }),
    t(FulfillmentStatus.ALLOCATED, FulfillmentStatus.CANCELLED, 'Cancel', {
      allowedRoles: [OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
    }),
    t(FulfillmentStatus.ON_HOLD, FulfillmentStatus.CANCELLED, 'Cancel', {
      allowedRoles: [OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
    }),
    t(FulfillmentStatus.BLOCKED, FulfillmentStatus.CANCELLED, 'Cancel', {
      allowedRoles: [OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
    }),
  ],
}
