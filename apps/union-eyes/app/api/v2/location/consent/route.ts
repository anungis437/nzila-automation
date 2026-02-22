// @ts-nocheck
import { NextResponse } from 'next/server';
/**
 * GET POST DELETE /api/location/consent
 * Migrated to withApi() framework
 */
import { GeofencePrivacyService } from "@/services/geofence-privacy-service";
import { withApi, ApiError, z } from '@/lib/api/framework';

const locationConsentSchema = z.object({
  userId: z.string().uuid('Invalid userId'),
  purpose: z.unknown().optional(),
  purposeDescription: z.string().optional(),
  consentText: z.unknown().optional(),
  allowedDuringStrike: z.unknown().optional(),
  allowedDuringEvents: z.unknown().optional(),
});

export const GET = withApi(
  {
    auth: { required: true },
    openapi: {
      tags: ['Location'],
      summary: 'GET consent',
    },
  },
  async ({ request, userId, organizationId, user, body, query }) => {

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const context = searchParams.get("context") as "strike" | "event" | undefined;
        if (!userId) {
          throw ApiError.badRequest('Missing userId parameter'
        );
        }
        const hasConsent = await GeofencePrivacyService.hasValidConsent(userId, context);
        return NextResponse.json({
          userId,
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
  async ({ request, userId, organizationId, user, body, query }) => {

        const body = await request.json();
        const { userId, purpose, purposeDescription, consentText, allowedDuringStrike, allowedDuringEvents } = body;
        if (!userId || !purpose || !purposeDescription || !consentText) {
          throw ApiError.badRequest('Missing required fields: userId, purpose, purposeDescription, consentText'
        );
        }
        // Get IP and User-Agent for audit
        const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
        const userAgent = request.headers.get("user-agent") || "unknown";
        const consent = await GeofencePrivacyService.requestLocationConsent({
          userId,
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
  async ({ request, userId, organizationId, user, body, query }) => {

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const reason = searchParams.get("reason");
        if (!userId) {
          throw ApiError.badRequest('Missing userId parameter'
        );
        }
        await GeofencePrivacyService.revokeLocationConsent(userId, reason || undefined);
        return { message: "Location tracking consent revoked. All location data has been deleted.", };
  },
);
