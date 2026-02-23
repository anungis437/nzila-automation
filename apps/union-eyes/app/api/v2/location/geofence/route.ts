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
  geofenceType: z.unknown().optional(),
  centerLatitude: z.string().min(1, 'centerLatitude is required'),
  centerLongitude: z.string().min(1, 'centerLongitude is required'),
  radiusMeters: z.unknown().optional(),
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
  async ({ request, userId, organizationId, user, body, query }) => {

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const geofenceId = searchParams.get("geofenceId");
        const latitude = searchParams.get("latitude");
        const longitude = searchParams.get("longitude");
        if (!userId || !geofenceId || !latitude || !longitude) {
          throw ApiError.badRequest('Missing required parameters: userId, geofenceId, latitude, longitude'
        );
        }
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        if (isNaN(lat) || isNaN(lon)) {
          throw ApiError.badRequest('Invalid latitude or longitude'
        );
        }
        const result = await GeofencePrivacyService.checkGeofenceEntry(userId, lat, lon, geofenceId);
        return NextResponse.json({
          userId,
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
  async ({ request, userId, organizationId, user, body, query }) => {

        const body = await request.json();
        const { name, description, geofenceType, centerLatitude, centerLongitude, radiusMeters, strikeId, unionLocalId } = body;
        if (!name || !geofenceType || centerLatitude === undefined || centerLongitude === undefined || !radiusMeters) {
          throw ApiError.badRequest('Missing required fields: name, geofenceType, centerLatitude, centerLongitude, radiusMeters'
        );
        }
        // Validate coordinates
        if (centerLatitude < -90 || centerLatitude > 90) {
          throw ApiError.badRequest('Invalid centerLatitude (must be -90 to 90)'
        );
        }
        if (centerLongitude < -180 || centerLongitude > 180) {
          throw ApiError.badRequest('Invalid centerLongitude (must be -180 to 180)'
        );
        }
        if (radiusMeters <= 0) {
          throw ApiError.badRequest('Invalid radiusMeters (must be > 0)'
        );
        }
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
