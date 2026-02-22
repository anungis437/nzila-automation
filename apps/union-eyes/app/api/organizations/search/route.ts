import { NextRequest } from 'next/server';
import { djangoProxy } from '@/lib/django-proxy';

export const dynamic = 'force-dynamic';

/** GET /api/organizations/search?q=...  Django GET /api/auth_core/organizations/?search=... */
export function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? url.searchParams.get('query') ?? '';
  const params = new URLSearchParams();
  if (q) params.set('search', q);
  return djangoProxy(req, '/api/auth_core/organizations/?' + params.toString());
}