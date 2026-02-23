import { NextResponse } from 'next/server';
/**
 * GET POST /api/location/geofence
 * Migrated to withApi() framework
 */
import { GeofencePrivacyService } from "@/services/geofence-privacy-service";
import { withApi, ApiError, z } from '@/lib/api/framework';

const locationGeofenceSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().optional(),
  geofenceType: z.string().min(1, 'geofenceType is required'),
  centerLatitude: z.coerce.number().min(-90).max(90),
  centerLongitude: z.coerce.number().min(-180).max(180),
  radiusMeters: z.coerce.number().positive('radiusMeters must be > 0'),
  strikeId: z.string().uuid('Invalid strikeId'),
  unionLocalId: z.string().uuid('Invalid unionLocalId'),
});

export const GET = withApi(
  {
    auth: { required: true },
    openapi: {
      tags: ['Location'],
      summary: 'GET geofence',
    },
  },
  async ({ request }) => {

        const { searchParams } = new URL(request.url);
        const targetUserId = searchParams.get("userId");
        const geofenceId = searchParams.get("geofenceId");
        const latitude = searchParams.get("latitude");
        const longitude = searchParams.get("longitude");
        if (!targetUserId || !geofenceId || !latitude || !longitude) {
          throw ApiError.badRequest('Missing required parameters: userId, geofenceId, latitude, longitude'
        );
        }
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        if (isNaN(lat) || isNaN(lon)) {
          throw ApiError.badRequest('Invalid latitude or longitude'
        );
        }
        const result = await GeofencePrivacyService.checkGeofenceEntry(targetUserId, lat, lon, geofenceId);
        return NextResponse.json({
          userId: targetUserId,
          geofenceId,
          inside: result.inside,
          distance: result.distance,
          message: result.inside ? "User is inside geofence" : "User is outside geofence",
        });
  },
);

export const POST = withApi(
  {
    auth: { required: true },
    body: locationGeofenceSchema,
    openapi: {
      tags: ['Location'],
      summary: 'POST geofence',
    },
    successStatus: 201,
  },
  async ({ body }) => {

        const { name, description, geofenceType, centerLatitude, centerLongitude, radiusMeters, strikeId, unionLocalId } = body;
        const geofence = await GeofencePrivacyService.createGeofence({
          name,
          description,
          geofenceType,
          centerLatitude,
          centerLongitude,
          radiusMeters,
          strikeId,
          unionLocalId,
        });
        return { geofence,
            message: "Geofence created successfully", };
  },
);
