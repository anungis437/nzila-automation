/**
 * CLC Analytics - Forecasting API
 * 
 * GET /api/admin/clc/analytics/forecast
 * 
 * Returns forecasted remittance data with confidence intervals
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logApiAuditEvent } from '@/lib/middleware/api-security';
import { forecastRemittances } from '@/services/clc/compliance-reports';
import { getCurrentUser, withAdminAuth, withApiAuth, withMinRole, withRoleAuth } from '@/lib/api-auth-guard';

import {
  ErrorCode,
  standardErrorResponse,
  standardSuccessResponse,
} from '@/lib/api/standardized-responses';
export const GET = async (request: NextRequest) => {
  return withRoleAuth(90, async (request, context) => {
    const { userId } = context;

  try {
        const searchParams = request.nextUrl.searchParams;
        const monthsAhead = parseInt(searchParams.get('months') || '12');

        if (monthsAhead < 1 || monthsAhead > 24) {
          logApiAuditEvent({
            timestamp: new Date().toISOString(), userId,
            endpoint: '/api/admin/clc/analytics/forecast',
            method: 'GET',
            eventType: 'validation_failed',
            severity: 'low',
            details: { reason: 'Invalid months parameter', monthsAhead },
          });
          return standardErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      'Invalid months parameter. Must be between 1 and 24'
    );
        }

        const forecast = await forecastRemittances(monthsAhead);

        logApiAuditEvent({
          timestamp: new Date().toISOString(), userId,
          endpoint: '/api/admin/clc/analytics/forecast',
          method: 'GET',
          eventType: 'success',
          severity: 'low',
          details: { dataType: 'ANALYTICS', monthsAhead },
        });

        return NextResponse.json(forecast, {
          headers: {
            'Cache-Control': 'public, max-age=7200' // Cache for 2 hours
          }
        });

      } catch (error) {
        logApiAuditEvent({
          timestamp: new Date().toISOString(), userId,
          endpoint: '/api/admin/clc/analytics/forecast',
          method: 'GET',
          eventType: 'server_error',
          severity: 'high',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        });
return standardErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      'Failed to generate forecast',
      error
    );
      }
      })(request);
};


