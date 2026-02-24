// Fixture: clean runtime code — no console
import { NextResponse } from 'next/server'
import { logger } from '@nzila/os-core/telemetry'

export async function GET() {
  logger.info('fetching data')
  return NextResponse.json({ ok: true })
}
