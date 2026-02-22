/**
 * Entitlements Service
 * 
 * Enforces subscription-tier-based feature access and credit consumption.
 * This is the core of the monetization gating system.
 * 
 * Usage:
 * ```typescript
 * import { checkEntitlement, consumeCredits, getOrganizationCredits } from '@/lib/services/entitlements';
 * 
 * // Check if feature is allowed
 * const result = await checkEntitlement(orgId, 'ai_summarize');
 * if (!result.allowed) {
 *   return { error: 'Upgrade required', upgradeUrl: '/pricing' };
 * }
 * 
 * // Consume credits for feature usage
 * await consumeCredits(orgId, 1);
 * ```
 */

import { db } from '@/db/db';
import { organizations } from '@/db/schema-organizations';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

/** All available features that can be gated */
export type GatedFeature =
  // AI Features
  | 'ai_search'
  | 'ai_summarize'
  | 'ai_classify'
  | 'ai_extract_clauses'
  | 'ai_match_precedents'
  | 'ai_semantic_search'
  | 'ai_mamba'
  | 'ai_feedback'
  | 'ai_ingest'
  // Advanced Features
  | 'advanced_analytics'
  | 'predictive_models'
  | 'custom_workflows'
  | 'api_access'
  | 'webhooks'
  | 'bulk_export'
  | 'third_party_integrations';

/** Subscription tier levels */
export type SubscriptionTier = 'free' | 'basic' | 'professional' | 'enterprise';

/** Result of an entitlement check */
export interface EntitlementCheck {
  allowed: boolean;
  feature: GatedFeature;
  tier: SubscriptionTier;
  reason?: string;
  upgradeUrl?: string;
  currentCredits?: number;
}

/** Credit balance information */
export interface CreditBalance {
  organizationId: string;
  credits: number;
  tier: SubscriptionTier;
  renewalDate?: Date;
}

// ============================================================================
// TIER-TO-FEATURE MAPPING
// ============================================================================

/**
 * Defines which features are available at each subscription tier.
 * Order matters: higher tiers include all features from lower tiers.
 */
export const TIER_FEATURES: Record<SubscriptionTier, GatedFeature[]> = {
  free: [
    // Limited AI access - just enough to demo
    'ai_search',
  ],
  basic: [
    'ai_search',
    'ai_summarize',
    'ai_classify',
  ],
  professional: [
    'ai_search',
    'ai_summarize',
    'ai_classify',
    'ai_extract_clauses',
    'ai_match_precedents',
    'ai_semantic_search',
    'advanced_analytics',
    'api_access',
  ],
  enterprise: [
    // All features including expensive ones
    'ai_search',
    'ai_summarize',
    'ai_classify',
    'ai_extract_clauses',
    'ai_match_precedents',
    'ai_semantic_search',
    'ai_mamba',
    'ai_feedback',
    'ai_ingest',
    'advanced_analytics',
    'predictive_models',
    'custom_workflows',
    'api_access',
    'webhooks',
    'bulk_export',
    'third_party_integrations',
  ],
};

/** Features that require credits (consumed per use) */
export const CREDIT_REQUIRING_FEATURES: GatedFeature[] = [
  'ai_search',
  'ai_summarize',
  'ai_classify',
  'ai_extract_clauses',
  'ai_match_precedents',
  'ai_semantic_search',
  'ai_mamba',
];

/** Credit cost per feature use */
export const CREDIT_COSTS: Record<GatedFeature, number> = {
  ai_search: 1,
  ai_summarize: 2,
  ai_classify: 2,
  ai_extract_clauses: 3,
  ai_match_precedents: 3,
  ai_semantic_search: 2,
  ai_mamba: 5,
  ai_feedback: 0, // Free - encourages improvement
  ai_ingest: 0,   // Free - data ingestion is valuable
  advanced_analytics: 2,
  predictive_models: 5,
  custom_workflows: 1,
  api_access: 0,  // Included in tier
  webhooks: 0,
  bulk_export: 1,
  third_party_integrations: 1,
};

// ============================================================================
// CREDIT ALLOCATION BY TIER
// ============================================================================

/** Monthly credits allocated per tier (0 means unlimited for enterprise) */
export const TIER_CREDITS: Record<SubscriptionTier, number> = {
  free: 5,
  basic: 50,
  professional: 200,
  enterprise: 0, // Unlimited
};

// ============================================================================
// ENTITLEMENT CHECK
// ============================================================================

/**
 * Check if an organization has access to a specific feature.
 * 
 * @param organizationId - The organization to check
 * @param feature - The feature being accessed
 * @returns EntitlementCheck with allowed status and details
 */
export async function checkEntitlement(
  organizationId: string,
  feature: GatedFeature
): Promise<EntitlementCheck> {
  try {
    // Get organization's subscription tier
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
      columns: {
        subscriptionTier: true,
        featuresEnabled: true,
      },
    });

    if (!org) {
      logger.warn('Entitlement check for unknown organization', { organizationId, feature });
      return {
        allowed: false,
        feature,
        tier: 'free',
        reason: 'Organization not found',
      };
    }

    const tier = (org.subscriptionTier as SubscriptionTier) || 'free';
    
    // Check if feature is in the tier's allowed list
    const allowedFeatures = TIER_FEATURES[tier];
    const isAllowed = allowedFeatures.includes(feature);

    if (!isAllowed) {
      const nextTier = getNextTier(tier);
      return {
        allowed: false,
        feature,
        tier,
        reason: `Feature "${feature}" requires ${nextTier} tier or higher`,
        upgradeUrl: `/pricing?feature=${feature}&current_tier=${tier}`,
      };
    }

    // For credit-requiring features, check credit balance
    if (CREDIT_REQUIRING_FEATURES.includes(feature)) {
      const balance = await getOrganizationCredits(organizationId);
      
      if (balance.tier !== 'enterprise' && balance.credits <= 0) {
        return {
          allowed: false,
          feature,
          tier,
          reason: 'Insufficient credits. Please upgrade or purchase credits.',
          upgradeUrl: '/pricing?tab=credits',
          currentCredits: 0,
        };
      }

      return {
        allowed: true,
        feature,
        tier,
        currentCredits: balance.credits,
      };
    }

    return {
      allowed: true,
      feature,
      tier,
    };
  } catch (error) {
    logger.error('Entitlement check failed', error instanceof Error ? error : new Error(String(error)), {
      organizationId,
      feature,
    });
    
    // Fail-secure: deny on error
    return {
      allowed: false,
      feature,
      tier: 'free',
      reason: 'Error checking entitlements. Please try again.',
    };
  }
}

/**
 * Check multiple features at once
 */
export async function checkEntitlements(
  organizationId: string,
  features: GatedFeature[]
): Promise<{
  allAllowed: boolean;
  results: EntitlementCheck[];
}> {
  const results = await Promise.all(
    features.map(feature => checkEntitlement(organizationId, feature))
  );
  
  return {
    allAllowed: results.every(r => r.allowed),
    results,
  };
}

// ============================================================================
// CREDIT MANAGEMENT
// ============================================================================

/**
 * Get the current credit balance for an organization
 */
export async function getOrganizationCredits(
  organizationId: string
): Promise<CreditBalance> {
  try {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
      columns: {
        subscriptionTier: true,
        settings: true,
      },
    });

    const tier = ((org?.subscriptionTier) as SubscriptionTier) || 'free';
    
    // Enterprise has unlimited credits
    if (tier === 'enterprise') {
      return {
        organizationId,
        credits: 0, // 0 means unlimited
        tier: 'enterprise',
      };
    }

    // Get credits from settings or use tier default
    const settings = (org?.settings as Record<string, unknown>) || {};
    const credits = (settings.credits as number) ?? TIER_CREDITS[tier];
    const renewalDate = settings.nextCreditRenewal 
      ? new Date(settings.nextCreditRenewal as string)
      : getNextRenewalDate();

    return {
      organizationId,
      credits,
      tier,
      renewalDate,
    };

  } catch (error) {
    logger.error('Failed to get credits', error instanceof Error ? error : new Error(String(error)), {
      organizationId,
    });
    
    // Return default for tier on error
    const tier: SubscriptionTier = 'free';
    return {
      organizationId,
      credits: TIER_CREDITS[tier],
      tier,
    };
  }
}

/**
 * Consume credits for feature usage
 * Returns false if insufficient credits (non-enterprise only)
 */
export async function consumeCredits(
  organizationId: string,
  amount: number,
  feature?: GatedFeature
): Promise<{
  success: boolean;
  remainingCredits: number;
  error?: string;
}> {
  try {
    const balance = await getOrganizationCredits(organizationId);

    // Enterprise tier has unlimited credits
    if (balance.tier === 'enterprise') {
      return {
        success: true,
        remainingCredits: 0, // Unlimited
      };
    }

    // Check if enough credits
    if (balance.credits < amount) {
      logger.warn('Insufficient credits', {
        organizationId,
        requested: amount,
        available: balance.credits,
        feature,
      });
      
      return {
        success: false,
        remainingCredits: balance.credits,
        error: `Insufficient credits. Need ${amount}, have ${balance.credits}.`,
      };
    }

    // Deduct credits
    const newBalance = balance.credits - amount;
    const settings = {};
    
    await db
      .update(organizations)
      .set({
        settings: {
          ...settings,
          credits: newBalance,
        } as never,
      })
      .where(eq(organizations.id, organizationId));

    logger.info('Credits consumed', {
      organizationId,
      amount,
      remaining: newBalance,
      feature,
    });

    return {
      success: true,
      remainingCredits: newBalance,
    };

  } catch (error) {
    logger.error('Failed to consume credits', error instanceof Error ? error : new Error(String(error)), {
      organizationId,
      amount,
      feature,
    });
    
    return {
      success: false,
      remainingCredits: 0,
      error: 'Failed to process credits',
    };
  }
}

/**
 * Add credits to an organization (admin function, e.g., for purchases)
 */
export async function addCredits(
  organizationId: string,
  amount: number,
  reason?: string
): Promise<{
  success: boolean;
  newBalance: number;
}> {
  try {
    const balance = await getOrganizationCredits(organizationId);
    
    if (balance.tier === 'enterprise') {
      return {
        success: true,
        newBalance: 0, // Unlimited
      };
    }

    const newBalance = balance.credits + amount;
    
    await db
      .update(organizations)
      .set({
        settings: {
          credits: newBalance,
          lastCreditPurchase: new Date().toISOString(),
          lastCreditReason: reason,
        } as never,
      })
      .where(eq(organizations.id, organizationId));

    logger.info('Credits added', {
      organizationId,
      amount,
      newBalance,
      reason,
    });

    return {
      success: true,
      newBalance,
    };

  } catch (error) {
    logger.error('Failed to add credits', error instanceof Error ? error : new Error(String(error)), {
      organizationId,
      amount,
    });
    
    return {
      success: false,
      newBalance: 0,
    };
  }
}

/**
 * Reset credits for a new billing cycle (called by cron job)
 */
export async function resetCreditsForBillingCycle(
  organizationId: string
): Promise<{
  success: boolean;
  newCredits: number;
}> {
  try {
    const balance = await getOrganizationCredits(organizationId);
    
    if (balance.tier === 'enterprise') {
      return {
        success: true,
        newCredits: 0,
      };
    }

    const newCredits = TIER_CREDITS[balance.tier];
    
    await db
      .update(organizations)
      .set({
        settings: {
          credits: newCredits,
          lastCreditReset: new Date().toISOString(),
          nextCreditRenewal: getNextRenewalDate().toISOString(),
        } as never,
      })
      .where(eq(organizations.id, organizationId));

    logger.info('Credits reset for billing cycle', {
      organizationId,
      tier: balance.tier,
      newCredits,
    });

    return {
      success: true,
      newCredits,
    };

  } catch (error) {
    logger.error('Failed to reset credits', error instanceof Error ? error : new Error(String(error)), {
      organizationId,
    });
    
    return {
      success: false,
      newCredits: 0,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the next tier up from current tier
 */
function getNextTier(current: SubscriptionTier): SubscriptionTier {
  const tierOrder: SubscriptionTier[] = ['free', 'basic', 'professional', 'enterprise'];
  const currentIndex = tierOrder.indexOf(current);
  if (currentIndex >= tierOrder.length - 1) {
    return 'enterprise';
  }
  return tierOrder[currentIndex + 1];
}

/**
 * Get the next credit renewal date (28 days from now)
 */
function getNextRenewalDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 28);
  return date;
}

/**
 * Check if a feature requires credits
 */
export function featureRequiresCredits(feature: GatedFeature): boolean {
  return CREDIT_REQUIRING_FEATURES.includes(feature);
}

/**
 * Get the credit cost for a feature
 */
export function getCreditCost(feature: GatedFeature): number {
  return CREDIT_COSTS[feature] || 0;
}

/**
 * Get all available features for a tier
 */
export function getFeaturesForTier(tier: SubscriptionTier): GatedFeature[] {
  return TIER_FEATURES[tier];
}

/**
 * Check if organization has any paid features
 */
export function isPaidTier(tier: SubscriptionTier): boolean {
  return tier !== 'free';
}
