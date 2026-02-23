/**
 * Sun Life Financial Group Benefits API Client
 * 
 * Provides access to Sun Life's group benefits platform for:
 * - Benefit plan management
 * - Employee enrollments
 * - Coverage details
 * - Dependent information
 * - Plan eligibility
 * 
 * Authentication: OAuth2 with refresh token
 * API Format: REST JSON
 * Rate Limit: 200 requests per minute
 * 
 * @see https://developer.sunlife.com (hypothetical)
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

export interface SunLifeConfig {
  clientId: string;
  clientSecret: string;
  groupNumber: string; // Sun Life group policy number
  refreshToken?: string;
  environment: 'production' | 'sandbox';
}

export interface SunLifePlan {
  planId: string;
  planName: string;
  planType: 'health' | 'dental' | 'vision' | 'life' | 'disability' | 'other';
  coverageLevel: 'employee' | 'employee_spouse' | 'family';
  effectiveDate: string;
  terminationDate?: string;
  premium: number;
  employerContribution: number;
  employeeContribution: number;
  status: 'active' | 'terminated' | 'pending';
}

export interface SunLifeEnrollment {
  enrollmentId: string;
  employeeId: string;
  employeeName: string;
  planId: string;
  planName: string;
  coverageLevel: string;
  enrollmentDate: string;
  effectiveDate: string;
  terminationDate?: string;
  status: 'active' | 'terminated' | 'pending';
  premium: number;
  employeeContribution: number;
}

export interface SunLifeDependent {
  dependentId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  relationship: 'spouse' | 'child' | 'other';
  status: 'active' | 'terminated';
}

export interface SunLifeCoverage {
  coverageId: string;
  enrollmentId: string;
  employeeId: string;
  planId: string;
  planType: string;
  coverageAmount: number;
  deductible: number;
  effectiveDate: string;
  terminationDate?: string;
  status: 'active' | 'terminated';
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  nextPage?: number;
  total: number;
}

// ============================================================================
// Sun Life API Client
// ============================================================================

export class SunLifeClient {
  private config: SunLifeConfig;
  private accessToken?: string;
  private refreshToken?: string;
  private tokenExpiry?: Date;
  private readonly baseUrl: string;

  constructor(config: SunLifeConfig) {
    this.config = config;
    this.refreshToken = config.refreshToken;
    this.baseUrl =
      config.environment === 'production'
        ? 'https://api.sunlife.com/v1'
        : 'https://sandbox-api.sunlife.com/v1';
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

      logger.info('Sun Life authentication successful', {
        groupNumber: this.config.groupNumber,
        expiresAt: this.tokenExpiry?.toISOString(),
      });
    } catch (error) {
      logger.error('Sun Life authentication failed', error instanceof Error ? error : new Error(String(error)));
      throw new AuthenticationError(
        'Failed to authenticate with Sun Life',
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
        'X-Group-Number': this.config.groupNumber,
        ...options.headers,
      },
    });

    if (response.status === 429) {
      throw new RateLimitError('Sun Life API rate limit exceeded');
    }

    if (response.status === 401) {
      // Try to refresh token and retry once
      await this.authenticate();
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Group-Number': this.config.groupNumber,
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
        `Sun Life API error: ${response.status} - ${error}`,
        'SUNLIFE',
        'API_ERROR'
      );
    }

    return response.json();
  }

  // ==========================================================================
  // Plans
  // ==========================================================================

  async getPlans(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<PaginatedResponse<SunLifePlan>> {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 100;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      ...(params?.status && { status: params.status }),
    });

    const response = await this.request<{
      plans: SunLifePlan[];
      pagination: { page: number; page_size: number; total: number; has_more: boolean };
    }>(`/groups/${this.config.groupNumber}/plans?${queryParams}`);

    return {
      data: response.plans,
      hasMore: response.pagination.has_more,
      nextPage: response.pagination.has_more ? page + 1 : undefined,
      total: response.pagination.total,
    };
  }

  // ==========================================================================
  // Enrollments
  // ==========================================================================

  async getEnrollments(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    modifiedSince?: Date;
  }): Promise<PaginatedResponse<SunLifeEnrollment>> {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 100;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      ...(params?.status && { status: params.status }),
      ...(params?.modifiedSince && { modified_since: params.modifiedSince.toISOString() }),
    });

    const response = await this.request<{
      enrollments: SunLifeEnrollment[];
      pagination: { page: number; page_size: number; total: number; has_more: boolean };
    }>(`/groups/${this.config.groupNumber}/enrollments?${queryParams}`);

    return {
      data: response.enrollments,
      hasMore: response.pagination.has_more,
      nextPage: response.pagination.has_more ? page + 1 : undefined,
      total: response.pagination.total,
    };
  }

  // ==========================================================================
  // Dependents
  // ==========================================================================

  async getDependents(params?: {
    page?: number;
    pageSize?: number;
    employeeId?: string;
  }): Promise<PaginatedResponse<SunLifeDependent>> {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 100;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      ...(params?.employeeId && { employee_id: params.employeeId }),
    });

    const response = await this.request<{
      dependents: SunLifeDependent[];
      pagination: { page: number; page_size: number; total: number; has_more: boolean };
    }>(`/groups/${this.config.groupNumber}/dependents?${queryParams}`);

    return {
      data: response.dependents,
      hasMore: response.pagination.has_more,
      nextPage: response.pagination.has_more ? page + 1 : undefined,
      total: response.pagination.total,
    };
  }

  // ==========================================================================
  // Coverage
  // ==========================================================================

  async getCoverage(params?: {
    page?: number;
    pageSize?: number;
    employeeId?: string;
    status?: string;
  }): Promise<PaginatedResponse<SunLifeCoverage>> {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 100;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      ...(params?.employeeId && { employee_id: params.employeeId }),
      ...(params?.status && { status: params.status }),
    });

    const response = await this.request<{
      coverage: SunLifeCoverage[];
      pagination: { page: number; page_size: number; total: number; has_more: boolean };
    }>(`/groups/${this.config.groupNumber}/coverage?${queryParams}`);

    return {
      data: response.coverage,
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
        `/groups/${this.config.groupNumber}/status`
      );
      return true;
    } catch {
      return false;
    }
  }
}
