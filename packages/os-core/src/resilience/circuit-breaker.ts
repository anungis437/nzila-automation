/**
 * Circuit Breaker
 *
 * Prevents cascade failures by tracking error rates and opening
 * the circuit when a threshold is exceeded.
 *
 * States:
 *   CLOSED  → normal operation, counting failures
 *   OPEN    → rejecting requests, waiting for reset timeout
 *   HALF_OPEN → allowing a single probe request
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  /** Name for telemetry and logging */
  name: string;
  /** Number of failures before opening (default: 5) */
  failureThreshold?: number;
  /** Time to wait before trying again in ms (default: 30_000) */
  resetTimeoutMs?: number;
  /** Number of successes in HALF_OPEN to close (default: 2) */
  successThreshold?: number;
  /** Optional: callback when state changes */
  onStateChange?: (from: CircuitState, to: CircuitState, name: string) => void;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private readonly options: Required<Omit<CircuitBreakerOptions, 'onStateChange'>> & Pick<CircuitBreakerOptions, 'onStateChange'>;

  constructor(options: CircuitBreakerOptions) {
    this.options = {
      name: options.name,
      failureThreshold: options.failureThreshold ?? 5,
      resetTimeoutMs: options.resetTimeoutMs ?? 30_000,
      successThreshold: options.successThreshold ?? 2,
      onStateChange: options.onStateChange,
    };
  }

  /**
   * Execute a function through the circuit breaker.
   * Throws CircuitOpenError if the circuit is open.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      throw new CircuitOpenError(this.options.name, this.state);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Check if the circuit allows execution.
   */
  private canExecute(): boolean {
    switch (this.state) {
      case 'CLOSED':
        return true;

      case 'OPEN': {
        const elapsed = Date.now() - this.lastFailureTime;
        if (elapsed >= this.options.resetTimeoutMs) {
          this.transition('HALF_OPEN');
          return true;
        }
        return false;
      }

      case 'HALF_OPEN':
        return true;
    }
  }

  private onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.transition('CLOSED');
      }
    }
    if (this.state === 'CLOSED') {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      this.transition('OPEN');
    } else if (this.failureCount >= this.options.failureThreshold) {
      this.transition('OPEN');
    }
  }

  private transition(to: CircuitState): void {
    const from = this.state;
    this.state = to;

    if (to === 'CLOSED') {
      this.failureCount = 0;
      this.successCount = 0;
    }
    if (to === 'HALF_OPEN') {
      this.successCount = 0;
    }

    this.options.onStateChange?.(from, to, this.options.name);
  }

  getState(): CircuitState { return this.state; }
  getFailureCount(): number { return this.failureCount; }
}

export class CircuitOpenError extends Error {
  constructor(
    public readonly circuitName: string,
    public readonly circuitState: CircuitState,
  ) {
    super(`Circuit breaker "${circuitName}" is ${circuitState}`);
    this.name = 'CircuitOpenError';
  }
}
