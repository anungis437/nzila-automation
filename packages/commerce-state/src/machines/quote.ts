/**
 * @nzila/commerce-state — Quote State Machine
 *
 * Declarative definition of all valid quote lifecycle transitions.
 *
 * @module @nzila/commerce-state/machines
 */
import { QuoteStatus, OrgRole } from '@nzila/commerce-core/enums'
import type { MachineDefinition, TransitionDef } from '../engine'

type QS = QuoteStatus

const t = (
  from: QS,
  to: QS,
  label: string,
  opts: Partial<Pick<TransitionDef<QS>, 'allowedRoles' | 'guards' | 'events' | 'actions' | 'timeout'>> = {},
): TransitionDef<QS> => ({
  from,
  to,
  label,
  allowedRoles: opts.allowedRoles ?? [],
  guards: opts.guards ?? [],
  events: opts.events ?? [{ type: `quote.${to}`, payload: {} }],
  actions: opts.actions ?? [],
  timeout: opts.timeout,
})

export const quoteMachine: MachineDefinition<QS> = {
  name: 'quote',
  states: [
    QuoteStatus.DRAFT,
    QuoteStatus.PRICING,
    QuoteStatus.READY,
    QuoteStatus.SENT,
    QuoteStatus.REVIEWING,
    QuoteStatus.ACCEPTED,
    QuoteStatus.DECLINED,
    QuoteStatus.REVISED,
    QuoteStatus.EXPIRED,
    QuoteStatus.CANCELLED,
  ],
  initialState: QuoteStatus.DRAFT,
  terminalStates: [QuoteStatus.ACCEPTED, QuoteStatus.DECLINED, QuoteStatus.EXPIRED, QuoteStatus.CANCELLED, QuoteStatus.REVISED],
  transitions: [
    // Draft → Pricing (submit for pricing)
    t(QuoteStatus.DRAFT, QuoteStatus.PRICING, 'Submit for pricing', {
      allowedRoles: [OrgRole.SALES, OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
    }),

    // Pricing → Ready (pricing complete)
    t(QuoteStatus.PRICING, QuoteStatus.READY, 'Pricing complete', {
      allowedRoles: [OrgRole.SALES, OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
    }),

    // Ready → Sent (send to customer)
    t(QuoteStatus.READY, QuoteStatus.SENT, 'Send to customer', {
      allowedRoles: [OrgRole.SALES, OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'quote.sent', payload: {} }],
      actions: [{ type: 'send_quote_email', payload: {} }],
    }),

    // Sent → Reviewing (customer is reviewing)
    t(QuoteStatus.SENT, QuoteStatus.REVIEWING, 'Customer reviewing'),

    // Reviewing → Accepted
    t(QuoteStatus.REVIEWING, QuoteStatus.ACCEPTED, 'Customer accepted', {
      events: [
        { type: 'quote.accepted', payload: {} },
        { type: 'order.create_from_quote', payload: {} },
      ],
      actions: [{ type: 'create_order_from_quote', payload: {} }],
    }),

    // Reviewing → Declined
    t(QuoteStatus.REVIEWING, QuoteStatus.DECLINED, 'Customer declined', {
      events: [{ type: 'quote.declined', payload: {} }],
    }),

    // Sent → Accepted (direct accept without reviewing step)
    t(QuoteStatus.SENT, QuoteStatus.ACCEPTED, 'Customer accepted', {
      events: [
        { type: 'quote.accepted', payload: {} },
        { type: 'order.create_from_quote', payload: {} },
      ],
      actions: [{ type: 'create_order_from_quote', payload: {} }],
    }),

    // Sent → Declined (direct decline)
    t(QuoteStatus.SENT, QuoteStatus.DECLINED, 'Customer declined', {
      events: [{ type: 'quote.declined', payload: {} }],
    }),

    // Any non-terminal → Cancelled
    t(QuoteStatus.DRAFT, QuoteStatus.CANCELLED, 'Cancel quote', {
      allowedRoles: [OrgRole.SALES, OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
    }),
    t(QuoteStatus.PRICING, QuoteStatus.CANCELLED, 'Cancel quote', {
      allowedRoles: [OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
    }),
    t(QuoteStatus.READY, QuoteStatus.CANCELLED, 'Cancel quote', {
      allowedRoles: [OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
    }),
    t(QuoteStatus.SENT, QuoteStatus.CANCELLED, 'Cancel quote', {
      allowedRoles: [OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
    }),
    t(QuoteStatus.REVIEWING, QuoteStatus.CANCELLED, 'Cancel quote', {
      allowedRoles: [OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
    }),

    // Sent → Expired (timeout)
    t(QuoteStatus.SENT, QuoteStatus.EXPIRED, 'Quote expired', {
      events: [{ type: 'quote.expired', payload: {} }],
      timeout: { delayMs: 30 * 24 * 60 * 60 * 1000, targetState: QuoteStatus.EXPIRED },
    }),

    // Any non-terminal → Revised (creates new version)
    t(QuoteStatus.DRAFT, QuoteStatus.REVISED, 'Revise quote', {
      allowedRoles: [OrgRole.SALES, OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'quote.revised', payload: {} }],
      actions: [{ type: 'create_quote_version', payload: {} }],
    }),
    t(QuoteStatus.READY, QuoteStatus.REVISED, 'Revise quote', {
      allowedRoles: [OrgRole.SALES, OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'quote.revised', payload: {} }],
      actions: [{ type: 'create_quote_version', payload: {} }],
    }),
    t(QuoteStatus.SENT, QuoteStatus.REVISED, 'Revise quote', {
      allowedRoles: [OrgRole.SALES, OrgRole.MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
      events: [{ type: 'quote.revised', payload: {} }],
      actions: [{ type: 'create_quote_version', payload: {} }],
    }),
  ],
}
