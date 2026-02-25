import { NextResponse } from 'next/server'

export const runtime = 'edge'

export function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'shop-quoter',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  })
}
