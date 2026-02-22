import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

/** POST /api/members/merge  merge duplicate member records
 *   Django POST /api/auth_core/organization-members/merge/
 */
export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/organization-members/merge/', { method: 'POST' });
}