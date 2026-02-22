import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

/** GET  /api/members/segments  list member segments
 *   Django GET /api/unions/member-segments/
 *  POST /api/members/segments  create segment
 *   Django POST /api/unions/member-segments/
 */
export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/unions/member-segments/');
}
export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/unions/member-segments/', { method: 'POST' });
}