/**
 * Canada Life API Client
 * 
 * Merged entity of Great-West Life and Canada Life
 * Group insurance and wealth management provider
 * API Documentation: https://developer.canadalife.com/
 * 
 * Features:
 * - OAuth2 authentication
 * - Life, disability, and health benefits
 * - Group retirement services
 * - Claims processing
 */

import { AuthenticationError, RateLimitError, IntegrationError } from '../../errors';

export interface CanadaLifeConfig {
  clientId: string;
  clientSecret: string;
  policyGroupId: string;
  refreshToken?: string;
  environment: 'production' | 'sandbox';
}

export interface CanadaLifePolicy {
  external_id: string;
  policy_number: string;
  policy_type: string;
  policy_holder: string;
  coverage_amount: number;
  premium: number;
  effective_date: string;
  expiry_date?: string;
  status: string;
  modified_at?: string;
}

export interface CanadaLifeClaim {
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
  disability_start_date?: string;
  estimated_return_date?: string;
  modified_at?: string;
}

export interface CanadaLifeBeneficiary {
  external_id: string;
  policy_id: string;
  beneficiary_name: string;
  relationship: string;
  percentage: number;
  date_of_birth?: string;
  status: string;
}

/**
 * Canada Life API Client
 */
export class CanadaLifeClient {
  private config: CanadaLifeConfig;
  private baseUrl: string;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(config: CanadaLifeConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'sandbox'
      ? 'https://api-sandbox.canadalife.com/v1'
      : 'https://api.canadalife.com/v1';
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
        throw new AuthenticationError('Canada Life authentication failed');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.config.refreshToken = data.refresh_token;
      
      const expiresIn = data.expires_in || 3600;
      this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
    } catch (error) {
      if (error instanceof AuthenticationError) throw error;
      throw new AuthenticationError('Canada Life authentication error: ' + (error as Error).message);
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

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      throw new RateLimitError(`Rate limit exceeded. Retry after ${retryAfter}s`, retryAfter);
    }

    if (response.status === 401) {
      this.accessToken = undefined;
      throw new AuthenticationError('Canada Life authentication expired');
    }

    if (!response.ok) {
      throw new IntegrationError(
        `Canada Life API error: ${response.status} ${response.statusText}`,
        'canada_life'
      );
    }

    return response.json();
  }

  /**
   * Get policies
   */
  async getPolicies(page = 1, perPage = 100, modifiedSince?: Date): Promise<CanadaLifePolicy[]> {
    const params = new URLSearchParams({
      policy_group_id: this.config.policyGroupId,
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (modifiedSince) {
      params.set('modified_since', modifiedSince.toISOString());
    }

    const data = await this.makeRequest<{ policies: CanadaLifePolicy[] }>(
      `/policy-groups/${this.config.policyGroupId}/policies?${params}`
    );

    return data.policies || [];
  }

  /**
   * Get claims
   */
  async getClaims(page = 1, perPage = 100, modifiedSince?: Date): Promise<CanadaLifeClaim[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (modifiedSince) {
      params.set('modified_since', modifiedSince.toISOString());
    }

    const data = await this.makeRequest<{ claims: CanadaLifeClaim[] }>(
      `/policy-groups/${this.config.policyGroupId}/claims?${params}`
    );

    return data.claims || [];
  }

  /**
   * Get beneficiaries
   */
  async getBeneficiaries(page = 1, perPage = 100): Promise<CanadaLifeBeneficiary[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    const data = await this.makeRequest<{ beneficiaries: CanadaLifeBeneficiary[] }>(
      `/policy-groups/${this.config.policyGroupId}/beneficiaries?${params}`
    );

    return data.beneficiaries || [];
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
