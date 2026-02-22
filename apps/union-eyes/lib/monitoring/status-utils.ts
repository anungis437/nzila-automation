/**
 * Status Page Utility Types & Pure Functions
 *
 * Client-safe – no server-side imports (db, cache, logger, etc.)
 * These are consumed by the 'use client' StatusPage component.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export type ServiceStatus = 'healthy' | 'degraded' | 'down';

export interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  responseTime?: number;
  message?: string;
  lastChecked: Date;
}

export interface SystemStatus {
  status: ServiceStatus;
  services: ServiceHealth[];
  uptime: number;
  version: string;
  timestamp: Date;
}

// ── Pure utility functions ──────────────────────────────────────────────────

/**
 * Get status color for UI
 */
export function getStatusColor(status: ServiceStatus): string {
  switch (status) {
    case 'healthy':
      return 'green';
    case 'degraded':
      return 'yellow';
    case 'down':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Get status emoji
 */
export function getStatusEmoji(status: ServiceStatus): string {
  switch (status) {
    case 'healthy':
      return '✅';
    case 'degraded':
      return '⚠️';
    case 'down':
      return '❌';
    default:
      return '❓';
  }
}

/**
 * Format uptime for display
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(' ') || '<1m';
}
