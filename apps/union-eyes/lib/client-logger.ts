/**
 * Client-safe structured logger
 *
 * Provides a lightweight logging interface that works in both browser and
 * Edge runtimes where the full os-core logger (which pulls in Node.js-only
 * APIs like process.stdout, node:crypto, node:async_hooks) cannot be used.
 *
 * Files that must remain client-safe or Edge-compatible should import from
 * here instead of '@/lib/logger'.
 *
 * In production the console-wrapper (lib/console-wrapper.ts) intercepts these
 * calls and routes warn/error to the structured Sentry-backed logger while
 * silencing info/debug output.
 *
 * @module lib/client-logger
 */

export interface ClientLogger {
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: unknown): void;
  debug(msg: string, meta?: Record<string, unknown>): void;
}

/**
 * Create a namespaced client-safe logger.
 *
 * @param namespace - Short prefix shown in log messages, e.g. "api", "middleware"
 */
export function createClientLogger(namespace: string): ClientLogger {
  const tag = `[${namespace}]`;
  return {
    info:  (msg, meta) => console.info(tag, msg, meta ?? ''),
    warn:  (msg, meta) => console.warn(tag, msg, meta ?? ''),
    error: (msg, meta) => console.error(tag, msg, meta ?? ''),
    debug: (msg, meta) => console.debug(tag, msg, meta ?? ''),
  };
}
