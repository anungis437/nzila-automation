import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({ status: 'ok', app: 'mobility-client-portal', timestamp: new Date().toISOString() })
}
