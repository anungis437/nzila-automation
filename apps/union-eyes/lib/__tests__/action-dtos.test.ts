/**
 * Unit Tests — types/action-dtos.ts
 *
 * Tests Zod schemas for action layer DTOs/inputs.
 * Ensures all external inputs are validated before processing.
 */
import { describe, it, expect } from 'vitest';
import {
  UserRoleSchema,
  CreateOrgInputSchema,
  UpdateOrgInputSchema,
  UpdateRoleInputSchema,
  UpdateConfigInputSchema,
  PremiumFeatureOptionsSchema,
  RecordMetricInputSchema,
  DateRangeSchema,
  CreateSegmentInputSchema,
  WhopWebhookPayloadSchema,
} from '@/types/action-dtos';

describe('UserRoleSchema', () => {
  it.each(['member', 'steward', 'officer', 'admin'])('accepts "%s"', (role) => {
    expect(UserRoleSchema.parse(role)).toBe(role);
  });

  it('rejects invalid roles', () => {
    expect(() => UserRoleSchema.parse('superadmin')).toThrow();
  });
});

describe('CreateOrgInputSchema', () => {
  const valid = {
    slug: 'cape-acep',
    name: 'CAPE-ACEP',
    email: 'admin@cape-acep.ca',
  };

  it('accepts valid input', () => {
    expect(() => CreateOrgInputSchema.parse(valid)).not.toThrow();
  });

  it('rejects missing email', () => {
    expect(() => CreateOrgInputSchema.parse({ slug: 'x', name: 'X' })).toThrow();
  });

  it('rejects invalid email', () => {
    expect(() =>
      CreateOrgInputSchema.parse({ ...valid, email: 'not-email' }),
    ).toThrow();
  });

  it('allows optional subscriptionTier', () => {
    const result = CreateOrgInputSchema.parse({ ...valid, subscriptionTier: 'pro' });
    expect(result.subscriptionTier).toBe('pro');
  });
});

describe('UpdateOrgInputSchema', () => {
  it('accepts partial updates', () => {
    expect(() => UpdateOrgInputSchema.parse({ name: 'New Name' })).not.toThrow();
  });

  it('accepts empty object (all fields optional)', () => {
    expect(() => UpdateOrgInputSchema.parse({})).not.toThrow();
  });
});

describe('UpdateRoleInputSchema', () => {
  it('accepts valid role update', () => {
    const result = UpdateRoleInputSchema.parse({
      userId: 'user_123',
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
      newRole: 'steward',
    });
    expect(result.newRole).toBe('steward');
  });

  it('rejects non-UUID organizationId', () => {
    expect(() =>
      UpdateRoleInputSchema.parse({
        userId: 'user_123',
        organizationId: 'bad-id',
        newRole: 'admin',
      }),
    ).toThrow();
  });
});

describe('UpdateConfigInputSchema', () => {
  it('accepts unknown value types', () => {
    const result = UpdateConfigInputSchema.parse({
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
      category: 'email',
      key: 'smtp_host',
      value: 'smtp.example.com',
    });
    expect(result.value).toBe('smtp.example.com');
  });

  it('accepts nested object values', () => {
    expect(() =>
      UpdateConfigInputSchema.parse({
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        category: 'feature_flags',
        key: 'ab_testing',
        value: { enabled: true, percentage: 50 },
      }),
    ).not.toThrow();
  });
});

describe('PremiumFeatureOptionsSchema', () => {
  it('accepts valid options', () => {
    const result = PremiumFeatureOptionsSchema.parse({
      creditsRequired: 5,
      featureName: 'AI Image Generation',
    });
    expect(result.creditsRequired).toBe(5);
  });

  it('rejects negative credits', () => {
    expect(() =>
      PremiumFeatureOptionsSchema.parse({ creditsRequired: -1, featureName: 'X' }),
    ).toThrow();
  });

  it('rejects empty featureName', () => {
    expect(() =>
      PremiumFeatureOptionsSchema.parse({ creditsRequired: 1, featureName: '' }),
    ).toThrow();
  });
});

describe('RecordMetricInputSchema', () => {
  it('accepts valid metric', () => {
    const result = RecordMetricInputSchema.parse({
      metricName: 'page_views',
      metricValue: 42,
    });
    expect(result.metricName).toBe('page_views');
  });

  it('accepts optional metadata', () => {
    const result = RecordMetricInputSchema.parse({
      metricName: 'events',
      metricValue: 100,
      metadata: { source: 'api' },
    });
    expect(result.metadata).toEqual({ source: 'api' });
  });
});

describe('DateRangeSchema', () => {
  it('accepts valid date range', () => {
    const result = DateRangeSchema.parse({
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-03-01T00:00:00.000Z',
    });
    expect(result.startDate).toBeDefined();
  });

  it('rejects non-datetime strings', () => {
    expect(() =>
      DateRangeSchema.parse({ startDate: 'not-a-date' }),
    ).toThrow();
  });
});

describe('CreateSegmentInputSchema', () => {
  it('accepts valid segment', () => {
    const result = CreateSegmentInputSchema.parse({
      name: 'New Members',
      criteria: { joinedAfter: '2025-01-01' },
    });
    expect(result.name).toBe('New Members');
  });

  it('rejects empty name', () => {
    expect(() =>
      CreateSegmentInputSchema.parse({ name: '', criteria: {} }),
    ).toThrow();
  });
});

describe('WhopWebhookPayloadSchema', () => {
  it('accepts valid webhook payload', () => {
    const result = WhopWebhookPayloadSchema.parse({
      event: 'membership.created',
      data: { userId: '123', plan: 'pro' },
    });
    expect(result.event).toBe('membership.created');
  });

  it('rejects missing event', () => {
    expect(() =>
      WhopWebhookPayloadSchema.parse({ data: {} }),
    ).toThrow();
  });
});
