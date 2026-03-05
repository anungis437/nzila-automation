/**
 * Bulkhead Pattern
 *
 * Limits concurrent operations to prevent resource exhaustion.
 * Each bulkhead is a named compartment with a maximum concurrency.
 */

export interface BulkheadOptions {
  /** Name for telemetry */
  name: string;
  /** Maximum concurrent executions (default: 10) */
  maxConcurrent?: number;
  /** Maximum queue size, 0 = reject immediately (default: 100) */
  maxQueue?: number;
}

interface QueuedItem<T> {
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
  fn: () => Promise<T>;
}

export class Bulkhead {
  private active = 0;
  private readonly queue: QueuedItem<unknown>[] = [];
  private readonly options: Required<BulkheadOptions>;

  constructor(options: BulkheadOptions) {
    this.options = {
      name: options.name,
      maxConcurrent: options.maxConcurrent ?? 10,
      maxQueue: options.maxQueue ?? 100,
    };
  }

  /**
   * Execute a function within the bulkhead.
   * Queues if at max concurrency, rejects if queue is full.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active < this.options.maxConcurrent) {
      return this.run(fn);
    }

    if (this.queue.length >= this.options.maxQueue) {
      throw new BulkheadFullError(this.options.name, this.active, this.queue.length);
    }

    return new Promise<T>((resolve, reject) => {
      this.queue.push({ resolve: resolve as (v: unknown) => void, reject, fn: fn as () => Promise<unknown> });
    });
  }

  private async run<T>(fn: () => Promise<T>): Promise<T> {
    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
      this.dequeue();
    }
  }

  private dequeue(): void {
    if (this.queue.length === 0) return;
    const item = this.queue.shift()!;
    this.run(item.fn).then(item.resolve, item.reject);
  }

  getActiveCount(): number { return this.active; }
  getQueueLength(): number { return this.queue.length; }
}

export class BulkheadFullError extends Error {
  constructor(
    public readonly bulkheadName: string,
    public readonly activeCount: number,
    public readonly queueLength: number,
  ) {
    super(`Bulkhead "${bulkheadName}" is full (active=${activeCount}, queue=${queueLength})`);
    this.name = 'BulkheadFullError';
  }
}
