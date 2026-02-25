import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { customerRepo } from '@/lib/db'

/**
 * GET  /api/clients — list all clients.
 * POST /api/clients — create a new client.
 */

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const clients = await customerRepo.findAll()
    return NextResponse.json({ ok: true, data: clients })
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
    if (!body.name) {
      return NextResponse.json(
        { ok: false, error: 'name is required' },
        { status: 400 },
      )
    }

    const client = await customerRepo.create({
      entityId: body.entityId ?? 'default',
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      address: body.address ?? null,
      zohoContactId: body.zohoContactId ?? null,
    })

    return NextResponse.json({ ok: true, data: client }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
