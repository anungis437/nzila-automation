/**
 * @nzila/trade-db — Repository context types
 *
 * Follows the same pattern as @nzila/commerce-db/types.
 */

export interface TradeDbContext {
  /** Org ID — all queries scoped to this entity */
  readonly entityId: string
  /** Actor performing the operation */
  readonly actorId: string
}

export interface TradeReadContext {
  /** Org ID — all queries scoped to this entity */
  readonly entityId: string
}
