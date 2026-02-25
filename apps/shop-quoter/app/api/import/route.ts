import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { importLegacyRecordsAction, validateLegacyDataAction } from '@/lib/actions'

/**
 * POST /api/import — import legacy ShopMoiÇa records.
 * PUT  /api/import — validate legacy records (dry-run).
 */

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { ok: false, error: 'Request body must be a JSON array' },
        { status: 400 },
      )
    }
    const result = await importLegacyRecordsAction(body)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { ok: false, error: 'Request body must be a JSON array' },
        { status: 400 },
      )
    }
    const result = await validateLegacyDataAction(body)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
