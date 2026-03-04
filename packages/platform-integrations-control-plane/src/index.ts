/**
 * @nzila/platform-integrations-control-plane
 *
 * Platform-level integration management: registry, webhook verification,
 * DLQ management, rate limiting, and dashboard.
 *
 * @module @nzila/platform-integrations-control-plane
 */
export type {
  ProviderHealth,
  ProviderStatus,
  DlqEntry,
  DlqReplayResult,
  WebhookVerificationResult,
  RateLimitConfig,
  RateLimitStatus,
  IntegrationDashboardSummary,
  WebhookPayload,
  DlqReplayRequest,
} from './types'

export {
  webhookPayloadSchema,
  dlqReplayRequestSchema,
  rateLimitConfigSchema,
} from './types'

export { ProviderRegistry } from './registry'
export type { RegistryPorts } from './registry'

export { verifyWebhookSignature, computeHmacSha256 } from './webhook-verify'
export type { WebhookVerifyOptions } from './webhook-verify'

export { DlqManager } from './dlq'
export type { DlqPorts } from './dlq'

export { IntegrationRateLimiter } from './rate-limiter'

export { buildDashboardSummary } from './dashboard'
export type { DashboardPorts } from './dashboard'
