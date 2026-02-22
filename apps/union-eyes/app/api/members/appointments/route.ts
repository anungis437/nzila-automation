import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

/** POST /api/members/appointments  create appointment
 *   Django POST /api/unions/appointments/
 */
export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/unions/appointments/', { method: 'POST' });
}