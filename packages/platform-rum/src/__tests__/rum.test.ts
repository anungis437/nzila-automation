/**
 * @nzila/platform-rum — Web Vitals + Reporter tests
 */

import { describe, it, expect } from 'vitest';
import { WEB_VITAL_THRESHOLDS, RUMEventSchema, WebVitalMetricSchema } from '../types.js';
import { processRUMBatch, isRUMHealthy } from '../reporter.js';

describe('@nzila/platform-rum', () => {
  describe('WebVitalMetricSchema', () => {
    it('validates a valid CLS metric', () => {
      const metric = {
        name: 'CLS',
        value: 0.05,
        rating: 'good',
        delta: 0.05,
        id: 'v4-1234',
      };
      expect(WebVitalMetricSchema.parse(metric)).toEqual(metric);
    });

    it('rejects invalid metric name', () => {
      expect(() =>
        WebVitalMetricSchema.parse({ name: 'INVALID', value: 0, rating: 'good', delta: 0, id: 'x' }),
      ).toThrow();
    });
  });

  describe('RUMEventSchema', () => {
    it('validates a full RUM event', () => {
      const event = {
        metric: { name: 'LCP', value: 2000, rating: 'good', delta: 2000, id: 'v4-5678' },
        pathname: '/dashboard',
        orgId: 'org_123',
        timestamp: new Date(),
        appName: 'console',
        environment: 'development',
      };
      expect(() => RUMEventSchema.parse(event)).not.toThrow();
    });

    it('validates without optional fields', () => {
      const event = {
        metric: { name: 'FCP', value: 1500, rating: 'good', delta: 1500, id: 'v4-9012' },
        pathname: '/',
        timestamp: new Date(),
        appName: 'web',
        environment: 'production',
      };
      expect(() => RUMEventSchema.parse(event)).not.toThrow();
    });
  });

  describe('WEB_VITAL_THRESHOLDS', () => {
    it('defines thresholds for all 6 Core Web Vitals', () => {
      expect(Object.keys(WEB_VITAL_THRESHOLDS)).toEqual(['CLS', 'FID', 'FCP', 'INP', 'LCP', 'TTFB']);
    });

    it('has good < poor for all metrics', () => {
      for (const [, thresh] of Object.entries(WEB_VITAL_THRESHOLDS)) {
        expect(thresh.good).toBeLessThan(thresh.poor);
      }
    });
  });

  describe('processRUMBatch', () => {
    it('processes valid events', async () => {
      const events = [
        {
          metric: { name: 'LCP', value: 2000, rating: 'good', delta: 2000, id: 'v4-a' },
          pathname: '/',
          timestamp: new Date().toISOString(),
          appName: 'web',
          environment: 'development',
        },
        {
          metric: { name: 'LCP', value: 5000, rating: 'poor', delta: 5000, id: 'v4-b' },
          pathname: '/about',
          timestamp: new Date().toISOString(),
          appName: 'web',
          environment: 'development',
        },
      ];
      const summary = await processRUMBatch(events);
      expect(summary.received).toBe(2);
      expect(summary.valid).toBe(2);
      expect(summary.invalid).toBe(0);
      expect(summary.byMetric['LCP']?.count).toBe(2);
      expect(summary.byMetric['LCP']?.poorCount).toBe(1);
    });

    it('handles empty array', async () => {
      const summary = await processRUMBatch([]);
      expect(summary.received).toBe(0);
      expect(summary.valid).toBe(0);
    });
  });

  describe('isRUMHealthy', () => {
    it('returns true when poor rate is below threshold', () => {
      const summary = {
        received: 10,
        valid: 10,
        invalid: 0,
        byMetric: { LCP: { count: 10, avgValue: 2000, poorCount: 1 } },
      };
      expect(isRUMHealthy(summary)).toBe(true);
    });

    it('returns false when poor rate exceeds threshold', () => {
      const summary = {
        received: 10,
        valid: 10,
        invalid: 0,
        byMetric: { LCP: { count: 10, avgValue: 5000, poorCount: 5 } },
      };
      expect(isRUMHealthy(summary)).toBe(false);
    });
  });
});
