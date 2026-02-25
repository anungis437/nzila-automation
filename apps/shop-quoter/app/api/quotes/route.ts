import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { quoteRepo } from '@/lib/db'

/**
 * GET /api/quotes — list all quotes for the current org.
 * POST /api/quotes — create a new quote.
 */

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const quotes = await quoteRepo.findAll('default')
    return NextResponse.json({ ok: true, data: quotes })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()

    // Minimal validation
    if (!body.title) {
      return NextResponse.json(
        { ok: false, error: 'title is required' },
        { status: 400 },
      )
    }

    const quote = await quoteRepo.create({
      entityId: body.entityId ?? 'default',
      title: body.title,
      tier: body.tier ?? 'STANDARD',
      customerId: body.customerId ?? 'unknown',
      boxCount: body.boxCount ?? 1,
      theme: body.theme,
      notes: body.notes,
      lines: body.lines ?? [],
    })

    return NextResponse.json({ ok: true, data: quote }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
