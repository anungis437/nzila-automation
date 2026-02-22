/**
 * Crash Reporting Library
 * 
 * Provides client-side error tracking and crash reporting
 * for mobile PWA applications
 */

import { logger } from '@/lib/logger';

// Crash reporting configuration
export interface CrashReportingConfig {
  endpoint: string;
  enabled: boolean;
  sampleRate: number;
  maxQueueSize: number;
}

const DEFAULT_CONFIG: CrashReportingConfig = {
  endpoint: '/api/monitoring/crashes',
  enabled: true,
  sampleRate: 1.0, // 100% - set lower for production
  maxQueueSize: 50,
};

/**
 * Crash Reporter
 * Collects and reports unhandled errors and exceptions
 */
export class CrashReporter {
  private config: CrashReportingConfig;
  private queue: CrashReport[] = [];
  private isInitialized: boolean = false;

  constructor(config: Partial<CrashReportingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize crash reporting
   */
  init(): void {
    if (this.isInitialized || !this.config.enabled) {
      return;
    }

    // Handle uncaught exceptions
    window.onerror = (message, source, lineno, colno, error) => {
      this.reportError({
        type: 'uncaught_exception',
        message: String(message),
        stack: error?.stack,
        location: {
          source,
          lineno,
          colno,
        },
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    };

    // Handle unhandled promise rejections
    window.onunhandledrejection = (event) => {
      const error = event.reason;
      this.reportError({
        type: 'unhandled_promise_rejection',
        message: error?.message || String(error),
        stack: error?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    };

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target instanceof HTMLScriptElement ||
          event.target instanceof HTMLLinkElement ||
          event.target instanceof HTMLImageElement) {
        this.reportError({
          type: 'resource_error',
          message: `Failed to load: ${(event.target as HTMLElement).tagName}`,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        });
      }
    }, true);

    this.isInitialized = true;
    logger.info('Crash reporting initialized');
  }

  /**
   * Report a custom error
   */
  reportError(error: CrashReport): void {
    // Check sample rate
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    // Add to queue
    this.queue.push({
      ...error,
      id: this.generateId(),
    });

    // Flush if queue is full
    if (this.queue.length >= this.config.maxQueueSize) {
      this.flush();
    }
  }

  /**
   * Flush queued reports to server
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    const reports = [...this.queue];
    this.queue = [];

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reports }),
      });
      
      logger.info('Crash reports sent', { count: reports.length });
    } catch (error) {
      // Re-queue on failure
      this.queue.unshift(...reports);
      logger.error('Failed to send crash reports', { error });
    }
  }

  /**
   * Generate unique ID for report
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Crash report interface
 */
interface CrashReport {
  id?: string;
  type: 'uncaught_exception' | 'unhandled_promise_rejection' | 'resource_error' | 'manual';
  message: string;
  stack?: string;
  location?: {
    source?: string;
    lineno?: number;
    colno?: number;
  };
  timestamp: string;
  userAgent: string;
  url: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create crash reporter instance
 */
export function createCrashReporter(config?: Partial<CrashReportingConfig>): CrashReporter {
  const reporter = new CrashReporter(config);
  reporter.init();
  return reporter;
}

// Export singleton
export const crashReporter = new CrashReporter();
crashReporter.init();

// Initialize on import
if (typeof window !== 'undefined') {
  crashReporter.init();
}
