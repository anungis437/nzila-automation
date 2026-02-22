// @ts-nocheck
import { logApiAuditEvent } from "@/lib/middleware/api-security";
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
/**
 * Social Media Analytics API Routes - Phase 10
 * 
 * Endpoints for retrieving analytics data and generating reports.
 * Supports account analytics, post performance, campaign metrics, and exports.
 */

import { NextRequest, NextResponse } from 'next/server';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { createClient } from '@supabase/supabase-js';
import { z } from "zod";
import { getCurrentUser, withAdminAuth, withApiAuth, withMinRole, withRoleAuth } from '@/lib/api-auth-guard';

import {
  ErrorCode,
  standardErrorResponse,
  standardSuccessResponse,
} from '@/lib/api/standardized-responses';
// Lazy initialization - env vars not available during build
let supabaseClient: ReturnType<typeof createClient> | null = null;
function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseClient;
}

export const GET = async (request: NextRequest) => {
  return withRoleAuth(20, async (request, context) => {
  try {
      const { userId, organizationId } = context;

      if (!organizationId) {
        return standardErrorResponse(
          ErrorCode.FORBIDDEN,
          'No organization found'
        );
      }

      // Rate limit check
      const rateLimitResult = await checkRateLimit(
        RATE_LIMITS.SOCIAL_MEDIA_API,
        `social-analytics-read:${userId}`
      );
      if (!rateLimitResult.allowed) {
        return standardErrorResponse(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded',
      { resetIn: rateLimitResult.resetIn }
    );
      }

      // Parse query parameters
      const searchParams = request.nextUrl.searchParams;
      const platform = searchParams.get('platform');
      const startDate = searchParams.get('start_date') || format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const endDate = searchParams.get('end_date') || format(new Date(), 'yyyy-MM-dd');
      const accountId = searchParams.get('account_id');

      // Build query
      let query = supabase
        .from('social_analytics')
        .select(
          `
        *,
        account:social_accounts!social_analytics_account_id_fkey(
          id,
          platform,
          platform_username,
          platform_account_name,
          profile_image_url
        )
      `
        )
        .eq('account.organization_id', organizationId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (platform) {
        query = query.eq('account.platform', platform);
      }

      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      query = query.order('date', { ascending: true });

      const { data: analytics, error } = await query;

      if (error) {
return standardErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      'Failed to fetch analytics'
    );
      }

      // Group analytics by account
      const accountAnalytics = (analytics || []).reduce((acc: Record<string, unknown>, record: Record<string, unknown>) => {
        const accountId = record.account_id;
        if (!acc[accountId]) {
          acc[accountId] = {
            account: record.account,
            analytics: [],
            summary: {
              total_impressions: 0,
              total_reach: 0,
              total_engagement: 0,
              total_likes: 0,
              total_comments: 0,
              total_shares: 0,
              total_clicks: 0,
              avg_engagement_rate: 0,
            },
          };
        }
        acc[accountId].analytics.push(record);
        
        // Update summary
        acc[accountId].summary.total_impressions += record.impressions || 0;
        acc[accountId].summary.total_reach += record.reach || 0;
        acc[accountId].summary.total_engagement += record.engagement || 0;
        acc[accountId].summary.total_likes += record.likes || 0;
        acc[accountId].summary.total_comments += record.comments || 0;
        acc[accountId].summary.total_shares += record.shares || 0;
        acc[accountId].summary.total_clicks += record.clicks || 0;
        
        return acc;
      }, {});

      // Calculate average engagement rate
      Object.values(accountAnalytics).forEach((account: Record<string, unknown>) => {
        const analyticsCount = account.analytics.length;
        if (analyticsCount > 0) {
          const totalEngagementRate = account.analytics.reduce(
            (sum: number, a: Record<string, unknown>) => sum + (a.engagement_rate || 0),
            0
          );
          account.summary.avg_engagement_rate = totalEngagementRate / analyticsCount;
        }
      });

      return NextResponse.json({
        accounts: Object.values(accountAnalytics),
        date_range: {
          start_date: startDate,
          end_date: endDate,
        },
      });
    } catch (error) {
return NextResponse.json(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
    })(request);
};


const socialMediaAnalyticsSchema = z.object({
  platform: z.unknown().optional(),
  campaign_id: z.string().uuid('Invalid campaign_id'),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  limit: z.unknown().optional().default(50),
  offset: z.unknown().optional().default(0),
});

export const POST = async (request: NextRequest) => {
  return withRoleAuth('member', async (request, context) => {
  try {
      const { userId, organizationId } = context;

      if (!organizationId) {
        return standardErrorResponse(
          ErrorCode.FORBIDDEN,
          'No organization found'
        );
      }

      // Rate limit check
      const rateLimitResult = await checkRateLimit(
        RATE_LIMITS.SOCIAL_MEDIA_API,
        `social-analytics-refresh:${userId}`
      );
      if (!rateLimitResult.allowed) {
        return standardErrorResponse(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded',
      { resetIn: rateLimitResult.resetIn }
    );
      }

      const body = await request.json();
    // Validate request body
    const validation = social-mediaAnalyticsSchema.safeParse(body);
    if (!validation.success) {
      return standardErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Invalid request data',
        validation.error.errors
      );
    }
    
    const { platform, campaign_id, start_date, end_date, limit = 50, offset = 0 } = validation.data;

      const startDateStr = start_date || format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const endDateStr = end_date || format(new Date(), 'yyyy-MM-dd');

      // Build query
      let query = supabase
        .from('social_posts')
        .select(
          `
        id,
        platform,
        content,
        media_urls,
        published_at,
        impressions,
        reach,
        engagement,
        likes,
        comments,
        shares,
        clicks,
        engagement_rate,
        account:social_accounts!social_posts_account_id_fkey(
          platform_username,
          platform_account_name
        ),
        campaign:social_campaigns(
          name
        )
      `,
          { count: 'exact' }
        )
        .eq('account.organization_id', organizationId)
        .eq('status', 'published')
        .gte('published_at', startDateStr)
        .lte('published_at', endDateStr);

      if (platform) {
        query = query.eq('platform', platform);
      }

      if (campaign_id) {
        query = query.eq('campaign_id', campaign_id);
      }

      query = query.order('engagement', { ascending: false }).range(offset, offset + limit - 1);

      const { data: posts, error, count } = await query;

      if (error) {
return standardErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      'Failed to fetch post analytics'
    );
      }

      // Calculate summary metrics
      const summary = (posts || []).reduce(
        (acc, post) => ({
          total_posts: acc.total_posts + 1,
          total_impressions: acc.total_impressions + (post.impressions || 0),
          total_reach: acc.total_reach + (post.reach || 0),
          total_engagement: acc.total_engagement + (post.engagement || 0),
          total_likes: acc.total_likes + (post.likes || 0),
          total_comments: acc.total_comments + (post.comments || 0),
          total_shares: acc.total_shares + (post.shares || 0),
          total_clicks: acc.total_clicks + (post.clicks || 0),
          avg_engagement_rate:
            acc.avg_engagement_rate + (post.engagement_rate || 0) / (posts?.length || 1),
        }),
        {
          total_posts: 0,
          total_impressions: 0,
          total_reach: 0,
          total_engagement: 0,
          total_likes: 0,
          total_comments: 0,
          total_shares: 0,
          total_clicks: 0,
          avg_engagement_rate: 0,
        }
      );

      // Find top performing posts
      const topPosts = [...(posts || [])].slice(0, 10);

      return NextResponse.json({
        posts: posts || [],
        top_posts: topPosts,
        summary,
        total: count || 0,
        limit,
        offset,
        date_range: {
          start_date: startDateStr,
          end_date: endDateStr,
        },
      });
    } catch (error) {
return NextResponse.json(
        {
          error: 'Failed to fetch post analytics',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
    })(request);
};

export const PUT = async (request: NextRequest) => {
  return withRoleAuth(20, async (request, context) => {
  try {
      const { userId, organizationId } = context;

      // Get campaign ID from query params
      const searchParams = request.nextUrl.searchParams;
      const campaignId = searchParams.get('id');

      if (!campaignId) {
        return standardErrorResponse(
      ErrorCode.MISSING_REQUIRED_FIELD,
      'Campaign ID required'
    );
      }

      // Verify user has access to this campaign
      const { data: campaign, error: fetchError } = await supabase
        .from('social_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (fetchError || !campaign) {
        return standardErrorResponse(
      ErrorCode.RESOURCE_NOT_FOUND,
      'Campaign not found'
    );
      }

      if (organizationId !== campaign.organization_id) {
        return standardErrorResponse(
          ErrorCode.FORBIDDEN,
          'Unauthorized'
        );
      }

      // Get campaign posts
      const { data: posts } = await supabase
        .from('social_posts')
        .select(
          `
        id,
        platform,
        content,
        published_at,
        impressions,
        reach,
        engagement,
        likes,
        comments,
        shares,
        clicks,
        engagement_rate,
        account:social_accounts!social_posts_account_id_fkey(
          platform_username,
          platform_account_name
        )
      `
        )
        .eq('campaign_id', campaignId)
        .eq('status', 'published')
        .order('published_at', { ascending: true });

      // Calculate overall metrics
      const metrics = (posts || []).reduce(
        (acc, post) => ({
          total_posts: acc.total_posts + 1,
          total_impressions: acc.total_impressions + (post.impressions || 0),
          total_reach: acc.total_reach + (post.reach || 0),
          total_engagement: acc.total_engagement + (post.engagement || 0),
          total_likes: acc.total_likes + (post.likes || 0),
          total_comments: acc.total_comments + (post.comments || 0),
          total_shares: acc.total_shares + (post.shares || 0),
          total_clicks: acc.total_clicks + (post.clicks || 0),
        }),
        {
          total_posts: 0,
          total_impressions: 0,
          total_reach: 0,
          total_engagement: 0,
          total_likes: 0,
          total_comments: 0,
          total_shares: 0,
          total_clicks: 0,
        }
      );

      // Calculate average engagement rate
      const avgEngagementRate =
        posts && posts.length > 0
          ? posts.reduce((sum, post) => sum + (post.engagement_rate || 0), 0) / posts.length
          : 0;

      // Calculate goal progress
      const goalProgress = campaign.goals?.map((goal: Record<string, unknown>) => {
        const currentValue = metrics[`total_${goal.metric}` as keyof typeof metrics] || 0;
        const progress = goal.target_value > 0 ? (currentValue / goal.target_value) * 100 : 0;
        return {
          ...goal,
          current_value: currentValue,
          progress: Math.min(progress, 100),
          achieved: currentValue >= goal.target_value,
        };
      });

      // Group posts by platform
      const postsByPlatform = (posts || []).reduce((acc: Record<string, unknown>, post) => {
        if (!acc[post.platform]) {
          acc[post.platform] = [];
        }
        acc[post.platform].push(post);
        return acc;
      }, {});

      // Calculate platform-specific metrics
      const platformMetrics = Object.entries(postsByPlatform).map(([platform, platformPosts]: [string, any]) => {
        const platformTotal = platformPosts.reduce(
          (acc: Record<string, unknown>, post: Record<string, unknown>) => ({
            posts: acc.posts + 1,
            impressions: acc.impressions + (post.impressions || 0),
            engagement: acc.engagement + (post.engagement || 0),
            likes: acc.likes + (post.likes || 0),
            comments: acc.comments + (post.comments || 0),
            shares: acc.shares + (post.shares || 0),
          }),
          { posts: 0, impressions: 0, engagement: 0, likes: 0, comments: 0, shares: 0 }
        );

        return {
          platform,
          ...platformTotal,
          avg_engagement_rate:
            platformPosts.reduce((sum: number, post: Record<string, unknown>) => sum + (post.engagement_rate || 0), 0) /
            platformPosts.length,
        };
      });

      // Get timeline data (daily metrics)
      const timeline = (posts || []).reduce((acc: Record<string, unknown>, post) => {
        const date = format(new Date(post.published_at), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = {
            date,
            posts: 0,
            impressions: 0,
            engagement: 0,
            likes: 0,
            comments: 0,
            shares: 0,
          };
        }
        acc[date].posts += 1;
        acc[date].impressions += post.impressions || 0;
        acc[date].engagement += post.engagement || 0;
        acc[date].likes += post.likes || 0;
        acc[date].comments += post.comments || 0;
        acc[date].shares += post.shares || 0;
        return acc;
      }, {});

      return NextResponse.json({
        campaign: {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          status: campaign.status,
        },
        metrics: {
          ...metrics,
          avg_engagement_rate: avgEngagementRate,
        },
        goal_progress: goalProgress,
        platform_metrics: platformMetrics,
        timeline: Object.values(timeline),
        top_posts: [...(posts || [])].sort((a, b) => (b.engagement || 0) - (a.engagement || 0)).slice(0, 5),
      });
    } catch (error) {
return NextResponse.json(
        {
          error: 'Failed to fetch campaign analytics',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
    })(request);
};

export const DELETE = async (request: NextRequest) => {
  return withRoleAuth(20, async (request, context) => {
  try {
      const { userId, organizationId } = context;

      if (!organizationId) {
        return standardErrorResponse(
          ErrorCode.FORBIDDEN,
          'No organization found'
        );
      }

      // Parse query parameters
      const searchParams = request.nextUrl.searchParams;
      const format_type = searchParams.get('format') || 'csv';
      const data_type = searchParams.get('type') || 'posts'; // posts, accounts, campaigns
      const startDate = searchParams.get('start_date') || format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const endDate = searchParams.get('end_date') || format(new Date(), 'yyyy-MM-dd');

      let data: Array<Record<string, unknown>> = [];
      let headers: string[] = [];

      switch (data_type) {
        case 'posts': {
          const { data: posts } = await supabase
            .from('social_posts')
            .select(
              `
            platform,
            content,
            published_at,
            impressions,
            reach,
            engagement,
            likes,
            comments,
            shares,
            clicks,
            engagement_rate,
            account:social_accounts(platform_username),
            campaign:social_campaigns(name)
          `
            )
            .eq('account.organization_id', organizationId)
            .eq('status', 'published')
            .gte('published_at', startDate)
            .lte('published_at', endDate)
            .order('published_at', { ascending: false });

          data = posts || [];
          headers = [
            'Platform',
            'Account',
            'Campaign',
            'Content',
            'Published At',
            'Impressions',
            'Reach',
            'Engagement',
            'Likes',
            'Comments',
            'Shares',
            'Clicks',
            'Engagement Rate',
          ];
          break;
        }

        case 'accounts': {
          const { data: analytics } = await supabase
            .from('social_analytics')
            .select(
              `
            date,
            impressions,
            reach,
            engagement,
            likes,
            comments,
            shares,
            clicks,
            engagement_rate,
            follower_count,
            account:social_accounts(platform, platform_username)
          `
            )
            .eq('account.organization_id', organizationId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });

          data = analytics || [];
          headers = [
            'Date',
            'Platform',
            'Account',
            'Impressions',
            'Reach',
            'Engagement',
            'Likes',
            'Comments',
            'Shares',
            'Clicks',
            'Engagement Rate',
            'Followers',
          ];
          break;
        }

        case 'campaigns': {
          const { data: campaigns } = await supabase
            .from('social_campaigns')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

          // Fetch metrics for each campaign
          data = await Promise.all(
            (campaigns || []).map(async (campaign) => {
              const { data: posts } = await supabase
                .from('social_posts')
                .select('impressions, engagement, likes, comments, shares, clicks')
                .eq('campaign_id', campaign.id);

              return {
                name: campaign.name,
                start_date: campaign.start_date,
                end_date: campaign.end_date,
                status: campaign.status,
                platforms: campaign.platforms?.join(', '),
                total_posts: posts?.length || 0,
                total_impressions: posts?.reduce((sum, p) => sum + (p.impressions || 0), 0) || 0,
                total_engagement: posts?.reduce((sum, p) => sum + (p.engagement || 0), 0) || 0,
                total_likes: posts?.reduce((sum, p) => sum + (p.likes || 0), 0) || 0,
                total_comments: posts?.reduce((sum, p) => sum + (p.comments || 0), 0) || 0,
                total_shares: posts?.reduce((sum, p) => sum + (p.shares || 0), 0) || 0,
                total_clicks: posts?.reduce((sum, p) => sum + (p.clicks || 0), 0) || 0,
              };
            })
          );

          headers = [
            'Campaign',
            'Start Date',
            'End Date',
            'Status',
            'Platforms',
            'Total Posts',
            'Impressions',
            'Engagement',
            'Likes',
            'Comments',
            'Shares',
            'Clicks',
          ];
          break;
        }

        default:
          return standardErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      'Invalid data type'
    );
      }

      // Generate CSV
      if (format_type === 'csv') {
        const csv = [
          headers.join(','),
          ...data.map((row) => {
            return headers
              .map((header) => {
                const key = header.toLowerCase().replace(/ /g, '_');
                let value = row[key] || '';
                
                // Handle nested objects
                if (typeof value === 'object' && value !== null) {
                  if (Array.isArray(value)) {
                    value = value.join('; ');
                  } else {
                    value = Object.values(value).join(' ');
                  }
                }
                
                // Escape quotes and wrap in quotes if contains comma
                value = String(value).replace(/"/g, '""');
                return value.includes(',') ? `"${value}"` : value;
              })
              .join(',');
          }),
        ].join('\n');

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="social-media-${data_type}-${format(
              new Date(),
              'yyyy-MM-dd'
            )}.csv"`,
          },
        });
      }

      // Return JSON
      return NextResponse.json({
        data,
        headers,
        date_range: {
          start_date: startDate,
          end_date: endDate,
        },
        exported_at: new Date().toISOString(),
      });
    } catch (error) {
return NextResponse.json(
        {
          error: 'Failed to export analytics',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
    })(request);
};

