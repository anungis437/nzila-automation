/**
 * Industrial Alliance (iA Financial) API Client
 * 
 * Major Canadian insurance and wealth management provider
 * API Documentation: https://developer.ia.ca/
 * 
 * Features:
 * - OAuth2 authentication
 * - Life, disability, critical illness insurance
 * - Group savings and retirement
 * - Claims and benefits processing
 */

import { AuthenticationError, RateLimitError, IntegrationError } from '../../errors';

export interface IndustrialAllianceConfig {
  clientId: string;
  clientSecret: string;
  groupAccountId: string;
  refreshToken?: string;
  environment: 'production' | 'sandbox';
}

export interface IAPolicy {
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

export interface IAClaim {
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
  diagnosis_code?: string;
  treatment_type?: string;
  modified_at?: string;
}

export interface IABeneficiary {
  external_id: string;
  policy_id: string;
  beneficiary_name: string;
  relationship: string;
  percentage: number;
  date_of_birth?: string;
  status: string;
}

export interface IAUtilization {
  external_id: string;
  member_id: string;
  benefit_type: string;
  maximum_benefit: number;
  utilized_amount: number;
  remaining_amount: number;
  coverage_year: number;
  status: string;
}

/**
 * Industrial Alliance API Client
 */
export class IndustrialAllianceClient {
  private config: IndustrialAllianceConfig;
  private baseUrl: string;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(config: IndustrialAllianceConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'sandbox'
      ? 'https://api-sandbox.ia.ca/v1'
      : 'https://api.ia.ca/v1';
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
        throw new AuthenticationError('Industrial Alliance authentication failed');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.config.refreshToken = data.refresh_token;
      
      const expiresIn = data.expires_in || 3600;
      this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
    } catch (error) {
      if (error instanceof AuthenticationError) throw error;
      throw new AuthenticationError('Industrial Alliance authentication error: ' + (error as Error).message);
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
      throw new AuthenticationError('Industrial Alliance authentication expired');
    }

    if (!response.ok) {
      throw new IntegrationError(
        `Industrial Alliance API error: ${response.status} ${response.statusText}`,
        'industrial_alliance'
      );
    }

    return response.json();
  }

  /**
   * Get policies
   */
  async getPolicies(page = 1, perPage = 100, modifiedSince?: Date): Promise<IAPolicy[]> {
    const params = new URLSearchParams({
      group_account_id: this.config.groupAccountId,
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (modifiedSince) {
      params.set('modified_since', modifiedSince.toISOString());
    }

    const data = await this.makeRequest<{ policies: IAPolicy[] }>(
      `/groups/${this.config.groupAccountId}/policies?${params}`
    );

    return data.policies || [];
  }

  /**
   * Get claims
   */
  async getClaims(page = 1, perPage = 100, modifiedSince?: Date): Promise<IAClaim[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (modifiedSince) {
      params.set('modified_since', modifiedSince.toISOString());
    }

    const data = await this.makeRequest<{ claims: IAClaim[] }>(
      `/groups/${this.config.groupAccountId}/claims?${params}`
    );

    return data.claims || [];
  }

  /**
   * Get beneficiaries
   */
  async getBeneficiaries(page = 1, perPage = 100): Promise<IABeneficiary[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    const data = await this.makeRequest<{ beneficiaries: IABeneficiary[] }>(
      `/groups/${this.config.groupAccountId}/beneficiaries?${params}`
    );

    return data.beneficiaries || [];
  }

  /**
   * Get benefit utilization
   */
  async getUtilization(page = 1, perPage = 100): Promise<IAUtilization[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    const data = await this.makeRequest<{ utilization: IAUtilization[] }>(
      `/groups/${this.config.groupAccountId}/utilization?${params}`
    );

    return data.utilization || [];
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
