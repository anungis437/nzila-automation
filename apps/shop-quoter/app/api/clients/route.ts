import { NextResponse } from 'next/server'
import { authenticateOrgUser, withRequestContext } from '@/lib/api-guards'
import { withSpan } from '@nzila/os-core/telemetry'
import { customerRepo } from '@/lib/db'

/**
 * GET  /api/clients — list all clients.
 * POST /api/clients — create a new client.
 */

export async function GET(request: Request) {
  return withRequestContext(request, () =>
    withSpan('api.clients.list', { 'http.method': 'GET' }, async () => {
    const authResult = await authenticateOrgUser()
    if (!authResult.ok) return authResult.response
    try {
      const clients = await customerRepo.findAll()
      return NextResponse.json({ ok: true, data: clients })
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
        { status: 500 },
      )
    }
    }),
  )
}

export async function POST(request: Request) {
  return withRequestContext(request, () =>
    withSpan('api.clients.create', { 'http.method': 'POST' }, async () => {
    const authResult = await authenticateOrgUser()
    if (!authResult.ok) return authResult.response
    try {
      const body = await request.json()
    if (!body.name) {
      return NextResponse.json(
        { ok: false, error: 'name is required' },
        { status: 400 },
      )
    }

    const client = await customerRepo.create({
      orgId: authResult.orgId,
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
    }),
  )
}
