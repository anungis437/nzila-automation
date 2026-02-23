/**
 * GET POST /api/admin/billing-cycles
 * Migrated to withApi() framework
 */
import { BillingCycleService, type BillingFrequency } from '@/lib/services/billing-cycle-service';
import { logger } from '@/lib/logger';

import { withApi, ApiError, z } from '@/lib/api/framework';

const billingCycleSchema = z.object({
  organizationId: z.string().uuid(),
  frequency: z.enum(['monthly', 'bi_weekly', 'weekly', 'quarterly', 'annual']),
  periodStart: z.string().optional(), // ISO date string
  periodEnd: z.string().optional(), // ISO date string
  dryRun: z.boolean().optional().default(false),
});

export const GET = withApi(
  {
    auth: { required: true },
    openapi: {
      tags: ['Admin'],
      summary: 'GET billing-cycles',
    },
  },
  async ({ request, userId, organizationId, user, body, query }) => {

        if (!user) {
          throw ApiError.unauthorized('Authentication required'
          );
        }
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');
        if (!organizationId) {
          throw ApiError.badRequest('organizationId query parameter is required'
          );
        }
        // TODO: Implement billing cycle history retrieval
        // This would query a billing_cycle_history table (to be created)
        // For now, return placeholder
        logger.info('Retrieving billing cycle history', {
          organizationId,
          userId: user.id,
        });
        return {
          cycles: [],
          total: 0,
          message: 'Billing cycle history retrieval not yet implemented. Coming in Phase 2 Week 2.',
        };
  },
);

export const POST = withApi(
  {
    auth: { required: true },
    body: billingCycleSchema,
    openapi: {
      tags: ['Admin'],
      summary: 'POST billing-cycles',
    },
    successStatus: 201,
  },
  async ({ request, userId, organizationId, user, body, query }) => {

        if (!user) {
          throw ApiError.unauthorized('Authentication required'
          );
        }
        // Parse and validate request body
        // Calculate period dates if not provided
        let start: Date;
        let end: Date;
        if (periodStart && periodEnd) {
          start = new Date(periodStart);
          end = new Date(periodEnd);
        } else {
          const dates = BillingCycleService.calculatePeriodDates(frequency);
          start = dates.periodStart;
          end = dates.periodEnd;
        }
        logger.info('Generating billing cycle', {
          organizationId,
          frequency,
          periodStart: start,
          periodEnd: end,
          dryRun,
          userId: user.id,
        });
        // Generate billing cycle
        const result = await BillingCycleService.generateBillingCycle({
          organizationId,
          periodStart: start,
          periodEnd: end,
          frequency,
          dryRun,
          executedBy: user.id,
        });
        if (dryRun) {
          logger.info('Billing cycle preview completed', {
            organizationId,
            transactionsWouldCreate: result.transactionsCreated,
            totalAmount: result.totalAmount,
          });
          return {
            preview: true,
            ...result,
            message: 'Preview generated successfully. No transactions were created.',
          };
        }
        logger.info('Billing cycle generated successfully', {
          organizationId,
          cycleId: result.cycleId,
          transactionsCreated: result.transactionsCreated,
          totalAmount: result.totalAmount,
        });
        return {
          ...result,
          message: `Billing cycle generated successfully. Created ${result.transactionsCreated} transactions totaling $${result.totalAmount}.`,
        };
  },
);
