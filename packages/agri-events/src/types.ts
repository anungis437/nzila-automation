import type { AgriEventType } from './event-types'

export interface AgriDomainEvent<TPayload = Record<string, unknown>> {
  readonly id: string
  readonly type: AgriEventType
  readonly payload: Readonly<TPayload>
  readonly metadata: AgriEventMetadata
  readonly createdAt: string
}

export interface AgriEventMetadata {
  readonly orgId: string
  readonly actorId: string
  readonly correlationId: string
  readonly causationId: string | null
  readonly source: string
}

export type AgriOutboxStatus = 'pending' | 'dispatched' | 'failed'

export interface AgriOutboxRecord<TPayload = Record<string, unknown>> {
  readonly id: string
  readonly event: AgriDomainEvent<TPayload>
  readonly status: AgriOutboxStatus
  readonly retryCount: number
  readonly maxRetries: number
  readonly lastError: string | null
  readonly createdAt: string
  readonly dispatchedAt: string | null
}

export type AgriEventHandler<TPayload = Record<string, unknown>> = (
  event: AgriDomainEvent<TPayload>,
) => void | Promise<void>

export type Unsubscribe = () => void

export interface AgriEventBus {
  on<TPayload>(eventType: AgriEventType, handler: AgriEventHandler<TPayload>): Unsubscribe
  onAny(handler: AgriEventHandler): Unsubscribe
  emit(event: AgriDomainEvent): void
  emitAndWait(event: AgriDomainEvent): Promise<void>
  clear(): void
}
