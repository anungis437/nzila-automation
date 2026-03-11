/**
 * Nzila OS — Integration Runtime: Adapter Schema Validation
 *
 * Validates SendRequest payloads at adapter boundaries before
 * forwarding to provider adapters. Catches malformed inputs early
 * with structured validation errors.
 *
 * @invariant INTEGRATION_SCHEMA_VALIDATION_001
 */
import type { IntegrationAdapter, SendRequest, SendResult, HealthCheckResult } from '@nzila/integrations-core'
import { SendMessageSchema } from '@nzila/integrations-core'
import type { ZodError } from 'zod'

// ── Types ───────────────────────────────────────────────────────────────────

export interface ValidationError {
  readonly field: string
  readonly message: string
  readonly code: string
}

export interface ValidationResult {
  readonly valid: boolean
  readonly errors: readonly ValidationError[]
}

// ── Validation logic ────────────────────────────────────────────────────────

function zodToValidationErrors(zodError: ZodError): readonly ValidationError[] {
  return zodError.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }))
}

export function validateSendRequest(request: SendRequest): ValidationResult {
  const result = SendMessageSchema.safeParse(request)
  if (result.success) {
    return { valid: true, errors: [] }
  }
  return { valid: false, errors: zodToValidationErrors(result.error) }
}

// ── Validated adapter wrapper ───────────────────────────────────────────────

/**
 * Wraps an IntegrationAdapter with schema validation on send requests.
 * Returns an error SendResult (ok: false) if validation fails, without
 * calling the underlying adapter.
 */
export function createValidatedAdapter(inner: IntegrationAdapter): IntegrationAdapter {
  return {
    provider: inner.provider,
    channel: inner.channel,

    async send(request: SendRequest, credentials: Record<string, unknown>): Promise<SendResult> {
      const validation = validateSendRequest(request)
      if (!validation.valid) {
        const fieldErrors = validation.errors.map((e) => `${e.field}: ${e.message}`).join('; ')
        return {
          ok: false,
          error: `Validation failed: ${fieldErrors}`,
        }
      }
      return inner.send(request, credentials)
    },

    async healthCheck(credentials: Record<string, unknown>): Promise<HealthCheckResult> {
      return inner.healthCheck(credentials)
    },
  }
}
