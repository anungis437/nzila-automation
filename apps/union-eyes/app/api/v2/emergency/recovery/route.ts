import { NextResponse } from 'next/server';
/**
 * GET POST /api/emergency/recovery
 * Migrated to withApi() framework
 */
import { purgeExpiredLocations } from '@/lib/services/geofence-privacy-service';
import type { EmergencyRecoveryRequest, EmergencyRecoveryResponse } from '@/lib/types/compliance-api-types';
import { withApi, ApiError, z } from '@/lib/api/framework';

const emergencyRecoverySchema = z.object({
  emergencyId: z.string().uuid('Invalid emergencyId'),
  memberId: z.string().uuid('Invalid memberId'),
});

export const GET = withApi(
  {
    auth: { required: true },
    openapi: {
      tags: ['Emergency'],
      summary: 'GET recovery',
    },
  },
  async ({ request, userId, organizationId, user, body, query }) => {

        const searchParams = request.nextUrl.searchParams;
        const emergencyId = searchParams.get('emergencyId');
        const memberId = searchParams.get('memberId');
        if (!emergencyId) {
          return NextResponse.json(
            {
              success: false,
              error: 'emergencyId parameter required',
              emergencyId: 'unknown',
              status: 'not_found',
              recoverySteps: [],
            } as EmergencyRecoveryResponse,
            { status: 400 }
          );
        }
        return NextResponse.json({
          success: true,
          emergencyId,
          status: 'recovery_pending',
          recoverySteps: [
            'Emergency declared',
            'Location consent granted',
            'Emergency mode active',
            'Recovery initiated',
          ],
          remainingActions: [
            'Complete 48-hour purge window',
            'Verify data cleanup',
            'Restore normal operations',
          ],
          message: `Recovery in progress for emergency ${emergencyId}`,
        } as EmergencyRecoveryResponse);
  },
);

export const POST = withApi(
  {
    auth: { required: true },
    body: emergencyRecoverySchema,
    openapi: {
      tags: ['Emergency'],
      summary: 'POST recovery',
    },
    successStatus: 201,
  },
  async ({ request, userId, organizationId, user, body, query }) => {

        // Validate request body
        if (!emergencyId || !memberId) {
          return NextResponse.json(
            {
              success: false,
              error: 'Missing required fields: emergencyId, memberId',
              emergencyId: emergencyId || 'unknown',
              status: 'failed',
              recoverySteps: [],
            } as EmergencyRecoveryResponse,
            { status: 400 }
          );
        }
        // Purge location data from emergency tracking
        const purgeResult = await purgeExpiredLocations(memberId, 48);
        const recoverySteps = [
          'End emergency mode',
          'Disable break-glass access',
          'Purge location tracking data (48-hour window)',
          'Restore normal geofence policies',
          'Notify member of data cleanup',
          'Archive incident logs',
        ];
        return NextResponse.json({
          success: true,
          emergencyId,
          status: 'recovery_in_progress',
          recoverySteps,
          completedAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          remainingActions: [
            'Await 48-hour purge window completion',
            'Member consent verification',
            'Restoration of normal operations',
          ],
          message: `Emergency recovery initiated for ${emergencyId}. Location data will be purged within 48 hours.`,
        } as EmergencyRecoveryResponse);
  },
);
