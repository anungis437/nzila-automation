// Fixture: route handler that correctly imports from service layer
import { NextResponse } from 'next/server'
import { getUsers } from '@/services/user-service'

export async function GET() {
  const users = await getUsers()
  return NextResponse.json(users)
}
