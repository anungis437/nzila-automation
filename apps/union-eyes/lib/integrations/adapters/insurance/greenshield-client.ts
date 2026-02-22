/**
 * Green Shield Canada API Client
 * 
 * Enterprise health and dental insurance provider
 * API Documentation: https://developer.greenshield.ca/
 * 
 * Features:
 * - OAuth2 authentication with refresh tokens
 * - Benefit plans, enrollments, claims
 * - Prescription drug coverage
 * - Dental and vision benefits
 */

import { AuthenticationError, RateLimitError, IntegrationError } from '../../errors';

export interface GreenShieldConfig {
  clientId: string;
  clientSecret: string;
  groupNumber: string;
  refreshToken?: string;
  environment: 'production' | 'sandbox';
}

export interface GreenShieldPlan {
  external_id: string;
  plan_name: string;
  plan_type: string;
  coverage_level: string;
  premium: number;
  deductible?: number;
  coinsurance_percent?: number;
  max_out_of_pocket?: number;
  status: string;
  effective_date: string;
  expiry_date?: string;
  modified_at?: string;
}

export interface GreenShieldEnrollment {
  external_id: string;
  employee_id: string;
  employee_name: string;
  plan_id: string;
  coverage_start: string;
  coverage_end?: string;
  employee_contribution: number;
  employer_contribution: number;
  status: string;
  modified_at?: string;
}

export interface GreenShieldClaim {
  external_id: string;
  claim_number: string;
  member_name: string;
  claim_date: string;
  claim_type: string;
  claim_amount: number;
  approved_amount?: number;
  paid_amount?: number;
  status: string;
  provider_name?: string;
  service_date?: string;
  prescription_number?: string;
  drug_name?: string;
  modified_at?: string;
}

export interface GreenShieldCoverage {
  external_id: string;
  member_id: string;
  coverage_type: string;
  coverage_amount: number;
  deductible: number;
  deductible_met: number;
  coinsurance_percent: number;
  out_of_pocket_max: number;
  out_of_pocket_met: number;
  status: string;
  effective_date: string;
  expiry_date?: string;
}

/**
 * Green Shield Canada API Client
 */
export class GreenShieldClient {
  private config: GreenShieldConfig;
  private baseUrl: string;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(config: GreenShieldConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'sandbox'
      ? 'https://api-sandbox.greenshield.ca/v1'
      : 'https://api.greenshield.ca/v1';
  }

  /**
   * Authenticate and obtain access token
   */
  async authenticate(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: this.config.refreshToken ? 'refresh_token' : 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          ...(this.config.refreshToken ? { refresh_token: this.config.refreshToken } : {}),
        }),
      });

      if (!response.ok) {
        throw new AuthenticationError('Green Shield authentication failed');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.config.refreshToken = data.refresh_token;
      
      // Token expires in seconds
      const expiresIn = data.expires_in || 3600;
      this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
    } catch (error) {
      if (error instanceof AuthenticationError) throw error;
      throw new AuthenticationError('Green Shield authentication error: ' + (error as Error).message);
    }
  }

  /**
   * Ensure token is valid
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    await this.ensureAuthenticated();

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      throw new RateLimitError(`Rate limit exceeded. Retry after ${retryAfter}s`, retryAfter);
    }

    // Handle authentication errors
    if (response.status === 401) {
      this.accessToken = undefined;
      throw new AuthenticationError('Green Shield authentication expired');
    }

    if (!response.ok) {
      throw new IntegrationError(
        `Green Shield API error: ${response.status} ${response.statusText}`,
        'green_shield'
      );
    }

    return response.json();
  }

  /**
   * Get benefit plans
   */
  async getPlans(page = 1, perPage = 100, modifiedSince?: Date): Promise<GreenShieldPlan[]> {
    const params = new URLSearchParams({
      group_number: this.config.groupNumber,
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (modifiedSince) {
      params.set('modified_since', modifiedSince.toISOString());
    }

    const data = await this.makeRequest<{ plans: GreenShieldPlan[] }>(
      `/groups/${this.config.groupNumber}/plans?${params}`
    );

    return data.plans || [];
  }

  /**
   * Get enrollments
   */
  async getEnrollments(page = 1, perPage = 100, modifiedSince?: Date): Promise<GreenShieldEnrollment[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (modifiedSince) {
      params.set('modified_since', modifiedSince.toISOString());
    }

    const data = await this.makeRequest<{ enrollments: GreenShieldEnrollment[] }>(
      `/groups/${this.config.groupNumber}/enrollments?${params}`
    );

    return data.enrollments || [];
  }

  /**
   * Get insurance claims
   */
  async getClaims(page = 1, perPage = 100, modifiedSince?: Date): Promise<GreenShieldClaim[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (modifiedSince) {
      params.set('modified_since', modifiedSince.toISOString());
    }

    const data = await this.makeRequest<{ claims: GreenShieldClaim[] }>(
      `/groups/${this.config.groupNumber}/claims?${params}`
    );

    return data.claims || [];
  }

  /**
   * Get coverage details
   */
  async getCoverage(page = 1, perPage = 100): Promise<GreenShieldCoverage[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    const data = await this.makeRequest<{ coverage: GreenShieldCoverage[] }>(
      `/groups/${this.config.groupNumber}/coverage?${params}`
    );

    return data.coverage || [];
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest<{ status: string }>('/health');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | undefined {
    return this.config.refreshToken;
  }
}
