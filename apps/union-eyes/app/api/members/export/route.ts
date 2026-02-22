import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

/** GET /api/members/export  export members CSV/XLSX
 *   Django GET /api/auth_core/organization-members/export/
 */
export function GET(req: NextRequest) {
  return djangoProxy(req, '/api/auth_core/organization-members/export/');
}