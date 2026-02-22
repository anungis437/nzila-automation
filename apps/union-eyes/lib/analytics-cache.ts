/**
 * Analytics Cache Service
 * 
 * Provides distributed Redis-based caching layer for analytics queries to improve performance
 * Uses Upstash Redis with TTL (Time To Live) for frequently accessed metrics
 * 
 * Features:
 * - Distributed caching across server instances
 * - Automatic cache invalidation based on TTL
 * - Organization-isolated caching
 * - Cache key generation
 * - Cache statistics
 * 
 * Updated: February 6, 2026 - Migrated from in-memory to Redis
 */

import { Redis } from '@upstash/redis';
import { logger } from './logger';
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

// Initialize Redis client
const redis = (() => {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    // Only warn if we&apos;re not in test/build environment
    if (process.env.NODE_ENV !== 'test' && !process.env.BUILDING) {
      logger.warn('Redis not configured - analytics cache will fail at runtime', {
        component: 'analytics-cache',
        message: 'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN',
      });
    }
    return null;
  }

  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
})();

class AnalyticsCacheService {
  private stats: { hits: number; misses: number };
  private readonly DEFAULT_TTL = 5 * 60; // 5 minutes in seconds (Redis uses seconds)
  private readonly STATS_KEY = 'analytics:cache:stats';
  private statsLoaded: boolean = false;

  constructor() {
    this.stats = { hits: 0, misses: 0 };
    // Load stats asynchronously without blocking constructor
    this.loadStats().catch(err => {
      logger.warn('Failed to load initial cache stats', { error: err.message });
    });
  }

  /**
   * Load stats from Redis
   */
  private async loadStats(): Promise<void> {
    if (!redis || this.statsLoaded) return;
    
    try {
      const stats = await redis.get<{ hits: number; misses: number }>(this.STATS_KEY);
      if (stats) {
        this.stats = stats;
        this.statsLoaded = true;
      }
    } catch (error) {
      logger.error('Failed to load cache stats from Redis', error as Error);
    }
  }

  /**
   * Save stats to Redis
   */
  private async saveStats(): Promise<void> {
    if (!redis) return;
    
    try {
      await redis.set(this.STATS_KEY, this.stats, { ex: 86400 }); // 24 hours
    } catch (error) {
      logger.error('Failed to save cache stats to Redis', error as Error);
    }
  }

  /**
  * Generate cache key from organization, endpoint, and parameters
   */
  private generateKey(
    organizationId: string,
    endpoint: string,
    params: Record<string, unknown> = {}
  ): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return `analytics:cache:${organizationId}:${endpoint}:${sortedParams}`;
  }

  /**
   * Get cached data if available and valid
   */
  async get<T>(
    organizationId: string,
    endpoint: string,
    params: Record<string, unknown> = {}
  ): Promise<T | null> {
    if (!redis) {
      logger.warn('Redis not configured - cache miss', { component: 'analytics-cache' });
      this.stats.misses++;
      return null;
    }
    
    const key = this.generateKey(organizationId, endpoint, params);
    
    try {
      const entry = await redis.get<CacheEntry<T>>(key);

      if (!entry) {
        this.stats.misses++;
        await this.saveStats();
        return null;
      }

      // Redis TTL handles expiration automatically, so if we got data, it&apos;s valid
      entry.hits++;
      this.stats.hits++;
      
      // Update hit count in Redis
      await redis.set(key, entry, { ex: entry.ttl });
      await this.saveStats();
      
      return entry.data as T;
    } catch (error) {
      logger.error('Redis cache get failed', error as Error, { key });
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Store data in cache with automatic TTL expiration
   */
  async set<T>(
    organizationId: string,
    endpoint: string,
    data: T,
    params: Record<string, unknown> = {},
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    if (!redis) {
      logger.warn('Redis not configured - cache set skipped', { component: 'analytics-cache' });
      return;
    }
    
    const key = this.generateKey(organizationId, endpoint, params);
    
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        hits: 0,
      };
      
      // Set with expiration in seconds
      await redis.set(key, entry, { ex: ttl });
    } catch (error) {
      logger.error('Redis cache set failed', error as Error, { key });
    }
  }

  /**
  * Invalidate cache for specific endpoint or all organization data
   */
  async invalidate(organizationId: string, endpoint?: string): Promise<void> {
    if (!redis) {
      logger.warn('Redis not configured - invalidate skipped', { component: 'analytics-cache' });
      return;
    }
    
    try {
      const pattern = endpoint 
        ? `analytics:cache:${organizationId}:${endpoint}:*`
        : `analytics:cache:${organizationId}:*`;
      
      // Use SCAN to find and delete matching keys
      const keys = await redis.keys(pattern);
      
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info('Cache invalidated', { organizationId, endpoint, keysDeleted: keys.length });
      }
    } catch (error) {
      logger.error('Redis cache invalidation failed', error as Error, { organizationId, endpoint });
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    if (!redis) {
      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        size: 0,
        hitRate: 0,
      };
    }
    
    try {
      // Get approximate size using DBSIZE (includes all keys, not just analytics)
      // For accurate count, we&apos;d need to SCAN all analytics:cache:* keys
      const allKeys = await redis.keys('analytics:cache:*');
      const size = allKeys.length;
      
      const totalRequests = this.stats.hits + this.stats.misses;
      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        size,
        hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      };
    } catch (error) {
      logger.error('Failed to get cache stats', error as Error);
      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        size: 0,
        hitRate: 0,
      };
    }
  }

  /**
   * Clear all analytics cache
   */
  async clear(): Promise<void> {
    if (!redis) {
      logger.warn('Redis not configured - clear skipped', { component: 'analytics-cache' });
      return;
    }
    
    try {
      const keys = await redis.keys('analytics:cache:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      this.stats = { hits: 0, misses: 0 };
      await redis.del(this.STATS_KEY);
      logger.info('Analytics cache cleared', { keysDeleted: keys.length });
    } catch (error) {
      logger.error('Failed to clear cache', error as Error);
    }
  }

  /**
   * Get cache size
   */
  async size(): Promise<number> {
    if (!redis) {
      return 0;
    }
    
    try {
      const keys = await redis.keys('analytics:cache:*');
      return keys.length;
    } catch (error) {
      logger.error('Failed to get cache size', error as Error);
      return 0;
    }
  }
}

// Singleton instance
export const analyticsCache = new AnalyticsCacheService();

/**
 * Cached wrapper for analytics queries
 * 
 * Usage:
 * const data = await withCache(
 *   organizationId,
 *   'claims',
 *   { days: 30 },
 *   () => fetchClaimsAnalytics(organizationId, 30)
 * );
 */
export async function withCache<T>(
  organizationId: string,
  endpoint: string,
  params: Record<string, unknown>,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache
  const cached = await analyticsCache.get<T>(organizationId, endpoint, params);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();
  
  // Store in cache
  await analyticsCache.set(organizationId, endpoint, data, params, ttl);
  
  return data;
}

/**
 * Invalidate analytics cache when data changes
 * Call this after creating/updating/deleting claims
 */
export async function invalidateAnalyticsCache(organizationId: string): Promise<void> {
  await analyticsCache.invalidate(organizationId);
}

/**
 * Get analytics cache statistics
 */
export async function getAnalyticsCacheStats(): Promise<CacheStats> {
  return analyticsCache.getStats();
}

