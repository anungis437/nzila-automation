/**
 * FinOps Recommendations Engine
 *
 * Analyzes usage patterns and generates cost optimization
 * recommendations per org with estimated savings.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type RecommendationCategory =
  | 'right-sizing'
  | 'idle-resources'
  | 'reserved-capacity'
  | 'data-lifecycle'
  | 'ai-optimization'
  | 'egress-reduction';

export type RecommendationPriority = 'high' | 'medium' | 'low';

export interface Recommendation {
  id: string;
  orgId: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  description: string;
  estimatedMonthlySavings: number;
  effort: 'low' | 'medium' | 'high';
  action: string;
  createdAt: string;
}

export interface UsageSnapshot {
  orgId: string;
  period: string;
  aiRequests: number;
  aiTokensUsed: number;
  storageGb: number;
  computeHours: number;
  egressGb: number;
  dbConnectionPeak: number;
  integrationCalls: number;
  avgResponseTimeMs: number;
}

// ── Recommendation Engine ─────────────────────────────────────────────────────

/**
 * Generate FinOps recommendations from usage data.
 *
 * Analyzes usage patterns against best practices and
 * produces actionable, prioritized recommendations.
 */
export function generateRecommendations(
  snapshots: UsageSnapshot[],
  pricing: PricingConfig = DEFAULT_PRICING,
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const snapshot of snapshots) {
    // AI optimization — high token usage with low request count suggests verbose prompts
    if (snapshot.aiTokensUsed > 0 && snapshot.aiRequests > 0) {
      const tokensPerRequest = snapshot.aiTokensUsed / snapshot.aiRequests;
      if (tokensPerRequest > 2000) {
        recommendations.push({
          id: `${snapshot.orgId}-ai-tokens-${snapshot.period}`,
          orgId: snapshot.orgId,
          category: 'ai-optimization',
          priority: 'high',
          title: 'Reduce AI token consumption',
          description: `Average ${Math.round(tokensPerRequest)} tokens per AI request. Optimize prompt engineering to reduce token usage.`,
          estimatedMonthlySavings:
            (tokensPerRequest - 1500) * snapshot.aiRequests * 30 * pricing.aiTokenCost,
          effort: 'medium',
          action: 'Review prompt templates in @nzila/ai-sdk usage. Consider prompt caching and response streaming.',
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Storage lifecycle — high storage with no lifecycle policy
    if (snapshot.storageGb > 50) {
      const coolTierSavings = snapshot.storageGb * 0.3 * pricing.storageHotGbMonth;
      recommendations.push({
        id: `${snapshot.orgId}-storage-lifecycle-${snapshot.period}`,
        orgId: snapshot.orgId,
        category: 'data-lifecycle',
        priority: snapshot.storageGb > 200 ? 'high' : 'medium',
        title: 'Implement storage lifecycle policy',
        description: `${snapshot.storageGb}GB in hot storage. Move infrequently accessed data to cool/archive tier.`,
        estimatedMonthlySavings: coolTierSavings,
        effort: 'low',
        action: 'Configure Azure Blob lifecycle management to move blobs older than 30 days to cool tier.',
        createdAt: new Date().toISOString(),
      });
    }

    // Right-sizing — low compute utilization
    if (snapshot.computeHours > 0 && snapshot.computeHours < 10) {
      recommendations.push({
        id: `${snapshot.orgId}-right-size-${snapshot.period}`,
        orgId: snapshot.orgId,
        category: 'right-sizing',
        priority: 'medium',
        title: 'Right-size compute resources',
        description: `Only ${snapshot.computeHours} compute hours used. Consider scaling down container app resources.`,
        estimatedMonthlySavings: pricing.computeHourCost * 50,
        effort: 'low',
        action: 'Reduce Container App min replicas or CPU/memory allocation.',
        createdAt: new Date().toISOString(),
      });
    }

    // Egress reduction
    if (snapshot.egressGb > 50) {
      recommendations.push({
        id: `${snapshot.orgId}-egress-${snapshot.period}`,
        orgId: snapshot.orgId,
        category: 'egress-reduction',
        priority: 'high',
        title: 'Reduce data egress',
        description: `${snapshot.egressGb}GB egress detected. High egress drives significant Azure costs.`,
        estimatedMonthlySavings: (snapshot.egressGb - 30) * pricing.egressGbCost,
        effort: 'medium',
        action: 'Enable CDN caching, compress API responses, and review blob download patterns.',
        createdAt: new Date().toISOString(),
      });
    }

    // Idle DB connections
    if (snapshot.dbConnectionPeak > 30) {
      recommendations.push({
        id: `${snapshot.orgId}-db-pool-${snapshot.period}`,
        orgId: snapshot.orgId,
        category: 'idle-resources',
        priority: 'medium',
        title: 'Optimize database connection pooling',
        description: `Peak ${snapshot.dbConnectionPeak} DB connections. High connection counts waste server resources.`,
        estimatedMonthlySavings: pricing.dbConnectionCost * (snapshot.dbConnectionPeak - 20),
        effort: 'low',
        action: 'Configure connection pooling with PgBouncer or review Drizzle connection pool settings.',
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Sort by estimated savings (highest first)
  return recommendations.sort((a, b) => b.estimatedMonthlySavings - a.estimatedMonthlySavings);
}

// ── Savings Estimation ────────────────────────────────────────────────────────

/**
 * Estimate total potential savings from a set of recommendations.
 */
export function estimateSavings(recommendations: Recommendation[]): {
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  byCategory: Record<RecommendationCategory, number>;
  byPriority: Record<RecommendationPriority, number>;
} {
  const byCategory = {} as Record<RecommendationCategory, number>;
  const byPriority = {} as Record<RecommendationPriority, number>;

  let totalMonthlySavings = 0;

  for (const rec of recommendations) {
    totalMonthlySavings += rec.estimatedMonthlySavings;
    byCategory[rec.category] = (byCategory[rec.category] ?? 0) + rec.estimatedMonthlySavings;
    byPriority[rec.priority] = (byPriority[rec.priority] ?? 0) + rec.estimatedMonthlySavings;
  }

  return {
    totalMonthlySavings: Math.round(totalMonthlySavings * 100) / 100,
    totalAnnualSavings: Math.round(totalMonthlySavings * 12 * 100) / 100,
    byCategory,
    byPriority,
  };
}

// ── Pricing Configuration ─────────────────────────────────────────────────────

export interface PricingConfig {
  aiTokenCost: number;          // per token
  storageHotGbMonth: number;    // per GB/month
  computeHourCost: number;      // per vCPU-hour
  egressGbCost: number;         // per GB
  dbConnectionCost: number;     // per connection/month
}

const DEFAULT_PRICING: PricingConfig = {
  aiTokenCost: 0.00003,          // ~$0.03 per 1K tokens (GPT-4o class)
  storageHotGbMonth: 0.0184,     // Azure Blob hot tier Canada Central
  computeHourCost: 0.06,         // Container Apps consumption vCPU
  egressGbCost: 0.087,           // Azure egress first 5TB
  dbConnectionCost: 2.0,         // estimated overhead per persistent connection
};
