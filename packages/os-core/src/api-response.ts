/**
 * @nzila/os-core — Standardized API Response Envelope
 *
 * All NzilaOS API routes SHOULD use these helpers to produce consistent
 * response shapes. This ensures uniform error handling, request tracing,
 * and structured logging across the entire platform.
 *
 * Standard envelope shape:
 *   Success: { data, meta }
 *   Error:   { error: { code, message, details? }, meta }
 *
 * `meta` always includes requestId and timestamp for traceability.
 */

import { ZodError } from 'zod'

// ── Types ───────────────────────────────────────────────────────────────────

export interface ApiMeta {
  requestId: string
  timestamp: string
}

export interface ApiSuccessResponse<T = unknown> {
  data: T
  meta: ApiMeta
}

export interface ApiErrorDetail {
  code: string
  message: string
  details?: unknown
}

export interface ApiErrorResponse {
  error: ApiErrorDetail
  meta: ApiMeta
}

/**
 * Well-known error codes used across the platform.
 */
export const ApiErrorCode = {
  // Client errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  IDEMPOTENCY_KEY_REQUIRED: 'IDEMPOTENCY_KEY_REQUIRED',
  BUDGET_EXCEEDED: 'BUDGET_EXCEEDED',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  UPSTREAM_ERROR: 'UPSTREAM_ERROR',
} as const

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode]

// ── Typed API Error ─────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, ApiErrorCode.VALIDATION_ERROR, message, details)
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, ApiErrorCode.UNAUTHORIZED, message)
  }

  static forbidden(message = 'Access denied') {
    return new ApiError(403, ApiErrorCode.FORBIDDEN, message)
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, ApiErrorCode.NOT_FOUND, message)
  }

  static conflict(message: string) {
    return new ApiError(409, ApiErrorCode.CONFLICT, message)
  }

  static fromZodError(err: ZodError) {
    return new ApiError(
      400,
      ApiErrorCode.VALIDATION_ERROR,
      'Request validation failed',
      err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    )
  }
}

// ── Response Builders ───────────────────────────────────────────────────────

function buildMeta(requestId?: string): ApiMeta {
  return {
    requestId: requestId ?? 'unknown',
    timestamp: new Date().toISOString(),
  }
}

export function apiSuccess<T>(
  data: T,
  requestId?: string,
): ApiSuccessResponse<T> {
  return { data, meta: buildMeta(requestId) }
}

export function apiError(
  code: string,
  message: string,
  requestId?: string,
  details?: unknown,
): ApiErrorResponse {
  return {
    error: { code, message, ...(details !== undefined && { details }) },
    meta: buildMeta(requestId),
  }
}
