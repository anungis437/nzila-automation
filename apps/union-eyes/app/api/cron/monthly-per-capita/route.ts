/**
 * Monthly Per-Capita Cron Job
 * Purpose: Automatically calculate per-capita remittances on 1st of each month
 * Schedule: Runs at midnight UTC on the 1st day of every month
 * Vercel Cron: 0 0 1 * *
 */

import { NextRequest, NextResponse } from 'next/server';
import { processMonthlyPerCapita } from '@/services/clc/per-capita-calculator';
import { markOverdueRemittances } from '@/services/clc/per-capita-calculator';

import {
  ErrorCode,
  standardErrorResponse,
  standardSuccessResponse,
} from '@/lib/api/standardized-responses';
// =====================================================================================
// GET - Monthly per-capita calculation
// =====================================================================================

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (Vercel sets this header)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return standardErrorResponse(
      ErrorCode.AUTH_REQUIRED,
      'Unauthorized'
    );
    }
// Run monthly calculation
    const result = await processMonthlyPerCapita();

    // Mark overdue remittances
    const overdueCount = await markOverdueRemittances();
return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      calculation: result,
      overdueMarked: overdueCount,
    });
  } catch (error) {
return NextResponse.json(
      {
        error: 'Cron job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}

