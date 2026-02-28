/**
 * @nzila/trade-core — Deal State Machine Definition
 *
 * Declarative FSM definition for the trade deal pipeline:
 * lead → qualified → quoted → accepted → funded → shipped → delivered → closed
 *
 * Evidence packs required at: accepted, shipped, closed
 */

import { TradeDealStage, TradeOrgRole } from '../enums'
import type { TradeDealMachine, TradeDealTransitionDef } from './engine'

function t(
  from: TradeDealStage,
  to: TradeDealStage,
  opts: Partial<Omit<TradeDealTransitionDef, 'from' | 'to'>> = {},
): TradeDealTransitionDef {
  return {
    from,
    to,
    allowedRoles: opts.allowedRoles ?? [TradeOrgRole.ADMIN],
    guards: opts.guards ?? [],
    events: opts.events ?? [],
    actions: opts.actions ?? [],
    label: opts.label ?? `${from} → ${to}`,
    evidenceRequired: opts.evidenceRequired ?? false,
  }
}

export const tradeDealMachine: TradeDealMachine = {
  name: 'trade_deal',
  states: [
    TradeDealStage.LEAD,
    TradeDealStage.QUALIFIED,
    TradeDealStage.QUOTED,
    TradeDealStage.ACCEPTED,
    TradeDealStage.FUNDED,
    TradeDealStage.SHIPPED,
    TradeDealStage.DELIVERED,
    TradeDealStage.CLOSED,
    TradeDealStage.CANCELLED,
  ],
  initialState: TradeDealStage.LEAD,
  terminalStates: [TradeDealStage.CLOSED, TradeDealStage.CANCELLED],
  transitions: [
    // ── Main pipeline ───────────────────────────────────────────────
    t(TradeDealStage.LEAD, TradeDealStage.QUALIFIED, {
      allowedRoles: [TradeOrgRole.ADMIN, TradeOrgRole.SELLER, TradeOrgRole.BROKER],
      label: 'Qualify lead',
      events: [{ type: 'trade.deal.qualified' }],
    }),

    t(TradeDealStage.QUALIFIED, TradeDealStage.QUOTED, {
      allowedRoles: [TradeOrgRole.ADMIN, TradeOrgRole.SELLER],
      label: 'Generate quote',
      events: [{ type: 'trade.quote.sent' }],
      actions: [{ type: 'create_quote_for_deal' }],
    }),

    t(TradeDealStage.QUOTED, TradeDealStage.ACCEPTED, {
      allowedRoles: [TradeOrgRole.ADMIN, TradeOrgRole.BUYER],
      label: 'Accept quote',
      evidenceRequired: true, // quote_acceptance_pack
      events: [{ type: 'trade.quote.accepted' }],
    }),

    t(TradeDealStage.ACCEPTED, TradeDealStage.FUNDED, {
      allowedRoles: [TradeOrgRole.ADMIN, TradeOrgRole.SELLER],
      label: 'Confirm funding',
      events: [{ type: 'trade.deal.funded' }],
    }),

    t(TradeDealStage.FUNDED, TradeDealStage.SHIPPED, {
      allowedRoles: [TradeOrgRole.ADMIN, TradeOrgRole.SELLER],
      label: 'Ship goods',
      evidenceRequired: true, // shipment_docs_pack
      events: [{ type: 'trade.shipment.milestone', payload: { milestone: 'shipped' } }],
      actions: [{ type: 'create_shipment_for_deal' }],
    }),

    t(TradeDealStage.SHIPPED, TradeDealStage.DELIVERED, {
      allowedRoles: [TradeOrgRole.ADMIN, TradeOrgRole.SELLER, TradeOrgRole.BUYER],
      label: 'Confirm delivery',
      events: [{ type: 'trade.shipment.milestone', payload: { milestone: 'delivered' } }],
    }),

    t(TradeDealStage.DELIVERED, TradeDealStage.CLOSED, {
      allowedRoles: [TradeOrgRole.ADMIN],
      label: 'Close deal',
      evidenceRequired: true, // commission_settlement_pack
      events: [{ type: 'trade.commission.finalized' }],
      actions: [{ type: 'finalize_commission' }],
    }),

    // ── Cancellation (from any non-terminal stage) ──────────────────
    t(TradeDealStage.LEAD, TradeDealStage.CANCELLED, {
      allowedRoles: [TradeOrgRole.ADMIN, TradeOrgRole.SELLER],
      label: 'Cancel lead',
      events: [{ type: 'trade.deal.cancelled' }],
    }),
    t(TradeDealStage.QUALIFIED, TradeDealStage.CANCELLED, {
      allowedRoles: [TradeOrgRole.ADMIN, TradeOrgRole.SELLER],
      label: 'Cancel qualified deal',
      events: [{ type: 'trade.deal.cancelled' }],
    }),
    t(TradeDealStage.QUOTED, TradeDealStage.CANCELLED, {
      allowedRoles: [TradeOrgRole.ADMIN, TradeOrgRole.SELLER, TradeOrgRole.BUYER],
      label: 'Cancel quoted deal',
      events: [{ type: 'trade.deal.cancelled' }],
    }),
    t(TradeDealStage.ACCEPTED, TradeDealStage.CANCELLED, {
      allowedRoles: [TradeOrgRole.ADMIN],
      label: 'Cancel accepted deal',
      events: [{ type: 'trade.deal.cancelled' }],
    }),
    t(TradeDealStage.FUNDED, TradeDealStage.CANCELLED, {
      allowedRoles: [TradeOrgRole.ADMIN],
      label: 'Cancel funded deal',
      events: [{ type: 'trade.deal.cancelled' }],
    }),
  ],
}
