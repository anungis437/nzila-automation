/**
 * @nzila/commerce-state — Order State Machine
 *
 * @module @nzila/commerce-state/machines
 */
import { OrderStatus, OrgRole } from '@nzila/commerce-core/enums'
import type { MachineDefinition, TransitionDef } from '../engine'

type OS = OrderStatus

const t = (
  from: OS,
  to: OS,
  label: string,
  opts: Partial<Pick<TransitionDef<OS>, 'allowedRoles' | 'guards' | 'events' | 'actions' | 'timeout'>> = {},
): TransitionDef<OS> => ({
  from,
  to,
  label,
  allowedRoles: opts.allowedRoles ?? [],
  guards: opts.guards ?? [],
  events: opts.events ?? [{ type: `order.${to}`, payload: {} }],
  actions: opts.actions ?? [],
  timeout: opts.timeout,
})

export const orderMachine: MachineDefinition<OS> = {
  name: 'order',
  states: [
    OrderStatus.CREATED,
    OrderStatus.CONFIRMED,
    OrderStatus.FULFILLMENT,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
    OrderStatus.RETURN_REQUESTED,
    OrderStatus.NEEDS_ATTENTION,
  ],
  initialState: OrderStatus.CREATED,
  terminalStates: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  transitions: [
    // Created → Confirmed
    t(OrderStatus.CREATED, OrderStatus.CONFIRMED, 'Confirm order', {
      allowedRoles: [OrgRole.SALES, OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'order.confirmed', payload: {} }],
      actions: [
        { type: 'create_invoice_from_order', payload: {} },
        { type: 'create_fulfillment_tasks', payload: {} },
      ],
    }),

    // Confirmed → Fulfillment
    t(OrderStatus.CONFIRMED, OrderStatus.FULFILLMENT, 'Begin fulfilment', {
      allowedRoles: [OrgRole.WAREHOUSE, OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
    }),

    // Fulfillment → Shipped
    t(OrderStatus.FULFILLMENT, OrderStatus.SHIPPED, 'Ship order', {
      allowedRoles: [OrgRole.WAREHOUSE, OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'order.shipped', payload: {} }],
      actions: [{ type: 'send_shipping_notification', payload: {} }],
    }),

    // Shipped → Delivered
    t(OrderStatus.SHIPPED, OrderStatus.DELIVERED, 'Mark delivered', {
      events: [{ type: 'order.delivered', payload: {} }],
      actions: [{ type: 'create_delivery_evidence', payload: {} }],
    }),

    // Delivered → Completed
    t(OrderStatus.DELIVERED, OrderStatus.COMPLETED, 'Complete order', {
      allowedRoles: [OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'order.completed', payload: {} }],
    }),

    // Various → Cancelled
    t(OrderStatus.CREATED, OrderStatus.CANCELLED, 'Cancel order', {
      allowedRoles: [OrgRole.SALES, OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'order.cancelled', payload: {} }],
      actions: [{ type: 'void_related_invoice', payload: {} }],
    }),
    t(OrderStatus.CONFIRMED, OrderStatus.CANCELLED, 'Cancel order', {
      allowedRoles: [OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'order.cancelled', payload: {} }],
      actions: [{ type: 'void_related_invoice', payload: {} }],
    }),

    // Delivered → Return Requested
    t(OrderStatus.DELIVERED, OrderStatus.RETURN_REQUESTED, 'Request return', {
      events: [{ type: 'order.return_requested', payload: {} }],
    }),

    // Return Requested → Completed (return resolved)
    t(OrderStatus.RETURN_REQUESTED, OrderStatus.COMPLETED, 'Resolve return', {
      allowedRoles: [OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'order.return_resolved', payload: {} }],
      actions: [{ type: 'process_refund', payload: {} }],
    }),

    // Various → Needs Attention
    t(OrderStatus.FULFILLMENT, OrderStatus.NEEDS_ATTENTION, 'Flag for attention', {
      events: [{ type: 'order.needs_attention', payload: {} }],
    }),
    t(OrderStatus.SHIPPED, OrderStatus.NEEDS_ATTENTION, 'Flag for attention', {
      events: [{ type: 'order.needs_attention', payload: {} }],
    }),

    // Needs Attention → back to Fulfillment
    t(OrderStatus.NEEDS_ATTENTION, OrderStatus.FULFILLMENT, 'Resume fulfilment', {
      allowedRoles: [OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
    }),

    // Needs Attention → Cancelled
    t(OrderStatus.NEEDS_ATTENTION, OrderStatus.CANCELLED, 'Cancel order', {
      allowedRoles: [OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'order.cancelled', payload: {} }],
      actions: [{ type: 'void_related_invoice', payload: {} }],
    }),
  ],
}
