import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

/** POST /api/members/bulk  bulk member operations
 *   Django POST /api/auth_core/organization-members/bulk/
 */
export function POST(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/organization-members/bulk/', { method: 'POST' });
}