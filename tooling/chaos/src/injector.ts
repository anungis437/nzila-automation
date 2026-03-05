/**
 * Fault Injector
 *
 * Provides fault injection primitives for chaos experiments.
 * These are TypeScript-level faults (no container/infrastructure faults).
 */

export type FaultType =
  | 'latency'
  | 'error'
  | 'timeout'
  | 'connection-drop'
  | 'cpu-pressure'
  | 'memory-pressure';

interface LatencyFaultParams {
  delayMs: number;
  jitterMs?: number;
}

interface ErrorFaultParams {
  errorRate: number; // 0-1
  errorMessage: string;
}

export class FaultInjector {
  private activeFaults = new Map<string, { type: FaultType; cleanup: () => void }>();

  /**
   * Inject latency into a function wrapper.
   * Returns a middleware-style function that adds delay.
   */
  createLatencyFault(name: string, params: LatencyFaultParams): <T>(fn: () => Promise<T>) => Promise<T> {
    const fault = {
      type: 'latency' as FaultType,
      cleanup: () => this.activeFaults.delete(name),
    };
    this.activeFaults.set(name, fault);

    return async <T>(fn: () => Promise<T>): Promise<T> => {
      if (!this.activeFaults.has(name)) return fn();

      const jitter = params.jitterMs
        ? (Math.random() * 2 - 1) * params.jitterMs
        : 0;
      const delay = params.delayMs + jitter;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fn();
    };
  }

  /**
   * Create an error injection wrapper.
   * Returns a function that throws with the configured probability.
   */
  createErrorFault(name: string, params: ErrorFaultParams): <T>(fn: () => Promise<T>) => Promise<T> {
    const fault = {
      type: 'error' as FaultType,
      cleanup: () => this.activeFaults.delete(name),
    };
    this.activeFaults.set(name, fault);

    return async <T>(fn: () => Promise<T>): Promise<T> => {
      if (!this.activeFaults.has(name)) return fn();

      if (Math.random() < params.errorRate) {
        throw new Error(`[Chaos] ${params.errorMessage}`);
      }
      return fn();
    };
  }

  /**
   * Remove a fault by name.
   */
  removeFault(name: string): void {
    const fault = this.activeFaults.get(name);
    if (fault) {
      fault.cleanup();
    }
  }

  /**
   * Remove all active faults.
   */
  removeAllFaults(): void {
    for (const [name] of this.activeFaults) {
      this.removeFault(name);
    }
  }

  /**
   * List all active faults.
   */
  getActiveFaults(): Array<{ name: string; type: FaultType }> {
    return Array.from(this.activeFaults.entries()).map(([name, fault]) => ({
      name,
      type: fault.type,
    }));
  }
}
