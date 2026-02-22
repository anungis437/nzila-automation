// @ts-nocheck
import { NextResponse } from 'next/server';
/**
 * POST /api/governance/board-packets/[id]/distribute
 * Migrated to withApi() framework
 */
import { boardPacketGenerator } from '@/lib/services/board-packet-generator';
import { logger } from '@/lib/logger';

import { withApi, ApiError, z } from '@/lib/api/framework';

const distributePacketSchema = z.object({
  recipients: z.array(z.object({
    recipientId: z.string().uuid(),
    recipientName: z.string(),
    recipientEmail: z.string().email(),
    recipientRole: z.string(),
  })),
});

export const POST = withApi(
  {
    auth: { required: false },
    body: distributePacketSchema,
    openapi: {
      tags: ['Governance'],
      summary: 'POST distribute',
    },
  },
  async ({ request, userId, organizationId, user, body, query, params }) => {

        const packetId = params.id;
        const body = await request.json();
        // Validate input
        const { recipients } = distributePacketSchema.parse(body);
        // Distribute packet
        const distributions = await boardPacketGenerator.distributePacket(
          packetId,
          recipients
        );
        return NextResponse.json({
          message: 'Board packet distributed successfully',
          distributions,
          stats: {
            totalRecipients: recipients.length,
            sent: distributions.length,
          },
        });
  },
);
