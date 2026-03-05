/**
 * Resilience Patterns — Test Suite
 */

import { describe, it, expect, vi } from 'vitest';
import { CircuitBreaker, CircuitOpenError } from '../circuit-breaker.js';
import { Bulkhead, BulkheadFullError } from '../bulkhead.js';
import { retry } from '../retry.js';
import { withTimeout, TimeoutError } from '../timeout.js';

// ── Circuit Breaker ─────────────────────────────────────────────────────────

describe('CircuitBreaker', () => {
  it('starts in CLOSED state', () => {
    const cb = new CircuitBreaker({ name: 'test' });
    expect(cb.getState()).toBe('CLOSED');
  });

  it('stays CLOSED on success', async () => {
    const cb = new CircuitBreaker({ name: 'test', failureThreshold: 3, resetTimeoutMs: 100, successThreshold: 1 });
    await cb.execute(() => Promise.resolve('ok'));
    expect(cb.getState()).toBe('CLOSED');
  });

  it('opens after failure threshold', async () => {
    const cb = new CircuitBreaker({ name: 'test', failureThreshold: 2, resetTimeoutMs: 100, successThreshold: 1 });

    for (let i = 0; i < 2; i++) {
      await cb.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
    }

    expect(cb.getState()).toBe('OPEN');
  });

  it('rejects calls when OPEN', async () => {
    const cb = new CircuitBreaker({ name: 'test', failureThreshold: 1, resetTimeoutMs: 100_000, successThreshold: 1 });
    await cb.execute(() => Promise.reject(new Error('fail'))).catch(() => {});

    await expect(cb.execute(() => Promise.resolve('ok'))).rejects.toThrow(CircuitOpenError);
  });

  it('transitions to HALF_OPEN after reset timeout', async () => {
    const cb = new CircuitBreaker({ name: 'test', failureThreshold: 1, resetTimeoutMs: 50, successThreshold: 1 });
    await cb.execute(() => Promise.reject(new Error('fail'))).catch(() => {});

    expect(cb.getState()).toBe('OPEN');

    await new Promise((r) => setTimeout(r, 60));

    // Next execute should succeed (HALF_OPEN allows one probe)
    await cb.execute(() => Promise.resolve('ok'));
    expect(cb.getState()).toBe('CLOSED');
  });

  it('calls onStateChange callback', async () => {
    const onChange = vi.fn();
    const cb = new CircuitBreaker({ name: 'test', failureThreshold: 1, resetTimeoutMs: 100, successThreshold: 1, onStateChange: onChange });

    await cb.execute(() => Promise.reject(new Error('fail'))).catch(() => {});

    expect(onChange).toHaveBeenCalledWith('CLOSED', 'OPEN', 'test');
  });
});

// ── Bulkhead ──────────────────────────────────────────────────────────────────

describe('Bulkhead', () => {
  it('allows execution within limit', async () => {
    const bh = new Bulkhead({ name: 'test', maxConcurrent: 2, maxQueue: 0 });
    const result = await bh.execute(() => Promise.resolve('ok'));
    expect(result).toBe('ok');
  });

  it('rejects when full with no queue', async () => {
    const bh = new Bulkhead({ name: 'test', maxConcurrent: 1, maxQueue: 0 });

    // Start a long-running task
    const longTask = bh.execute(() => new Promise((r) => setTimeout(() => r('done'), 100)));

    // Second task should be rejected
    await expect(bh.execute(() => Promise.resolve('second'))).rejects.toThrow(BulkheadFullError);

    await longTask;
  });

  it('queues when at capacity', async () => {
    const bh = new Bulkhead({ name: 'test', maxConcurrent: 1, maxQueue: 1 });

    const task1 = bh.execute(() => new Promise((r) => setTimeout(() => r('first'), 50)));
    const task2 = bh.execute(() => Promise.resolve('second'));

    const [r1, r2] = await Promise.all([task1, task2]);
    expect(r1).toBe('first');
    expect(r2).toBe('second');
  });
});

// ── Retry ─────────────────────────────────────────────────────────────────────

describe('retry', () => {
  it('succeeds on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await retry(fn, { maxAttempts: 3, initialDelayMs: 10, multiplier: 2, jitter: 0 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure then succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok');

    const result = await retry(fn, { maxAttempts: 3, initialDelayMs: 10, multiplier: 2, jitter: 0 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after max attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fail'));

    await expect(
      retry(fn, { maxAttempts: 3, initialDelayMs: 10, multiplier: 2, jitter: 0 }),
    ).rejects.toThrow('always fail');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('respects retryIf filter', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('non-retryable'));

    await expect(
      retry(fn, {
        maxAttempts: 3,
        initialDelayMs: 10,
        multiplier: 2,
        jitter: 0,
        retryIf: () => false,
      }),
    ).rejects.toThrow('non-retryable');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ── Timeout ───────────────────────────────────────────────────────────────────

describe('withTimeout', () => {
  it('resolves when function completes within timeout', async () => {
    const result = await withTimeout(
      () => Promise.resolve('fast'),
      { timeoutMs: 1000, name: 'test' },
    );
    expect(result).toBe('fast');
  });

  it('throws TimeoutError when function exceeds timeout', async () => {
    await expect(
      withTimeout(
        () => new Promise((r) => setTimeout(r, 200)),
        { timeoutMs: 50, name: 'slow-op' },
      ),
    ).rejects.toThrow(TimeoutError);
  });

  it('propagates function errors', async () => {
    await expect(
      withTimeout(
        () => Promise.reject(new Error('inner error')),
        { timeoutMs: 1000, name: 'test' },
      ),
    ).rejects.toThrow('inner error');
  });
});
