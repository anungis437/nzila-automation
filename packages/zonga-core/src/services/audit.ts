/**
 * @nzila/zonga-core — Audit Event Builders
 *
 * Pure functions for building Zonga-specific audit events.
 * No I/O — caller persists.
 *
 * @module @nzila/zonga-core/services
 */

export interface ZongaAuditEvent {
  readonly entityId: string
  readonly actorId: string
  readonly action: ZongaAuditAction
  readonly entityType: ZongaEntityType
  readonly targetId: string
  readonly metadata: Readonly<Record<string, unknown>>
  readonly timestamp: string
}

export const ZongaAuditAction = {
  CONTENT_PUBLISH: 'content.publish',
  CONTENT_TAKE_DOWN: 'content.take_down',
  CONTENT_UPLOAD: 'content.upload',
  REVENUE_IMPORT: 'revenue.import',
  REVENUE_RECORD: 'revenue.record',
  PAYOUT_PREVIEW: 'payout.preview',
  PAYOUT_EXECUTE: 'payout.execute',
  PAYOUT_CANCEL: 'payout.cancel',
  CREATOR_ACTIVATE: 'creator.activate',
  CREATOR_SUSPEND: 'creator.suspend',
  CREATOR_UPDATE_PAYOUT: 'creator.update_payout',
  RELEASE_PUBLISH: 'release.publish',
  RELEASE_WITHDRAW: 'release.withdraw',
  RELEASE_SPLIT_UPDATE: 'release.split_update',
} as const
export type ZongaAuditAction = (typeof ZongaAuditAction)[keyof typeof ZongaAuditAction]

export const ZongaEntityType = {
  CREATOR: 'creator',
  CONTENT_ASSET: 'content_asset',
  RELEASE: 'release',
  REVENUE_EVENT: 'revenue_event',
  PAYOUT: 'payout',
} as const
export type ZongaEntityType = (typeof ZongaEntityType)[keyof typeof ZongaEntityType]

/**
 * Build a Zonga audit event. Pure — caller persists.
 */
export function buildZongaAuditEvent(params: {
  entityId: string
  actorId: string
  action: ZongaAuditAction
  entityType: ZongaEntityType
  targetId: string
  metadata?: Record<string, unknown>
}): ZongaAuditEvent {
  return {
    entityId: params.entityId,
    actorId: params.actorId,
    action: params.action,
    entityType: params.entityType,
    targetId: params.targetId,
    metadata: params.metadata ?? {},
    timestamp: new Date().toISOString(),
  }
}
