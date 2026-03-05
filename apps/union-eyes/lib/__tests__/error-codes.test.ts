/**
 * Unit Tests — lib/error-codes.ts
 *
 * Validates stable error codes and the actionError helper.
 */
import { describe, it, expect } from 'vitest';
import { ErrorCode, actionError, type ErrorCodeValue } from '@/lib/error-codes';

describe('ErrorCode', () => {
  it('has no duplicate values', () => {
    const values = Object.values(ErrorCode);
    expect(new Set(values).size).toBe(values.length);
  });

  it('every value matches its key (DOMAIN_VERB_REASON format)', () => {
    for (const [key, value] of Object.entries(ErrorCode)) {
      expect(value).toBe(key);
    }
  });

  it('includes critical auth codes', () => {
    expect(ErrorCode.AUTH_UNAUTHORIZED).toBeDefined();
    expect(ErrorCode.AUTH_FORBIDDEN).toBeDefined();
  });

  it('includes validation codes', () => {
    expect(ErrorCode.VALIDATION_INVALID_INPUT).toBeDefined();
    expect(ErrorCode.VALIDATION_MISSING_FIELD).toBeDefined();
  });
});

describe('actionError', () => {
  it('builds a standard error payload', () => {
    const result = actionError(ErrorCode.AUTH_UNAUTHORIZED, 'Not logged in');
    expect(result).toEqual({
      isSuccess: false,
      code: 'AUTH_UNAUTHORIZED',
      message: 'Not logged in',
    });
  });

  it('includes optional meta', () => {
    const result = actionError(ErrorCode.CLAIM_NOT_FOUND, 'Gone', { claimId: '123' });
    expect(result.meta).toEqual({ claimId: '123' });
  });

  it('omits meta when not provided', () => {
    const result = actionError(ErrorCode.INTERNAL_ERROR, 'boom');
    expect(result).not.toHaveProperty('meta');
  });

  it('isSuccess is always false', () => {
    const result = actionError(ErrorCode.CREDITS_EXHAUSTED, 'no credits');
    expect(result.isSuccess).toBe(false);
  });

  it('type-checks — rejects invalid codes', () => {
    // This is a compile-time check; at runtime we just verify the shape
    const code: ErrorCodeValue = ErrorCode.RATE_LIMIT_EXCEEDED;
    const result = actionError(code, 'slow down');
    expect(result.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
