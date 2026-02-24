// Fixture: runtime code with console usage
import { NextResponse } from 'next/server'

export async function GET() {
  console.log('fetching data')
  console.error('something went wrong')
  console.warn('deprecation')
  console.info('info message')
  console.debug('debug trace')
  return NextResponse.json({ ok: true })
}
