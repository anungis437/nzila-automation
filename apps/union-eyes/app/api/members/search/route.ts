import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

/** GET /api/members/search?q=...&role=...&status=...
 *   Django GET /api/auth_core/organization-members/?search=...
 */
export function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? url.searchParams.get('query') ?? '';
  const role = url.searchParams.get('role') ?? '';
  const status = url.searchParams.get('status') ?? '';

  const params = new URLSearchParams();
  if (q) params.set('search', q);
  if (role) params.set('role', role);
  if (status) params.set('status', status);

  return djangoProxy(req, `/api/auth_core/organization-members/?${params.toString()}`);
}
