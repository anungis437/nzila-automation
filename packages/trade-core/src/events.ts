/**
 * @nzila/trade-core — Trade domain event types
 */

export const TradeEventTypes = {
  // Deal events
  DEAL_CREATED: 'trade.deal.created',
  DEAL_QUALIFIED: 'trade.deal.qualified',
  DEAL_FUNDED: 'trade.deal.funded',
  DEAL_CANCELLED: 'trade.deal.cancelled',

  // Quote events
  QUOTE_CREATED: 'trade.quote.created',
  QUOTE_SENT: 'trade.quote.sent',
  QUOTE_ACCEPTED: 'trade.quote.accepted',
  QUOTE_DECLINED: 'trade.quote.declined',

  // Shipment events
  SHIPMENT_CREATED: 'trade.shipment.created',
  SHIPMENT_MILESTONE: 'trade.shipment.milestone',
  SHIPMENT_DELIVERED: 'trade.shipment.delivered',

  // Document events
  DOCUMENT_UPLOADED: 'trade.document.uploaded',

  // Commission events
  COMMISSION_CREATED: 'trade.commission.created',
  COMMISSION_FINALIZED: 'trade.commission.finalized',

  // Party events
  PARTY_CREATED: 'trade.party.created',

  // Listing events
  LISTING_CREATED: 'trade.listing.created',
  LISTING_UPDATED: 'trade.listing.updated',
} as const

export type TradeEventType = (typeof TradeEventTypes)[keyof typeof TradeEventTypes]

export interface TradeDomainEvent<TPayload = Record<string, unknown>> {
  readonly id: string
  readonly type: TradeEventType
  readonly payload: TPayload
  readonly metadata: {
    readonly entityId: string
    readonly actorId: string
    readonly correlationId: string
    readonly causationId?: string
    readonly source: string
  }
  readonly createdAt: Date
}
