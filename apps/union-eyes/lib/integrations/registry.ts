/**
 * Integration Registry
 * Central catalog of all available integrations and their metadata
 */

import { logger } from '@/lib/logger';
import {
  IntegrationType,
  IntegrationProvider,
  IntegrationCapabilities,
  ConnectionStatus,
} from './types';

/**
 * Integration metadata stored in registry
 */
export interface IntegrationMetadata {
  type: IntegrationType;
  provider: IntegrationProvider;
  name: string;
  description: string;
  capabilities: IntegrationCapabilities;
  logoUrl?: string;
  documentationUrl?: string;
  setupInstructions?: string;
  requiredEnvVars: string[];
  optionalEnvVars?: string[];
  status: 'available' | 'beta' | 'deprecated' | 'unavailable';
}

/**
 * Runtime integration health tracked by registry
 */
export interface IntegrationHealth {
  provider: IntegrationProvider;
  status: ConnectionStatus;
  lastHealthCheck?: Date;
  lastError?: string;
  rateLimitRemaining?: number;
  availableUntil?: Date;
}

/**
 * Integration Registry
 * Singleton that manages all integration metadata and health
 */
export class IntegrationRegistry {
  private static instance: IntegrationRegistry;
  private registry: Map<IntegrationProvider, IntegrationMetadata> = new Map();
  private health: Map<IntegrationProvider, IntegrationHealth> = new Map();

  private constructor() {
    this.registerBuiltInIntegrations();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): IntegrationRegistry {
    if (!IntegrationRegistry.instance) {
      IntegrationRegistry.instance = new IntegrationRegistry();
    }
    return IntegrationRegistry.instance;
  }

  /**
   * Register an integration
   */
  register(metadata: IntegrationMetadata): void {
    this.registry.set(metadata.provider, metadata);
    logger.info('Integration registered', {
      provider: metadata.provider,
      type: metadata.type,
      status: metadata.status,
    });
  }

  /**
   * Get integration metadata
   */
  getMetadata(provider: IntegrationProvider): IntegrationMetadata | undefined {
    return this.registry.get(provider);
  }

  /**
   * Get all integrations of a specific type
   */
  getByType(type: IntegrationType): IntegrationMetadata[] {
    return Array.from(this.registry.values()).filter(m => m.type === type);
  }

  /**
   * Get all available integrations
   */
  getAll(): IntegrationMetadata[] {
    return Array.from(this.registry.values());
  }

  /**
   * Check if integration is available
   */
  isAvailable(provider: IntegrationProvider): boolean {
    const metadata = this.registry.get(provider);
    return metadata?.status === 'available' || metadata?.status === 'beta';
  }

  /**
   * Update health status
   */
  updateHealth(provider: IntegrationProvider, health: Partial<IntegrationHealth>): void {
    const existing = this.health.get(provider);
    this.health.set(provider, {
      provider,
      status: health.status || existing?.status || ConnectionStatus.DISCONNECTED,
      lastHealthCheck: health.lastHealthCheck || new Date(),
      lastError: health.lastError || existing?.lastError,
      rateLimitRemaining: health.rateLimitRemaining,
      availableUntil: health.availableUntil,
    });
  }

  /**
   * Get health status
   */
  getHealth(provider: IntegrationProvider): IntegrationHealth | undefined {
    return this.health.get(provider);
  }

  /**
   * Get all health statuses
   */
  getAllHealth(): IntegrationHealth[] {
    return Array.from(this.health.values());
  }

  /**
   * Check if provider needs environment variables
   */
  checkEnvironmentVars(provider: IntegrationProvider): {
    available: boolean;
    missing: string[];
  } {
    const metadata = this.registry.get(provider);
    if (!metadata) {
      return { available: false, missing: [] };
    }

    const missing: string[] = [];
    for (const envVar of metadata.requiredEnvVars) {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    }

    return {
      available: missing.length === 0,
      missing,
    };
  }

  /**
   * Register all built-in integrations
   */
  private registerBuiltInIntegrations(): void {
    // HRIS Integrations
    this.register({
      type: IntegrationType.HRIS,
      provider: IntegrationProvider.WORKDAY,
      name: 'Workday',
      description: 'Enterprise HRIS for large organizations',
      capabilities: {
        supportsFullSync: true,
        supportsIncrementalSync: true,
        supportsWebhooks: false,
        supportsRealTime: false,
        supportedEntities: ['employees', 'positions', 'departments', 'leave'],
        requiresOAuth: true,
        supportedScopes: ['worker:read', 'organization:read'],
        rateLimitPerMinute: 60,
      },
      requiredEnvVars: ['WORKDAY_CLIENT_ID', 'WORKDAY_CLIENT_SECRET', 'WORKDAY_TENANT_ID'],
      status: 'available',
    });

    this.register({
      type: IntegrationType.HRIS,
      provider: IntegrationProvider.BAMBOOHR,
      name: 'BambooHR',
      description: 'HRIS for small and medium businesses',
      capabilities: {
        supportsFullSync: true,
        supportsIncrementalSync: false,
        supportsWebhooks: true,
        supportsRealTime: false,
        supportedEntities: ['employees', 'time-off', 'custom-fields'],
        requiresOAuth: false,
        rateLimitPerMinute: 100,
      },
      requiredEnvVars: ['BAMBOOHR_API_KEY', 'BAMBOOHR_SUBDOMAIN'],
      status: 'available',
    });

    this.register({
      type: IntegrationType.HRIS,
      provider: IntegrationProvider.ADP,
      name: 'ADP Workforce Now',
      description: 'Comprehensive HR management system',
      capabilities: {
        supportsFullSync: true,
        supportsIncrementalSync: true,
        supportsWebhooks: true,
        supportsRealTime: false,
        supportedEntities: ['workers', 'payroll', 'time-tracking'],
        requiresOAuth: true,
        supportedScopes: ['worker:read', 'payroll:read'],
        rateLimitPerMinute: 50,
      },
      requiredEnvVars: ['ADP_CLIENT_ID', 'ADP_CLIENT_SECRET'],
      status: 'available',
    });

    // Accounting Integrations
    this.register({
      type: IntegrationType.ACCOUNTING,
      provider: IntegrationProvider.QUICKBOOKS,
      name: 'QuickBooks Online',
      description: 'Popular cloud accounting software',
      capabilities: {
        supportsFullSync: true,
        supportsIncrementalSync: true,
        supportsWebhooks: true,
        supportsRealTime: false,
        supportedEntities: ['invoices', 'payments', 'customers', 'accounts'],
        requiresOAuth: true,
        supportedScopes: ['com.intuit.quickbooks.accounting'],
        rateLimitPerMinute: 100,
      },
      requiredEnvVars: ['QUICKBOOKS_CLIENT_ID', 'QUICKBOOKS_CLIENT_SECRET'],
      status: 'available',
    });

    this.register({
      type: IntegrationType.ACCOUNTING,
      provider: IntegrationProvider.XERO,
      name: 'Xero',
      description: 'Cloud accounting for small businesses',
      capabilities: {
        supportsFullSync: true,
        supportsIncrementalSync: true,
        supportsWebhooks: true,
        supportsRealTime: false,
        supportedEntities: ['invoices', 'payments', 'contacts', 'accounts'],
        requiresOAuth: true,
        supportedScopes: ['accounting.transactions', 'accounting.contacts'],
        rateLimitPerMinute: 60,
      },
      requiredEnvVars: ['XERO_CLIENT_ID', 'XERO_CLIENT_SECRET'],
      status: 'available',
    });

    // Insurance Integrations
    this.register({
      type: IntegrationType.INSURANCE,
      provider: IntegrationProvider.SUNLIFE,
      name: 'Sun Life Financial',
      description: 'Insurance and benefits provider',
      capabilities: {
        supportsFullSync: true,
        supportsIncrementalSync: false,
        supportsWebhooks: false,
        supportsRealTime: false,
        supportedEntities: ['members', 'plans', 'claims', 'eligibility'],
        requiresOAuth: true,
        rateLimitPerMinute: 30,
      },
      requiredEnvVars: ['SUNLIFE_API_KEY', 'SUNLIFE_API_SECRET'],
      status: 'beta',
    });

    this.register({
      type: IntegrationType.INSURANCE,
      provider: IntegrationProvider.MANULIFE,
      name: 'Manulife',
      description: 'Insurance and wealth management',
      capabilities: {
        supportsFullSync: true,
        supportsIncrementalSync: false,
        supportsWebhooks: false,
        supportsRealTime: false,
        supportedEntities: ['members', 'plans', 'claims'],
        requiresOAuth: true,
        rateLimitPerMinute: 30,
      },
      requiredEnvVars: ['MANULIFE_CLIENT_ID', 'MANULIFE_CLIENT_SECRET'],
      status: 'beta',
    });

    // Pension Integrations
    this.register({
      type: IntegrationType.PENSION,
      provider: IntegrationProvider.OTPP,
      name: 'Ontario Teachers Pension Plan',
      description: 'Pension administration for Ontario teachers',
      capabilities: {
        supportsFullSync: true,
        supportsIncrementalSync: false,
        supportsWebhooks: false,
        supportsRealTime: false,
        supportedEntities: ['members', 'contributions', 'statements'],
        requiresOAuth: false,
        rateLimitPerMinute: 20,
      },
      requiredEnvVars: ['OTPP_API_KEY'],
      status: 'beta',
    });

    // LMS Integrations
    this.register({
      type: IntegrationType.LMS,
      provider: IntegrationProvider.LINKEDIN_LEARNING,
      name: 'LinkedIn Learning',
      description: 'Professional development platform',
      capabilities: {
        supportsFullSync: true,
        supportsIncrementalSync: true,
        supportsWebhooks: true,
        supportsRealTime: false,
        supportedEntities: ['courses', 'completions', 'users'],
        requiresOAuth: true,
        supportedScopes: ['r_liteprofile', 'r_learning'],
        rateLimitPerMinute: 100,
      },
      requiredEnvVars: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
      status: 'available',
    });

    // Communication Integrations
    this.register({
      type: IntegrationType.COMMUNICATION,
      provider: IntegrationProvider.SLACK,
      name: 'Slack',
      description: 'Team communication platform',
      capabilities: {
        supportsFullSync: false,
        supportsIncrementalSync: false,
        supportsWebhooks: true,
        supportsRealTime: true,
        supportedEntities: ['channels', 'messages', 'users'],
        requiresOAuth: true,
        supportedScopes: ['channels:read', 'chat:write'],
        rateLimitPerMinute: 60,
      },
      requiredEnvVars: ['SLACK_CLIENT_ID', 'SLACK_CLIENT_SECRET'],
      status: 'available',
    });

    this.register({
      type: IntegrationType.COMMUNICATION,
      provider: IntegrationProvider.MICROSOFT_TEAMS,
      name: 'Microsoft Teams',
      description: 'Collaboration platform',
      capabilities: {
        supportsFullSync: false,
        supportsIncrementalSync: false,
        supportsWebhooks: true,
        supportsRealTime: true,
        supportedEntities: ['teams', 'channels', 'messages'],
        requiresOAuth: true,
        supportedScopes: ['Team.ReadBasic.All', 'Channel.ReadBasic.All'],
        rateLimitPerMinute: 120,
      },
      requiredEnvVars: ['MSTEAMS_CLIENT_ID', 'MSTEAMS_CLIENT_SECRET', 'MSTEAMS_TENANT_ID'],
      status: 'available',
    });

    logger.info('Built-in integrations registered', {
      count: this.registry.size,
    });
  }
}
