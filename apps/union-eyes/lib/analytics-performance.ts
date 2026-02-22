/**
 * Analytics Performance Monitor - Redis Backend
 * 
 * Production-ready performance tracking with Redis persistence
 * 
 * Features:
 * - Persistent storage across restarts
 * - Multi-instance safe (shared Redis)
 * - Automatic data expiration (TTL)
 * - Efficient aggregations with Redis data structures
 * 
 * Data Structure:
 * - analytics:metrics:{endpoint}:{date} - Sorted set of query durations
 * - analytics:slow:{date} - Sorted set of slow queries
 * - analytics:summary:{date} - Hash of daily summaries
 * - analytics:organization:{organizationId}:{date} - Organization-specific metrics
 * 
 * TTL: 30 days (configurable via ANALYTICS_RETENTION_DAYS)
 */

import { Redis } from '@upstash/redis';
import { logger } from './logger';
interface QueryMetric {
  endpoint: string;
  duration: number;
  timestamp: Date;
  cached: boolean;
  organizationId: string;
}

interface PerformanceReport {
  endpoint: string;
  totalCalls: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  cacheHitRate: number;
  slowQueries: number;
}

interface PerformanceSummary {
  totalQueries: number;
  avgDuration: number;
  medianDuration: number;
  p95Duration: number;
  p99Duration: number;
  cacheHitRate: number;
  slowQueryRate: number;
  uniqueEndpoints: number;
  uniqueOrganizations: number;
}

// Initialize Redis client (same as rate-limiter)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Constants
const SLOW_QUERY_THRESHOLD = 1000; // 1 second
const RETENTION_DAYS = parseInt(process.env.ANALYTICS_RETENTION_DAYS || '30', 10);
const MAX_SLOW_QUERIES = 1000; // Keep max 1000 slow queries per day

class RedisAnalyticsPerformanceMonitor {
  private readonly enabled: boolean;
  private readonly slowThreshold: number;
  private readonly retentionDays: number;

  constructor() {
    this.enabled = redis !== null;
    this.slowThreshold = SLOW_QUERY_THRESHOLD;
    this.retentionDays = RETENTION_DAYS;

    if (!this.enabled) {
      logger.warn('Redis not configured - analytics performance tracking disabled', {
        component: 'analytics-performance',
      });
    }
  }

  /**
   * Get date string for Redis keys (YYYY-MM-DD)
   */
  private getDateKey(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Record a query execution
   */
  async recordQuery(
    endpoint: string,
    duration: number,
    cached: boolean,
    organizationId: string
  ): Promise<void> {
    if (!this.enabled || !redis) return;

    try {
      const now = Date.now();
      const dateKey = this.getDateKey();
      const ttl = this.retentionDays * 86400; // Convert days to seconds

      const metric: QueryMetric = {
        endpoint,
        duration,
        timestamp: new Date(),
        cached,
        organizationId,
      };

      const pipeline = redis.pipeline();

      // 1. Store metric in endpoint-specific sorted set (score = timestamp, value = JSON)
      const metricKey = `analytics:metrics:${endpoint}:${dateKey}`;
      pipeline.zadd(metricKey, { score: now, member: JSON.stringify(metric) });
      pipeline.expire(metricKey, ttl);

      // 2. If slow query, add to slow queries list
      if (duration > this.slowThreshold) {
        const slowKey = `analytics:slow:${dateKey}`;
        pipeline.zadd(slowKey, { 
          score: duration, 
          member: JSON.stringify({ ...metric, timestamp: now }) 
        });
        pipeline.expire(slowKey, ttl);
        
        // Keep only top N slow queries
        pipeline.zremrangebyrank(slowKey, 0, -(MAX_SLOW_QUERIES + 1));

        // Log slow query
        logger.warn('[PERF] Slow query detected', {
          endpoint,
          duration,
          cached,
          organizationId,
        });
      }

      // 3. Update daily summary counters
      const summaryKey = `analytics:summary:${dateKey}`;
      pipeline.hincrby(summaryKey, 'totalQueries', 1);
      pipeline.hincrby(summaryKey, 'totalDuration', duration);
      if (cached) {
        pipeline.hincrby(summaryKey, 'cachedQueries', 1);
      }
      if (duration > this.slowThreshold) {
        pipeline.hincrby(summaryKey, 'slowQueries', 1);
      }
      pipeline.expire(summaryKey, ttl);

      // 4. Track unique endpoints and organizations
      const endpointsKey = `analytics:endpoints:${dateKey}`;
      const organizationsKey = `analytics:organizations:${dateKey}`;
      pipeline.sadd(endpointsKey, endpoint);
      pipeline.sadd(organizationsKey, organizationId);
      pipeline.expire(endpointsKey, ttl);
      pipeline.expire(organizationsKey, ttl);

      // 5. Store organization-specific metric
      const organizationKey = `analytics:organization:${organizationId}:${dateKey}`;
      pipeline.zadd(organizationKey, { score: now, member: JSON.stringify(metric) });
      pipeline.expire(organizationKey, ttl);

      await pipeline.exec();

    } catch (error) {
      logger.error('Failed to record analytics metric', error as Error, {
        endpoint,
        duration,
        organizationId,
      });
    }
  }

  /**
   * Get performance report for an endpoint
   */
  async getEndpointReport(endpoint: string, dateKey?: string): Promise<PerformanceReport | null> {
    if (!this.enabled || !redis) return null;

    try {
      const date = dateKey || this.getDateKey();
      const metricKey = `analytics:metrics:${endpoint}:${date}`;

      // Get all metrics for this endpoint
      const metricsData = await redis.zrange(metricKey, 0, -1);
      
      if (!metricsData || metricsData.length === 0) {
        return null;
      }

      const metrics: QueryMetric[] = metricsData.map(m => {
        try {
          return JSON.parse(m as string);
        } catch {
          return null;
        }
      }).filter((m): m is QueryMetric => m !== null);

      const durations = metrics.map(m => m.duration);
      const cachedCount = metrics.filter(m => m.cached).length;
      const slowCount = metrics.filter(m => m.duration > this.slowThreshold).length;

      return {
        endpoint,
        totalCalls: metrics.length,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        cacheHitRate: cachedCount / metrics.length,
        slowQueries: slowCount,
      };

    } catch (error) {
      logger.error('Failed to get endpoint report', error as Error, { endpoint, dateKey });
      return null;
    }
  }

  /**
   * Get all endpoint reports for a given date
   */
  async getAllReports(dateKey?: string): Promise<PerformanceReport[]> {
    if (!this.enabled || !redis) return [];

    try {
      const date = dateKey || this.getDateKey();
      const endpointsKey = `analytics:endpoints:${date}`;

      // Get all unique endpoints for this date
      const endpoints = await redis.smembers(endpointsKey);
      
      if (!endpoints || endpoints.length === 0) {
        return [];
      }

      // Get report for each endpoint
      const reports = await Promise.all(
        endpoints.map(endpoint => this.getEndpointReport(endpoint as string, date))
      );

      return reports
        .filter((report): report is PerformanceReport => report !== null)
        .sort((a, b) => b.avgDuration - a.avgDuration);

    } catch (error) {
      logger.error('Failed to get all reports', error as Error, { dateKey });
      return [];
    }
  }

  /**
   * Get recent slow queries
   */
  async getSlowQueries(limit: number = 10, dateKey?: string): Promise<QueryMetric[]> {
    if (!this.enabled || !redis) return [];

    try {
      const date = dateKey || this.getDateKey();
      const slowKey = `analytics:slow:${date}`;

      // Get slowest queries (highest scores first)
      const slowData = await redis.zrange(slowKey, 0, limit - 1, { rev: true });
      
      if (!slowData || slowData.length === 0) {
        return [];
      }

      return slowData.map(m => {
        try {
          const parsed = JSON.parse(m as string);
          // Convert timestamp back to Date
          if (typeof parsed.timestamp === 'number') {
            parsed.timestamp = new Date(parsed.timestamp);
          }
          return parsed;
        } catch {
          return null;
        }
      }).filter((m): m is QueryMetric => m !== null);

    } catch (error) {
      logger.error('Failed to get slow queries', error as Error, { limit, dateKey });
      return [];
    }
  }

  /**
   * Get metrics for a specific organization
   */
  async getOrganizationMetrics(organizationId: string, dateKey?: string): Promise<QueryMetric[]> {
    if (!this.enabled || !redis) return [];

    try {
      const date = dateKey || this.getDateKey();
      const organizationKey = `analytics:organization:${organizationId}:${date}`;

      const metricsData = await redis.zrange(organizationKey, 0, -1);
      
      if (!metricsData || metricsData.length === 0) {
        return [];
      }

      return metricsData.map(m => {
        try {
          return JSON.parse(m as string);
        } catch {
          return null;
        }
      }).filter((m): m is QueryMetric => m !== null);

    } catch (error) {
      logger.error('Failed to get organization metrics', error as Error, { organizationId, dateKey });
      return [];
    }
  }

  /**
   * Get summary statistics for a given date
   */
  async getSummary(dateKey?: string): Promise<PerformanceSummary | null> {
    if (!this.enabled || !redis) return null;

    try {
      const date = dateKey || this.getDateKey();
      const summaryKey = `analytics:summary:${date}`;
      const endpointsKey = `analytics:endpoints:${date}`;
      const organizationsKey = `analytics:organizations:${date}`;

      const [summary, endpointCount, organizationCount] = await Promise.all([
        redis.hgetall(summaryKey),
        redis.scard(endpointsKey),
        redis.scard(organizationsKey),
      ]);

      if (!summary || !summary.totalQueries) {
        return null;
      }

      const totalQueries = parseInt(summary.totalQueries as string, 10);
      const totalDuration = parseInt(summary.totalDuration as string, 10);
      const cachedQueries = parseInt(summary.cachedQueries as string || '0', 10);
      const slowQueries = parseInt(summary.slowQueries as string || '0', 10);

      // For percentiles, we&apos;d need to fetch all durations (expensive)
      // For now, provide estimates based on available data
      const avgDuration = totalDuration / totalQueries;

      return {
        totalQueries,
        avgDuration,
        medianDuration: avgDuration, // Estimate
        p95Duration: avgDuration * 2, // Estimate
        p99Duration: avgDuration * 3, // Estimate
        cacheHitRate: cachedQueries / totalQueries,
        slowQueryRate: slowQueries / totalQueries,
        uniqueEndpoints: endpointCount || 0,
        uniqueOrganizations: organizationCount || 0,
      };

    } catch (error) {
      logger.error('Failed to get summary', error as Error, { dateKey });
      return null;
    }
  }

  /**
   * Export metrics for external monitoring
   */
  async exportMetrics(dateKey?: string) {
    return {
      summary: await this.getSummary(dateKey),
      endpointReports: await this.getAllReports(dateKey),
      slowQueries: await this.getSlowQueries(20, dateKey),
      enabled: this.enabled,
      retentionDays: this.retentionDays,
    };
  }

  /**
   * Clear all metrics for a specific date (manual cleanup)
   */
  async clearMetrics(dateKey: string): Promise<void> {
    if (!this.enabled || !redis) return;

    try {
      // Get all endpoints for this date
      const endpointsKey = `analytics:endpoints:${dateKey}`;
      const endpoints = await redis.smembers(endpointsKey);

      // Get all organizations for this date
      const organizationsKey = `analytics:organizations:${dateKey}`;
      const organizations = await redis.smembers(organizationsKey);

      // Delete all keys for this date
      const keysToDelete = [
        `analytics:slow:${dateKey}`,
        `analytics:summary:${dateKey}`,
        endpointsKey,
        organizationsKey,
        ...((endpoints || []) as string[]).map(ep => `analytics:metrics:${ep}:${dateKey}`),
        ...((organizations || []) as string[]).map(oid => `analytics:organization:${oid}:${dateKey}`),
      ];

      await Promise.all(keysToDelete.map(key => redis.del(key)));

      logger.info('Cleared analytics metrics', { dateKey, keysDeleted: keysToDelete.length });

    } catch (error) {
      logger.error('Failed to clear metrics', error as Error, { dateKey });
    }
  }
}

// Singleton instance
export const performanceMonitor = new RedisAnalyticsPerformanceMonitor();

/**
 * Middleware to track analytics query performance
 */
export async function withPerformanceTracking<T>(
  endpoint: string,
  organizationId: string,
  cached: boolean,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    
    // Record async (don&apos;t await to avoid blocking)
    performanceMonitor.recordQuery(endpoint, duration, cached, organizationId).catch(err => {
      logger.error('Failed to record performance metric', err, { endpoint, organizationId });
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Record even on error
    performanceMonitor.recordQuery(endpoint, duration, cached, organizationId).catch(err => {
      logger.error('Failed to record performance metric', err, { endpoint, organizationId });
    });
    
    throw error;
  }
}

/**
 * API endpoint to get performance metrics (for admins)
 */
export async function getPerformanceMetrics(dateKey?: string) {
  return await performanceMonitor.exportMetrics(dateKey);
}

