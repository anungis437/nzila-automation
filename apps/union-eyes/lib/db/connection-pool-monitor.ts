/**
 * Database Connection Pool Monitoring
 * 
 * Monitors PostgreSQL connection pool health, tracks usage patterns,
 * and provides alerts for connection exhaustion or performance issues.
 * 
 * Features:
 * - Real-time connection pool statistics
 * - Connection leak detection
 * - Query timeout enforcement
 * - Automatic pool size recommendations
 * - Integration with metrics and alerting
 */

import { db } from '@/db/db';
import { sql } from 'drizzle-orm';
import { dbConnectionsActive, dbConnectionsIdle, dbConnectionsMax } from '@/lib/observability/metrics';
import { logger } from '@/lib/logger';

export interface ConnectionPoolStats {
  // Current state
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  maxConnections: number;
  
  // Usage metrics
  utilizationPercent: number;
  waitingQueries: number;
  
  // Performance
  avgWaitTimeMs: number;
  longestRunningQuerySec: number;
  
  // Alerts
  isNearLimit: boolean;
  hasLongRunningQueries: boolean;
  hasConnectionLeaks: boolean;
  
  // Metadata
  timestamp: Date;
}

export interface QueryInfo {
  pid: number;
  duration_sec: number;
  query: string;
  state: string;
  wait_event?: string;
  application_name?: string;
}

/**
 * Get comprehensive connection pool statistics
 */
export async function getConnectionPoolStats(): Promise<ConnectionPoolStats> {
  try {
    // Get connection counts and settings
    const statsResult = await db.execute(sql`
      SELECT 
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'active') as active_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle') as idle_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as total_connections,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND wait_event IS NOT NULL) as waiting_queries
    `);

    const stats = statsResult[0];
    const activeConnections = Number(stats?.active_connections || 0);
    const idleConnections = Number(stats?.idle_connections || 0);
    const totalConnections = Number(stats?.total_connections || 0);
    const maxConnections = Number(stats?.max_connections || 100);
    const waitingQueries = Number(stats?.waiting_queries || 0);

    // Get longest running query
    const longQueryResult = await db.execute(sql`
      SELECT 
        EXTRACT(EPOCH FROM (NOW() - query_start)) as duration_sec
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND state = 'active'
        AND query NOT LIKE '%pg_stat_activity%'
      ORDER BY query_start
      LIMIT 1
    `);

    const longestRunningQuerySec = Number(longQueryResult[0]?.duration_sec || 0);

    // Calculate utilization
    const utilizationPercent = (totalConnections / maxConnections) * 100;

    // Determine alert conditions
    const isNearLimit = utilizationPercent > 80; // Alert at 80% capacity
    const hasLongRunningQueries = longestRunningQuerySec > 30; // Queries over 30s
    const hasConnectionLeaks = idleConnections > (totalConnections * 0.5) && totalConnections > 10; // More than 50% idle

    // Update Prometheus metrics
    dbConnectionsActive.set(activeConnections);
    dbConnectionsIdle.set(idleConnections);
    dbConnectionsMax.set(maxConnections);

    const poolStats: ConnectionPoolStats = {
      activeConnections,
      idleConnections,
      totalConnections,
      maxConnections,
      utilizationPercent,
      waitingQueries,
      avgWaitTimeMs: 0, // Would need to track this separately
      longestRunningQuerySec,
      isNearLimit,
      hasLongRunningQueries,
      hasConnectionLeaks,
      timestamp: new Date(),
    };

    return poolStats;
  } catch (error) {
    logger.error('[ConnectionPool] Failed to get stats', error instanceof Error ? error : new Error(String(error)));
    
    // Return safe defaults on error
    return {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
      maxConnections: 100,
      utilizationPercent: 0,
      waitingQueries: 0,
      avgWaitTimeMs: 0,
      longestRunningQuerySec: 0,
      isNearLimit: false,
      hasLongRunningQueries: false,
      hasConnectionLeaks: false,
      timestamp: new Date(),
    };
  }
}

/**
 * Get list of active queries with details
 */
export async function getActiveQueries(): Promise<QueryInfo[]> {
  try {
    const result = await db.execute(sql`
      SELECT 
        pid,
        EXTRACT(EPOCH FROM (NOW() - query_start)) as duration_sec,
        LEFT(query, 200) as query,
        state,
        wait_event,
        application_name
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND state = 'active'
        AND query NOT LIKE '%pg_stat_activity%'
      ORDER BY query_start
    `);

    return result.map(row => ({
      pid: Number(row.pid),
      duration_sec: Number(row.duration_sec || 0),
      query: String(row.query || ''),
      state: String(row.state || 'unknown'),
      wait_event: row.wait_event ? String(row.wait_event) : undefined,
      application_name: row.application_name ? String(row.application_name) : undefined,
    }));
  } catch (error) {
    logger.error('[ConnectionPool] Failed to get active queries', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

/**
 * Kill a long-running query by PID
 * 
 * Use with caution - only for stuck queries that are blocking operations
 */
export async function killQuery(pid: number, reason: string): Promise<boolean> {
  try {
    logger.warn(`[ConnectionPool] Killing query PID ${pid}: ${reason}`);
    
    await db.execute(sql`SELECT pg_cancel_backend(${pid})`);
    
    return true;
  } catch (error) {
    logger.error(`[ConnectionPool] Failed to kill query ${pid}` , error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * Check pool health and return recommendations
 */
export async function checkPoolHealth(): Promise<{
  healthy: boolean;
  warnings: string[];
  recommendations: string[];
}> {
  const stats = await getConnectionPoolStats();
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check utilization
  if (stats.isNearLimit) {
    warnings.push(`Connection pool at ${stats.utilizationPercent.toFixed(1)}% capacity`);
    recommendations.push('Consider increasing max_connections or optimizing query performance');
  }

  // Check for long-running queries
  if (stats.hasLongRunningQueries) {
    warnings.push(`Detected query running for ${stats.longestRunningQuerySec.toFixed(1)}s`);
    recommendations.push('Review slow queries and add appropriate indexes');
  }

  // Check for connection leaks
  if (stats.hasConnectionLeaks) {
    warnings.push(`High number of idle connections (${stats.idleConnections}/${stats.totalConnections})`);
    recommendations.push('Check for unclosed database connections in application code');
  }

  // Check if approaching max connections
  if (stats.totalConnections > stats.maxConnections * 0.9) {
    warnings.push('Nearing maximum connection limit');
    recommendations.push('Urgent: Scale database or reduce connection usage');
  }

  return {
    healthy: warnings.length === 0,
    warnings,
    recommendations,
  };
}

/**
 * Get recommended pool size based on current usage
 */
export function getRecommendedPoolSize(stats: ConnectionPoolStats): {
  current: number;
  recommended: number;
  reason: string;
} {
  const current = stats.maxConnections;
  let recommended = current;
  let reason = 'Current configuration is optimal';

  // If consistently high utilization, recommend increase
  if (stats.utilizationPercent > 80) {
    recommended = Math.ceil(current * 1.5);
    reason = 'High utilization detected - recommend increasing pool size';
  }
  
  // If very low utilization, could potentially decrease
  else if (stats.utilizationPercent < 20 && current > 10) {
    recommended = Math.max(10, Math.floor(current * 0.75));
    reason = 'Low utilization - pool size could be reduced to save resources';
  }

  return { current, recommended, reason };
}

/**
 * Start monitoring connection pool (call at app startup)
 */
export function startConnectionPoolMonitoring(intervalMs: number = 60000): NodeJS.Timeout {
  logger.info('[ConnectionPool] Starting monitoring');
  
  const interval = setInterval(async () => {
    try {
      const health = await checkPoolHealth();
      
      if (!health.healthy) {
        logger.warn('[ConnectionPool] Health check warnings', { warnings: health.warnings });
        
        // Log recommendations
        health.recommendations.forEach(rec => {
          logger.warn(`[ConnectionPool] Recommendation: ${rec}`);
        });
      }
    } catch (error) {
      logger.error('[ConnectionPool] Monitoring error', error instanceof Error ? error : new Error(String(error)));
    }
  }, intervalMs);

  return interval;
}

/**
 * Configuration for query timeout enforcement
 */
export interface QueryTimeoutConfig {
  // Default timeout for all queries (ms)
  defaultTimeout: number;
  
  // Specific timeouts for different operations
  selectTimeout: number;
  insertTimeout: number;
  updateTimeout: number;
  deleteTimeout: number;
  
  // Whether to kill queries that exceed timeout
  killOnTimeout: boolean;
}

/**
 * Default query timeout configuration
 */
export const DEFAULT_QUERY_TIMEOUTS: QueryTimeoutConfig = {
  defaultTimeout: 30000,      // 30 seconds
  selectTimeout: 30000,       // 30 seconds
  insertTimeout: 10000,       // 10 seconds
  updateTimeout: 10000,       // 10 seconds
  deleteTimeout: 10000,       // 10 seconds
  killOnTimeout: false,       // Don&apos;t kill by default
};

/**
 * Set statement timeout for the session
 */
export async function setSessionTimeout(timeoutMs: number): Promise<void> {
  await db.execute(sql`SET statement_timeout = ${timeoutMs}`);
}

