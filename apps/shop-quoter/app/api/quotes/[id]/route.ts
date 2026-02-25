import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { quoteRepo } from '@/lib/db'

/**
 * GET /api/quotes/[id] — fetch a single quote.
 * PATCH /api/quotes/[id] — update a quote (status, fields).
 */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const quote = await quoteRepo.findById(id)
    if (!quote) {
      return NextResponse.json(
        { ok: false, error: 'Quote not found' },
        { status: 404 },
      )
    }
    return NextResponse.json({ ok: true, data: quote })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    const body = await request.json()
    const quote = await quoteRepo.update(id, body)
    return NextResponse.json({ ok: true, data: quote })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
