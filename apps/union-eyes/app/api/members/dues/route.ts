import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

/** GET /api/members/dues  member dues history
 *   Django GET /api/billing/dues/
 */
export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/billing/dues/');
}