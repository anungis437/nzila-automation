/**
 * POST /api/v2/location/track
 *
 * Record user location for strike/picket/event tracking.
 * Requires explicit consent — enforced by GeofencePrivacyService.
 *
 * Migrated to `withApi()` — previously withApiAuth + inline Zod + mixed error handling.
 */
import { GeofencePrivacyService } from '@/services/geofence-privacy-service';
import { withApi, z } from '@/lib/api/framework';

const locationTrackSchema = z.object({
  userId: z.string().uuid('Invalid userId'),
  latitude: z
    .number()
    .min(-90, 'Latitude must be -90 to 90')
    .max(90, 'Latitude must be -90 to 90'),
  longitude: z
    .number()
    .min(-180, 'Longitude must be -180 to 180')
    .max(180, 'Longitude must be -180 to 180'),
  accuracy: z.number().positive().optional(),
  altitude: z.number().optional(),
  purpose: z.enum(['strike', 'picket', 'meeting', 'event', 'organizing']),
  activityType: z.string().max(100).optional(),
  strikeId: z.string().uuid('Invalid strikeId').optional(),
  eventId: z.string().uuid('Invalid eventId').optional(),
});

export const POST = withApi(
  {
    auth: { required: true },
    body: locationTrackSchema,
    successStatus: 201,
    openapi: {
      tags: ['Location'],
      summary: 'Track member location',
      description:
        'Record a member location event. Requires explicit consent. Data auto-deleted after 24 hours.',
    },
  },
  async ({ body }) => {
    const location = await GeofencePrivacyService.trackLocation(body);

    return {
      location,
      message:
        'Location recorded. Data will be automatically deleted after 24 hours.',
    };
  },
);
