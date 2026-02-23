/**
 * Board Packet Distribution API
 * 
 * Handles distribution of board packets to recipients
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { boardPacketGenerator } from '@/lib/services/board-packet-generator';
import { logger } from '@/lib/logger';

// Validation schema for distribution
const distributePacketSchema = z.object({
  recipients: z.array(z.object({
    recipientId: z.string().uuid(),
    recipientName: z.string(),
    recipientEmail: z.string().email(),
    recipientRole: z.string(),
  })),
});

/**
 * POST /api/governance/board-packets/[id]/distribute
 * Distribute board packet to recipients
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const packetId = params.id;
    const body = await req.json();
    
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
  } catch (error: Record<string, unknown>) {
    logger.error('Error distributing board packet:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to distribute board packet', details: error.message },
      { status: 500 }
    );
  }
}
