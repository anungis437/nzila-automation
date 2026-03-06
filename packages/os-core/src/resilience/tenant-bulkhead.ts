/**
 * Per-Tenant Bulkhead Isolation
 *
 * Provides org-scoped concurrency limits to prevent any single tenant
 * from monopolizing shared resources. Each orgId gets its own Bulkhead
 * with configurable concurrency and queue limits.
 *
 * This prevents the noisy-neighbour problem in multi-tenant environments
 * and ensures fair resource distribution across organizations.
 *
 * @example
 * ```ts
 * const pool = new TenantBulkheadPool({
 *   name: 'ai-inference',
 *   maxConcurrentPerTenant: 5,
 *   maxQueuePerTenant: 20,
 *   globalMaxConcurrent: 50,
 * });
 *
 * // Scoped to orgId — other orgs are not affected
 * const result = await pool.execute(orgId, () => callAIModel(prompt));
 * ```
 */

import { Bulkhead, type BulkheadOptions } from './bulkhead';

export interface TenantBulkheadPoolOptions {
  /** Pool name for telemetry */
  name: string;
  /** Max concurrent operations per tenant (default: 10) */
  maxConcurrentPerTenant?: number;
  /** Max queue per tenant (default: 50) */
  maxQueuePerTenant?: number;
  /** Global concurrent limit across all tenants (default: unlimited) */
  globalMaxConcurrent?: number;
  /** Evict idle tenant bulkheads after ms (default: 300_000 = 5min) */
  idleEvictionMs?: number;
  /** Callback when a tenant is throttled */
  onThrottle?: (tenantId: string, activeCount: number, queueLength: number) => void;
}

interface TenantEntry {
  bulkhead: Bulkhead;
  lastUsed: number;
}

export class TenantBulkheadPool {
  private readonly tenants = new Map<string, TenantEntry>();
  private globalActive = 0;
  private readonly options: Required<Omit<TenantBulkheadPoolOptions, 'onThrottle'>> & Pick<TenantBulkheadPoolOptions, 'onThrottle'>;
  private evictionTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: TenantBulkheadPoolOptions) {
    this.options = {
      name: options.name,
      maxConcurrentPerTenant: options.maxConcurrentPerTenant ?? 10,
      maxQueuePerTenant: options.maxQueuePerTenant ?? 50,
      globalMaxConcurrent: options.globalMaxConcurrent ?? Number.MAX_SAFE_INTEGER,
      idleEvictionMs: options.idleEvictionMs ?? 300_000,
      onThrottle: options.onThrottle,
    };

    // Periodically evict idle tenant bulkheads
    this.evictionTimer = setInterval(() => this.evictIdle(), this.options.idleEvictionMs);
    if (typeof this.evictionTimer === 'object' && 'unref' in this.evictionTimer) {
      this.evictionTimer.unref(); // Don't block Node.js exit
    }
  }

  /**
   * Execute a function within the tenant's isolated bulkhead.
   *
   * Each orgId gets its own concurrency limit. If the per-tenant bulkhead
   * is full, the request is queued or rejected — but other tenants are
   * unaffected.
   */
  async execute<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
    if (this.globalActive >= this.options.globalMaxConcurrent) {
      throw new TenantBulkheadOverloadError(
        this.options.name,
        tenantId,
        this.globalActive,
        'Global concurrency limit reached',
      );
    }

    const entry = this.getOrCreateTenant(tenantId);
    entry.lastUsed = Date.now();

    this.globalActive++;
    try {
      return await entry.bulkhead.execute(fn);
    } catch (error) {
      // Emit throttle event if this was a capacity error
      if (error instanceof Error && error.name === 'BulkheadFullError') {
        this.options.onThrottle?.(
          tenantId,
          entry.bulkhead.getActiveCount(),
          entry.bulkhead.getQueueLength(),
        );
      }
      throw error;
    } finally {
      this.globalActive--;
    }
  }

  private getOrCreateTenant(tenantId: string): TenantEntry {
    let entry = this.tenants.get(tenantId);
    if (!entry) {
      const bulkhead = new Bulkhead({
        name: `${this.options.name}:${tenantId}`,
        maxConcurrent: this.options.maxConcurrentPerTenant,
        maxQueue: this.options.maxQueuePerTenant,
      });
      entry = { bulkhead, lastUsed: Date.now() };
      this.tenants.set(tenantId, entry);
    }
    return entry;
  }

  private evictIdle(): void {
    const now = Date.now();
    for (const [tenantId, entry] of this.tenants) {
      if (
        entry.bulkhead.getActiveCount() === 0 &&
        entry.bulkhead.getQueueLength() === 0 &&
        now - entry.lastUsed > this.options.idleEvictionMs
      ) {
        this.tenants.delete(tenantId);
      }
    }
  }

  /** Get stats for a specific tenant */
  getTenantStats(tenantId: string): { active: number; queued: number } | null {
    const entry = this.tenants.get(tenantId);
    if (!entry) return null;
    return {
      active: entry.bulkhead.getActiveCount(),
      queued: entry.bulkhead.getQueueLength(),
    };
  }

  /** Get aggregate pool stats */
  getPoolStats(): {
    globalActive: number;
    tenantCount: number;
    tenants: Record<string, { active: number; queued: number }>;
  } {
    const tenants: Record<string, { active: number; queued: number }> = {};
    for (const [id, entry] of this.tenants) {
      tenants[id] = {
        active: entry.bulkhead.getActiveCount(),
        queued: entry.bulkhead.getQueueLength(),
      };
    }
    return {
      globalActive: this.globalActive,
      tenantCount: this.tenants.size,
      tenants,
    };
  }

  /** Dispose the pool and clear the eviction timer */
  dispose(): void {
    if (this.evictionTimer) {
      clearInterval(this.evictionTimer);
      this.evictionTimer = null;
    }
    this.tenants.clear();
  }
}

export class TenantBulkheadOverloadError extends Error {
  constructor(
    public readonly poolName: string,
    public readonly tenantId: string,
    public readonly globalActive: number,
    message: string,
  ) {
    super(`TenantBulkheadPool "${poolName}" [${tenantId}]: ${message}`);
    this.name = 'TenantBulkheadOverloadError';
  }
}
