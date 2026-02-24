import { NextResponse } from 'next/server';
/**
 * GET POST DELETE /api/location/consent
 * Migrated to withApi() framework
 */
import { GeofencePrivacyService } from "@/services/geofence-privacy-service";
import { withApi, ApiError, z } from '@/lib/api/framework';

const locationConsentSchema = z.object({
  userId: z.string().uuid('Invalid userId'),
  purpose: z.string().min(1, 'purpose is required'),
  purposeDescription: z.string().optional(),
  consentText: z.string().min(1, 'consentText is required'),
  allowedDuringStrike: z.boolean().optional(),
  allowedDuringEvents: z.boolean().optional(),
});

export const GET = withApi(
  {
    auth: { required: true },
    openapi: {
      tags: ['Location'],
      summary: 'GET consent',
    },
  },
  async ({ request }) => {

        const { searchParams } = new URL(request.url);
        const targetUserId = searchParams.get("userId");
        const context = searchParams.get("context") as "strike" | "event" | undefined;
        if (!targetUserId) {
          throw ApiError.badRequest('Missing userId parameter'
        );
        }
        const hasConsent = await GeofencePrivacyService.hasValidConsent(targetUserId, context);
        return NextResponse.json({
          userId: targetUserId,
          hasConsent,
          context,
        });
  },
);

export const POST = withApi(
  {
    auth: { required: true },
    body: locationConsentSchema,
    openapi: {
      tags: ['Location'],
      summary: 'POST consent',
    },
    successStatus: 201,
  },
  async ({ request, body }) => {

        const { userId: targetUserId, purpose, purposeDescription, consentText, allowedDuringStrike, allowedDuringEvents } = body;
        if (!targetUserId || !purpose || !purposeDescription || !consentText) {
          throw ApiError.badRequest('Missing required fields: userId, purpose, purposeDescription, consentText'
        );
        }
        // Get IP and User-Agent for audit
        const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
        const userAgent = request.headers.get("user-agent") || "unknown";
        const consent = await GeofencePrivacyService.requestLocationConsent({
          userId: targetUserId,
          purpose,
          purposeDescription,
          consentText,
          allowedDuringStrike,
          allowedDuringEvents,
          ipAddress,
          userAgent,
        });
        return { consent,
            message: "Location tracking consent granted. Data will be retained for 24 hours maximum.", };
  },
);

export const DELETE = withApi(
  {
    auth: { required: true },
    body: locationConsentSchema,
    openapi: {
      tags: ['Location'],
      summary: 'DELETE consent',
    },
  },
  async ({ request }) => {

        const { searchParams } = new URL(request.url);
        const targetUserId = searchParams.get("userId");
        const reason = searchParams.get("reason");
        if (!targetUserId) {
          throw ApiError.badRequest('Missing userId parameter'
        );
        }
        await GeofencePrivacyService.revokeLocationConsent(targetUserId, reason || undefined);
        return { message: "Location tracking consent revoked. All location data has been deleted.", };
  },
);
