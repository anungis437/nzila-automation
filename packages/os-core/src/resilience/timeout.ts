/**
 * Timeout Wrapper
 *
 * Wraps an async function with a timeout. If the function
 * doesn't resolve within the timeout, a TimeoutError is thrown.
 */

export interface TimeoutOptions {
  /** Timeout in milliseconds */
  timeoutMs: number;
  /** Optional name for error messages */
  name?: string;
}

/**
 * Execute a function with a timeout.
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  options: TimeoutOptions,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError(options.name ?? 'operation', options.timeoutMs));
    }, options.timeoutMs);

    fn()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export class TimeoutError extends Error {
  constructor(
    public readonly operationName: string,
    public readonly timeoutMs: number,
  ) {
    super(`Operation "${operationName}" timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}
