/**
 * Manulife Financial Insurance Claims API Client
 * 
 * Provides access to Manulife's insurance claims system for:
 * - Insurance claims submission and tracking
 * - Claim status updates
 * - Policy information
 * - Benefit utilization
 * 
 * Authentication: OAuth2 with refresh token
 * API Format: REST JSON
 * Rate Limit: 150 requests per minute
 * 
 * @see https://developer.manulife.com (hypothetical)
 */

import {
  IntegrationError,
  RateLimitError,
  AuthenticationError,
} from '../../types';
import { logger } from '@/lib/logger';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ManulifeConfig {
  clientId: string;
  clientSecret: string;
  policyGroupId: string; // Manulife policy group identifier
  refreshToken?: string;
  environment: 'production' | 'sandbox';
}

export interface ManulifeClaim {
  claimId: string;
  claimNumber: string;
  employeeId: string;
  employeeName: string;
  policyNumber: string;
  claimType: 'health' | 'dental' | 'vision' | 'life' | 'disability' | 'other';
  serviceDate: string;
  submissionDate: string;
  processedDate?: string;
  claimAmount: number;
  approvedAmount: number;
  paidAmount?: number;
  deniedAmount?: number;
  status: 'submitted' | 'processing' | 'approved' | 'denied' | 'paid' | 'pending_info';
  denialReason?: string;
  providerId?: string;
  providerName?: string;
}

export interface ManulifePolicy {
  policyId: string;
  policyNumber: string;
  policyType: 'group_health' | 'group_dental' | 'life' | 'disability' | 'critical_illness';
  employeeId: string;
  effectiveDate: string;
  terminationDate?: string;
  coverageAmount: number;
  premium: number;
  status: 'active' | 'terminated' | 'suspended';
}

export interface ManulifeBeneficiary {
  beneficiaryId: string;
  policyId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  percentage: number;
  isPrimary: boolean;
  status: 'active' | 'removed';
}

export interface ManulifeUtilization {
  utilizationId: string;
  employeeId: string;
  policyId: string;
  benefitType: string;
  periodStart: string;
  periodEnd: string;
  maximumBenefit: number;
  utilized: number;
  remaining: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  nextPage?: number;
  total: number;
}

// ============================================================================
// Manulife API Client
// ============================================================================

export class ManulifeClient {
  private config: ManulifeConfig;
  private accessToken?: string;
  private refreshToken?: string;
  private tokenExpiry?: Date;
  private readonly baseUrl: string;

  constructor(config: ManulifeConfig) {
    this.config = config;
    this.refreshToken = config.refreshToken;
    this.baseUrl =
      config.environment === 'production'
        ? 'https://api.manulife.com/v1'
        : 'https://sandbox-api.manulife.com/v1';
  }

  // ==========================================================================
  // Authentication
  // ==========================================================================

  async authenticate(): Promise<void> {
    try {
      const response = await this.refreshAccessToken();
      this.accessToken = response.access_token;
      this.refreshToken = response.refresh_token || this.refreshToken;
      this.tokenExpiry = new Date(Date.now() + response.expires_in * 1000);

      logger.info('Manulife authentication successful', {
        policyGroupId: this.config.policyGroupId,
        expiresAt: this.tokenExpiry?.toISOString(),
      });
    } catch (error) {
      logger.error('Manulife authentication failed', error instanceof Error ? error : new Error(String(error)));
      throw new AuthenticationError(
        'Failed to authenticate with Manulife',
        error instanceof Error ? error : undefined
      );
    }
  }

  private async refreshAccessToken(): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
  }> {
    const token = this.refreshToken || this.config.refreshToken;
    if (!token) {
      throw new AuthenticationError('No refresh token available');
    }

    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: token,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new AuthenticationError(`Token refresh failed: ${error}`);
    }

    return response.json();
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiry) {
      await this.authenticate();
      return;
    }

    // Refresh 5 minutes before expiry
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    if (this.tokenExpiry < fiveMinutesFromNow) {
      await this.authenticate();
    }
  }

  getRefreshToken(): string | undefined {
    return this.refreshToken;
  }

  // ==========================================================================
  // API Requests
  // ==========================================================================

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    await this.ensureValidToken();

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'X-Policy-Group-Id': this.config.policyGroupId,
        ...options.headers,
      },
    });

    if (response.status === 429) {
      throw new RateLimitError('Manulife API rate limit exceeded');
    }

    if (response.status === 401) {
      // Try to refresh token and retry once
      await this.authenticate();
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Policy-Group-Id': this.config.policyGroupId,
          ...options.headers,
        },
      });

      if (!retryResponse.ok) {
        throw new AuthenticationError('Authentication failed after token refresh');
      }

      return retryResponse.json();
    }

    if (!response.ok) {
      const error = await response.text();
      throw new IntegrationError(
        `Manulife API error: ${response.status} - ${error}`,
        'MANULIFE',
        'API_ERROR'
      );
    }

    return response.json();
  }

  // ==========================================================================
  // Claims
  // ==========================================================================

  async getClaims(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    modifiedSince?: Date;
  }): Promise<PaginatedResponse<ManulifeClaim>> {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 100;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      ...(params?.status && { status: params.status }),
      ...(params?.modifiedSince && { modified_since: params.modifiedSince.toISOString() }),
    });

    const response = await this.request<{
      claims: ManulifeClaim[];
      pagination: { page: number; page_size: number; total: number; has_more: boolean };
    }>(`/policy-groups/${this.config.policyGroupId}/claims?${queryParams}`);

    return {
      data: response.claims,
      hasMore: response.pagination.has_more,
      nextPage: response.pagination.has_more ? page + 1 : undefined,
      total: response.pagination.total,
    };
  }

  // ==========================================================================
  // Policies
  // ==========================================================================

  async getPolicies(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<PaginatedResponse<ManulifePolicy>> {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 100;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      ...(params?.status && { status: params.status }),
    });

    const response = await this.request<{
      policies: ManulifePolicy[];
      pagination: { page: number; page_size: number; total: number; has_more: boolean };
    }>(`/policy-groups/${this.config.policyGroupId}/policies?${queryParams}`);

    return {
      data: response.policies,
      hasMore: response.pagination.has_more,
      nextPage: response.pagination.has_more ? page + 1 : undefined,
      total: response.pagination.total,
    };
  }

  // ==========================================================================
  // Beneficiaries
  // ==========================================================================

  async getBeneficiaries(params?: {
    page?: number;
    pageSize?: number;
    employeeId?: string;
  }): Promise<PaginatedResponse<ManulifeBeneficiary>> {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 100;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      ...(params?.employeeId && { employee_id: params.employeeId }),
    });

    const response = await this.request<{
      beneficiaries: ManulifeBeneficiary[];
      pagination: { page: number; page_size: number; total: number; has_more: boolean };
    }>(`/policy-groups/${this.config.policyGroupId}/beneficiaries?${queryParams}`);

    return {
      data: response.beneficiaries,
      hasMore: response.pagination.has_more,
      nextPage: response.pagination.has_more ? page + 1 : undefined,
      total: response.pagination.total,
    };
  }

  // ==========================================================================
  // Utilization
  // ==========================================================================

  async getUtilization(params?: {
    page?: number;
    pageSize?: number;
    employeeId?: string;
  }): Promise<PaginatedResponse<ManulifeUtilization>> {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 100;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      ...(params?.employeeId && { employee_id: params.employeeId }),
    });

    const response = await this.request<{
      utilization: ManulifeUtilization[];
      pagination: { page: number; page_size: number; total: number; has_more: boolean };
    }>(`/policy-groups/${this.config.policyGroupId}/utilization?${queryParams}`);

    return {
      data: response.utilization,
      hasMore: response.pagination.has_more,
      nextPage: response.pagination.has_more ? page + 1 : undefined,
      total: response.pagination.total,
    };
  }

  // ==========================================================================
  // Health Check
  // ==========================================================================

  async healthCheck(): Promise<boolean> {
    try {
      await this.request<{ status: string }>(
        `/policy-groups/${this.config.policyGroupId}/status`
      );
      return true;
    } catch {
      return false;
    }
  }
}
