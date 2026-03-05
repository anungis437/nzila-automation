/**
 * Tenant Bulkhead Isolation — Tests
 */

import { describe, it, expect, afterEach } from 'vitest';
import { TenantBulkheadPool, TenantBulkheadOverloadError } from '../tenant-bulkhead.js';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('TenantBulkheadPool', () => {
  let pool: TenantBulkheadPool;

  afterEach(() => {
    pool?.dispose();
  });

  it('isolates tenants from each other', async () => {
    pool = new TenantBulkheadPool({
      name: 'test',
      maxConcurrentPerTenant: 2,
      maxQueuePerTenant: 0,
    });

    const results: string[] = [];

    // Tenant A fills its 2 slots
    const p1 = pool.execute('tenant-a', async () => { await delay(50); results.push('a1'); return 'a1'; });
    const p2 = pool.execute('tenant-a', async () => { await delay(50); results.push('a2'); return 'a2'; });

    // Tenant A's 3rd request should be rejected (queue=0)
    await expect(
      pool.execute('tenant-a', async () => 'a3'),
    ).rejects.toThrow(/full/);

    // Tenant B should still be able to execute (isolated)
    const p3 = pool.execute('tenant-b', async () => { results.push('b1'); return 'b1'; });

    await Promise.all([p1, p2, p3]);
    expect(results).toContain('b1');
  });

  it('enforces global concurrency limit', async () => {
    pool = new TenantBulkheadPool({
      name: 'test',
      maxConcurrentPerTenant: 5,
      globalMaxConcurrent: 3,
    });

    const promises = [
      pool.execute('t1', () => delay(100)),
      pool.execute('t2', () => delay(100)),
      pool.execute('t3', () => delay(100)),
    ];

    await expect(
      pool.execute('t4', () => delay(10)),
    ).rejects.toThrow(TenantBulkheadOverloadError);

    await Promise.all(promises);
  });

  it('returns tenant stats', async () => {
    pool = new TenantBulkheadPool({
      name: 'test',
      maxConcurrentPerTenant: 1,
      maxQueuePerTenant: 5,
    });

    const p1 = pool.execute('org_1', () => delay(100));

    // Allow microtask to start execution
    await delay(5);

    const stats = pool.getTenantStats('org_1');
    expect(stats).not.toBeNull();
    expect(stats!.active).toBe(1);

    expect(pool.getTenantStats('nonexistent')).toBeNull();

    await p1;
  });

  it('returns pool stats', async () => {
    pool = new TenantBulkheadPool({
      name: 'test',
      maxConcurrentPerTenant: 5,
    });

    const p1 = pool.execute('org_a', () => delay(50));
    const p2 = pool.execute('org_b', () => delay(50));

    await delay(5);

    const stats = pool.getPoolStats();
    expect(stats.tenantCount).toBe(2);
    expect(stats.globalActive).toBe(2);

    await Promise.all([p1, p2]);
  });

  it('calls onThrottle when tenant is rejected', async () => {
    const throttled: string[] = [];
    pool = new TenantBulkheadPool({
      name: 'test',
      maxConcurrentPerTenant: 1,
      maxQueuePerTenant: 0,
      onThrottle: (tenantId) => throttled.push(tenantId),
    });

    const p1 = pool.execute('org_x', () => delay(100));
    await delay(5);

    await expect(pool.execute('org_x', () => delay(10))).rejects.toThrow();
    expect(throttled).toContain('org_x');

    await p1;
  });
});
