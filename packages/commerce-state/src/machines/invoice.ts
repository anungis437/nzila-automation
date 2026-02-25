/**
 * @nzila/commerce-state — Invoice State Machine
 *
 * @module @nzila/commerce-state/machines
 */
import { InvoiceStatus, OrgRole } from '@nzila/commerce-core/enums'
import type { MachineDefinition, TransitionDef } from '../engine'

type IS = InvoiceStatus

const t = (
  from: IS,
  to: IS,
  label: string,
  opts: Partial<Pick<TransitionDef<IS>, 'allowedRoles' | 'guards' | 'events' | 'actions' | 'timeout'>> = {},
): TransitionDef<IS> => ({
  from,
  to,
  label,
  allowedRoles: opts.allowedRoles ?? [],
  guards: opts.guards ?? [],
  events: opts.events ?? [{ type: `invoice.${to}`, payload: {} }],
  actions: opts.actions ?? [],
  timeout: opts.timeout,
})

export const invoiceMachine: MachineDefinition<IS> = {
  name: 'invoice',
  states: [
    InvoiceStatus.DRAFT,
    InvoiceStatus.ISSUED,
    InvoiceStatus.SENT,
    InvoiceStatus.PARTIAL_PAID,
    InvoiceStatus.PAID,
    InvoiceStatus.OVERDUE,
    InvoiceStatus.DISPUTED,
    InvoiceStatus.RESOLVED,
    InvoiceStatus.REFUNDED,
    InvoiceStatus.CREDIT_NOTE,
    InvoiceStatus.CANCELLED,
  ],
  initialState: InvoiceStatus.DRAFT,
  terminalStates: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED, InvoiceStatus.REFUNDED],
  transitions: [
    // Draft → Issued
    t(InvoiceStatus.DRAFT, InvoiceStatus.ISSUED, 'Issue invoice', {
      allowedRoles: [OrgRole.FINANCE, OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'invoice.issued', payload: {} }],
    }),

    // Issued → Sent
    t(InvoiceStatus.ISSUED, InvoiceStatus.SENT, 'Send invoice', {
      allowedRoles: [OrgRole.FINANCE, OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'invoice.sent', payload: {} }],
      actions: [{ type: 'send_invoice_email', payload: {} }],
    }),

    // Sent → Partial Paid
    t(InvoiceStatus.SENT, InvoiceStatus.PARTIAL_PAID, 'Record partial payment', {
      allowedRoles: [OrgRole.FINANCE, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'invoice.partial_paid', payload: {} }],
    }),

    // Partial Paid → Paid
    t(InvoiceStatus.PARTIAL_PAID, InvoiceStatus.PAID, 'Record final payment', {
      allowedRoles: [OrgRole.FINANCE, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'invoice.paid', payload: {} }],
    }),

    // Sent → Paid (full payment at once)
    t(InvoiceStatus.SENT, InvoiceStatus.PAID, 'Record full payment', {
      allowedRoles: [OrgRole.FINANCE, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'invoice.paid', payload: {} }],
    }),

    // Sent → Overdue
    t(InvoiceStatus.SENT, InvoiceStatus.OVERDUE, 'Mark overdue', {
      events: [{ type: 'invoice.overdue', payload: {} }],
      actions: [{ type: 'send_overdue_reminder', payload: {} }],
      timeout: { delayMs: 30 * 24 * 60 * 60 * 1000, targetState: InvoiceStatus.OVERDUE },
    }),

    // Overdue → Paid
    t(InvoiceStatus.OVERDUE, InvoiceStatus.PAID, 'Record payment (overdue)', {
      allowedRoles: [OrgRole.FINANCE, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'invoice.paid', payload: {} }],
    }),

    // Overdue → Partial Paid
    t(InvoiceStatus.OVERDUE, InvoiceStatus.PARTIAL_PAID, 'Record partial payment', {
      allowedRoles: [OrgRole.FINANCE, OrgRole.ADMIN, OrgRole.OWNER],
    }),

    // Sent / Overdue → Disputed
    t(InvoiceStatus.SENT, InvoiceStatus.DISPUTED, 'Dispute raised', {
      events: [{ type: 'invoice.disputed', payload: {} }],
    }),
    t(InvoiceStatus.OVERDUE, InvoiceStatus.DISPUTED, 'Dispute raised', {
      events: [{ type: 'invoice.disputed', payload: {} }],
    }),

    // Disputed → Resolved
    t(InvoiceStatus.DISPUTED, InvoiceStatus.RESOLVED, 'Resolve dispute', {
      allowedRoles: [OrgRole.FINANCE, OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'invoice.resolved', payload: {} }],
    }),

    // Resolved → Sent (re-send after resolution)
    t(InvoiceStatus.RESOLVED, InvoiceStatus.SENT, 'Re-send after resolution', {
      allowedRoles: [OrgRole.FINANCE, OrgRole.ADMIN, OrgRole.OWNER],
    }),

    // Resolved → Credit Note
    t(InvoiceStatus.RESOLVED, InvoiceStatus.CREDIT_NOTE, 'Issue credit note', {
      allowedRoles: [OrgRole.FINANCE, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'invoice.credit_note', payload: {} }],
      actions: [{ type: 'create_credit_note', payload: {} }],
    }),

    // Resolved → Refunded
    t(InvoiceStatus.RESOLVED, InvoiceStatus.REFUNDED, 'Process refund', {
      allowedRoles: [OrgRole.FINANCE, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'invoice.refunded', payload: {} }],
      actions: [{ type: 'process_refund', payload: {} }],
    }),

    // Credit Note → Refunded
    t(InvoiceStatus.CREDIT_NOTE, InvoiceStatus.REFUNDED, 'Process refund after credit', {
      allowedRoles: [OrgRole.FINANCE, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'invoice.refunded', payload: {} }],
    }),

    // Cancellations
    t(InvoiceStatus.DRAFT, InvoiceStatus.CANCELLED, 'Cancel invoice', {
      allowedRoles: [OrgRole.FINANCE, OrgRole.ADMIN, OrgRole.OWNER],
    }),
    t(InvoiceStatus.ISSUED, InvoiceStatus.CANCELLED, 'Void invoice', {
      allowedRoles: [OrgRole.FINANCE, OrgRole.ADMIN, OrgRole.OWNER],
    }),
  ],
}
