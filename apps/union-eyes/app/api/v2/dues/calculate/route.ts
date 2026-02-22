/**
 * POST /api/v2/dues/calculate
 *
 * Calculate dues for a member over a given period.
 * Requires steward role or higher. Rate-limited under FINANCIAL_READ.
 *
 * Migrated to `withApi()` — previously withRoleAuth + manual rate-limit + mixed responses.
 */
import { DuesCalculationEngine } from '@/lib/dues-calculation-engine';
import { logApiAuditEvent } from '@/lib/middleware/api-security';
import { withApi, ApiError, z, RATE_LIMITS } from '@/lib/api/framework';

const calculateDuesSchema = z.object({
  memberId: z.string().uuid('Invalid member ID format'),
  periodStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Period start must be in YYYY-MM-DD format'),
  periodEnd: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Period end must be in YYYY-MM-DD format'),
  memberData: z.record(z.any()).optional(),
});

export const POST = withApi(
  {
    auth: { required: true, minRole: 'steward' },
    body: calculateDuesSchema,
    rateLimit: RATE_LIMITS.FINANCIAL_READ,
    openapi: {
      tags: ['Dues', 'Financial'],
      summary: 'Calculate member dues',
      description:
        'Calculate dues for a specific member over a date range. Requires steward role or above.',
    },
  },
  async ({ body, userId, organizationId }) => {
    const { memberId, periodStart, periodEnd, memberData } = body;

    const calculation = await DuesCalculationEngine.calculateMemberDues({
      organizationId: organizationId!,
      memberId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      memberData,
    });

    if (!calculation) {
      logApiAuditEvent({
        timestamp: new Date().toISOString(),
        userId: userId!,
        endpoint: '/api/v2/dues/calculate',
        method: 'POST',
        eventType: 'validation_failed',
        severity: 'medium',
        details: { reason: 'Unable to calculate dues', memberId },
      });
      throw ApiError.notFound('Unable to calculate dues for this member');
    }

    logApiAuditEvent({
      timestamp: new Date().toISOString(),
      userId: userId!,
      endpoint: '/api/v2/dues/calculate',
      method: 'POST',
      eventType: 'success',
      severity: 'high',
      details: {
        dataType: 'FINANCIAL',
        memberId,
        periodStart,
        periodEnd,
        calculatedAmount: calculation.amount,
      },
    });

    return { calculation };
  },
);
