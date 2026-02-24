// Fixture: route handler that directly imports DB (violation)
import { NextResponse } from 'next/server'
import { db } from '@nzila/db'
import { users } from '@nzila/db/schema'

export async function GET() {
  const allUsers = await db.select().from(users)
  return NextResponse.json(allUsers)
}
